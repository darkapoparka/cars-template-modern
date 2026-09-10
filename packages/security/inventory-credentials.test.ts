import { describe, expect, test } from "vitest";
import {
  InMemoryInventoryCredentialProvider,
  ReadOnlyEnvironmentInventoryCredentialProvider,
  unconfiguredInventoryCredentialProvider,
  verifyInventoryCredential,
} from "./inventory-credentials";

describe("inventory credential provider boundary", () => {
  const scope = {
    dealerOrgId: "org_123456",
    inventorySourceId: "source_123456",
    purpose: "ingress_bearer" as const,
  };

  test("provisions reveal-once material behind an opaque reference", async () => {
    const provider = new InMemoryInventoryCredentialProvider();
    const provisioned = await provider.provision(scope);
    expect(provisioned.credentialReference).toBe(
      "inventory:token:org_123456:source_123456:ingress_bearer:v1"
    );
    expect(provisioned.credentialReference).not.toContain(
      provisioned.revealOnceSecret
    );
    await expect(
      verifyInventoryCredential(provider, {
        candidate: provisioned.revealOnceSecret,
        credentialReference: provisioned.credentialReference,
        scope,
      })
    ).resolves.toBe(true);
  });

  test("fails closed on a cross-source scope", async () => {
    const provider = new InMemoryInventoryCredentialProvider();
    const provisioned = await provider.provision(scope);
    await expect(
      provider.resolveForVerification(provisioned.credentialReference, {
        ...scope,
        inventorySourceId: "source_654321",
      })
    ).rejects.toThrow("not found");
  });

  test("isolates in-memory references across organization and purpose", async () => {
    const provider = new InMemoryInventoryCredentialProvider();
    const ingress = await provider.provision(scope);
    const feed = await provider.provision({ ...scope, purpose: "feed_fetch" });
    const otherOrganization = await provider.provision({
      ...scope,
      dealerOrgId: "org_654321",
    });

    expect(
      new Set([
        ingress.credentialReference,
        feed.credentialReference,
        otherOrganization.credentialReference,
      ]).size
    ).toBe(3);
    await expect(
      provider.resolveForVerification(ingress.credentialReference, {
        ...scope,
        purpose: "feed_fetch",
      })
    ).rejects.toThrow("not found");
    await expect(
      provider.resolveForVerification(ingress.credentialReference, {
        ...scope,
        dealerOrgId: "org_654321",
      })
    ).rejects.toThrow("not found");
  });

  test("keeps the previous credential usable only during rotation overlap", async () => {
    const provider = new InMemoryInventoryCredentialProvider();
    const current = await provider.provision(scope);
    const replacement = await provider.rotate(
      current.credentialReference,
      scope,
      new Date(Date.now() + 60_000)
    );
    await expect(
      provider.resolveForVerification(current.credentialReference, scope)
    ).resolves.toBe(current.revealOnceSecret);
    await expect(
      provider.resolveForVerification(replacement.credentialReference, scope)
    ).resolves.toBe(replacement.revealOnceSecret);
    await provider.revoke(current.credentialReference, scope);
    await expect(
      provider.resolveForVerification(current.credentialReference, scope)
    ).rejects.toThrow("not found");
  });

  test("legacy environment adapter is read-only", async () => {
    const provider = new ReadOnlyEnvironmentInventoryCredentialProvider(
      { AUTOMARKET_INVENTORY_DEMO: "synthetic" },
      { "env:AUTOMARKET_INVENTORY_DEMO": scope }
    );
    await expect(
      provider.resolveForVerification("env:AUTOMARKET_INVENTORY_DEMO", scope)
    ).resolves.toBe("synthetic");
    await expect(
      provider.resolveForVerification("env:AUTOMARKET_INVENTORY_DEMO", {
        ...scope,
        inventorySourceId: "source_654321",
      })
    ).rejects.toThrow("scope does not match");
    await expect(
      provider.resolveForVerification("env:AUTOMARKET_INVENTORY_DEMO", {
        ...scope,
        purpose: "feed_fetch",
      })
    ).rejects.toThrow("scope does not match");
    await expect(provider.provision(scope)).rejects.toMatchObject({
      code: "inventory_credential_provider_not_configured",
    });
  });

  test("unconfigured provider never pretends mutation succeeded", async () => {
    await expect(
      unconfiguredInventoryCredentialProvider.revoke(
        "inventory:token:source_123456:v1",
        scope
      )
    ).rejects.toMatchObject({
      code: "inventory_credential_provider_not_configured",
    });
  });
});
