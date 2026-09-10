import { randomBytes, timingSafeEqual } from "node:crypto";

export type InventoryCredentialPurpose = "ingress_bearer" | "feed_fetch";

export interface InventoryCredentialScope {
  readonly dealerOrgId: string;
  readonly inventorySourceId: string;
  readonly purpose: InventoryCredentialPurpose;
}

export interface ProvisionedInventoryCredential {
  readonly credentialReference: string;
  readonly revealOnceSecret: string;
  readonly version: number;
}

export interface RotatedInventoryCredential
  extends ProvisionedInventoryCredential {
  readonly previousReference: string;
  readonly retiringUntil: Date;
}

export interface InventoryCredentialProvider {
  readonly name: string;
  provision(
    scope: InventoryCredentialScope
  ): Promise<ProvisionedInventoryCredential>;
  resolveForVerification(
    credentialReference: string,
    scope: InventoryCredentialScope
  ): Promise<string>;
  revoke(
    credentialReference: string,
    scope: InventoryCredentialScope
  ): Promise<{ readonly revoked: boolean }>;
  rotate(
    credentialReference: string,
    scope: InventoryCredentialScope,
    retiringUntil: Date
  ): Promise<RotatedInventoryCredential>;
}

export class InventoryCredentialProviderNotConfiguredError extends Error {
  readonly code = "inventory_credential_provider_not_configured";
}

const notConfigured = (): never => {
  throw new InventoryCredentialProviderNotConfiguredError(
    "Writable inventory credential provider is not configured"
  );
};

const environmentCredentialReferencePattern =
  /^env:AUTOMARKET_INVENTORY_[A-Z0-9_]+$/;
const opaqueIdPattern = /^[A-Za-z0-9_-]{6,128}$/;
const defer = <Value>(operation: () => Value): Promise<Value> =>
  Promise.resolve().then(operation);

export const unconfiguredInventoryCredentialProvider: InventoryCredentialProvider =
  {
    name: "unconfigured",
    provision: async () => notConfigured(),
    resolveForVerification: async () => notConfigured(),
    revoke: async () => notConfigured(),
    rotate: async () => notConfigured(),
  };

const scopeKey = (scope: InventoryCredentialScope) =>
  `${scope.dealerOrgId}:${scope.inventorySourceId}:${scope.purpose}`;

const assertOpaqueId = (value: string, name: string) => {
  if (!opaqueIdPattern.test(value)) {
    throw new Error(`${name} must be an opaque identifier`);
  }
};

export const validateInventoryCredentialScope = (
  scope: InventoryCredentialScope
): void => {
  assertOpaqueId(scope.dealerOrgId, "dealerOrgId");
  assertOpaqueId(scope.inventorySourceId, "inventorySourceId");
};

interface StoredCredential {
  readonly reference: string;
  retiringUntil?: Date;
  revoked: boolean;
  readonly scope: string;
  readonly secret: string;
  readonly version: number;
}

export class InMemoryInventoryCredentialProvider
  implements InventoryCredentialProvider
{
  readonly name = "in-memory-test";
  readonly #credentials = new Map<string, StoredCredential>();

  provision(
    scope: InventoryCredentialScope
  ): Promise<ProvisionedInventoryCredential> {
    return defer(() => {
      validateInventoryCredentialScope(scope);
      const version =
        [...this.#credentials.values()].filter(
          (credential) => credential.scope === scopeKey(scope)
        ).length + 1;
      const reference = `inventory:token:${scope.dealerOrgId}:${scope.inventorySourceId}:${scope.purpose}:v${version}`;
      const secret = randomBytes(32).toString("base64url");
      this.#credentials.set(reference, {
        reference,
        revoked: false,
        scope: scopeKey(scope),
        secret,
        version,
      });
      return {
        credentialReference: reference,
        revealOnceSecret: secret,
        version,
      };
    });
  }

  resolveForVerification(
    credentialReference: string,
    scope: InventoryCredentialScope
  ): Promise<string> {
    return defer(() => {
      const credential = this.#credentials.get(credentialReference);
      if (
        !credential ||
        credential.scope !== scopeKey(scope) ||
        credential.revoked ||
        (credential.retiringUntil && credential.retiringUntil <= new Date())
      ) {
        throw new Error("Inventory credential was not found");
      }
      return credential.secret;
    });
  }

  revoke(
    credentialReference: string,
    scope: InventoryCredentialScope
  ): Promise<{ readonly revoked: boolean }> {
    return defer(() => {
      const credential = this.#credentials.get(credentialReference);
      if (!credential || credential.scope !== scopeKey(scope)) {
        return { revoked: false };
      }
      credential.revoked = true;
      return { revoked: true };
    });
  }

  async rotate(
    credentialReference: string,
    scope: InventoryCredentialScope,
    retiringUntil: Date
  ) {
    if (retiringUntil <= new Date()) {
      throw new Error("Credential rotation overlap must end in the future");
    }
    const current = this.#credentials.get(credentialReference);
    if (!current || current.scope !== scopeKey(scope) || current.revoked) {
      throw new Error("Inventory credential was not found");
    }
    const replacement = await this.provision(scope);
    current.retiringUntil = retiringUntil;
    return {
      ...replacement,
      previousReference: current.reference,
      retiringUntil,
    };
  }
}

export class ReadOnlyEnvironmentInventoryCredentialProvider
  implements InventoryCredentialProvider
{
  readonly name = "environment-read-only";
  readonly #environment: Readonly<Record<string, string | undefined>>;
  readonly #scopeBindings: Readonly<
    Record<string, InventoryCredentialScope | undefined>
  >;

  constructor(
    environment: Readonly<Record<string, string | undefined>>,
    scopeBindings: Readonly<
      Record<string, InventoryCredentialScope | undefined>
    >
  ) {
    this.#environment = environment;
    this.#scopeBindings = scopeBindings;
  }

  provision(_scope: InventoryCredentialScope): Promise<never> {
    return defer(notConfigured);
  }

  resolveForVerification(
    credentialReference: string,
    scope: InventoryCredentialScope
  ): Promise<string> {
    return defer(() => {
      if (!environmentCredentialReferencePattern.test(credentialReference)) {
        throw new Error("Environment credential reference is invalid");
      }
      const boundScope = this.#scopeBindings[credentialReference];
      if (!boundScope || scopeKey(boundScope) !== scopeKey(scope)) {
        throw new Error("Environment credential scope does not match");
      }
      const value = this.#environment[credentialReference.slice(4)];
      if (!value) {
        throw new Error("Environment credential is not configured");
      }
      return value;
    });
  }

  revoke(
    _credentialReference: string,
    _scope: InventoryCredentialScope
  ): Promise<never> {
    return defer(notConfigured);
  }

  rotate(
    _credentialReference: string,
    _scope: InventoryCredentialScope,
    _retiringUntil: Date
  ): Promise<never> {
    return defer(notConfigured);
  }
}

export const verifyInventoryCredential = async (
  provider: InventoryCredentialProvider,
  input: {
    readonly candidate: string;
    readonly credentialReference: string;
    readonly scope: InventoryCredentialScope;
  }
): Promise<boolean> => {
  const expected = await provider.resolveForVerification(
    input.credentialReference,
    input.scope
  );
  const expectedBytes = Buffer.from(expected);
  const candidateBytes = Buffer.from(input.candidate);
  return (
    expectedBytes.byteLength === candidateBytes.byteLength &&
    timingSafeEqual(expectedBytes, candidateBytes)
  );
};
