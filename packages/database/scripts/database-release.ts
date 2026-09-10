import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { createDatabaseToolEnvironment } from "./tool-environment";

export const REVOKE_INACTIVE_CONVERSATIONS_MIGRATION =
  "20260718110000_revoke_inactive_dealer_conversations";
export const DROP_IMPORT_ATTEMPT_LEASE_DEFAULT_MIGRATION =
  "20260722133000_drop_inventory_import_attempt_lease_default";
export const VEHICLE_TAXONOMY_FOUNDATION_MIGRATION =
  "20260723160000_vehicle_taxonomy_foundation";
export const SELLER_PROFILE_VERIFICATION_DEFAULT_MIGRATION =
  "20260723203000_seller_profile_verification_default";
export const MONETIZATION_ENTITLEMENTS_FOUNDATION_MIGRATION =
  "20260726090000_monetization_entitlements_foundation";
export const DATABASE_RELEASE_MIGRATIONS = [
  REVOKE_INACTIVE_CONVERSATIONS_MIGRATION,
  DROP_IMPORT_ATTEMPT_LEASE_DEFAULT_MIGRATION,
  VEHICLE_TAXONOMY_FOUNDATION_MIGRATION,
  SELLER_PROFILE_VERIFICATION_DEFAULT_MIGRATION,
  MONETIZATION_ENTITLEMENTS_FOUNDATION_MIGRATION,
] as const;

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsRoot = join(packageRoot, "prisma", "migrations");
const schemaPath = join(packageRoot, "prisma", "schema.prisma");
const configPath = join(packageRoot, "prisma.config.ts");
const prismaCommand = join(
  packageRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "prisma.cmd" : "prisma"
);

type OutputFormat = "json" | "text";
type Target = "preview" | "production";

export type ReleaseBlockerType =
  | "code_blocker"
  | "data_blocker"
  | "operator_attestation";

export class ReleaseRefusal extends Error {
  readonly blockerType: ReleaseBlockerType;

  constructor(blockerType: ReleaseBlockerType, message: string) {
    super(message);
    this.blockerType = blockerType;
    this.name = "ReleaseRefusal";
  }
}

const refuse = (blockerType: ReleaseBlockerType, message: string): never => {
  throw new ReleaseRefusal(blockerType, message);
};

export interface DatabaseIdentity {
  readonly database: string;
  readonly host: string;
  readonly port: string;
}

export interface PendingMigrationProof {
  readonly migrationName: string;
  readonly sha256: string;
}

export interface ReleaseOptions {
  readonly allowProduction: boolean;
  readonly apply: boolean;
  readonly backupConfirmed: boolean;
  readonly backupReference?: string;
  readonly branchConfirmed: boolean;
  readonly confirmation?: string;
  readonly expectedDatabase?: string;
  readonly expectedHost?: string;
  readonly expectedPort?: string;
  readonly maxAffectedRows?: bigint;
  readonly minimumPublicListings: bigint;
  readonly neonBranchId?: string;
  readonly outputFormat: OutputFormat;
  readonly target?: Target;
}

interface MigrationHistoryRow {
  readonly checksum: string;
  readonly finished: boolean;
  readonly migration_name: string;
  readonly rolled_back: boolean;
}

interface ReadinessCounts {
  readonly activePublicListings: bigint;
  readonly affectedParticipants: bigint;
  readonly anonymousPrivateSellerWebLeads: bigint;
  readonly duplicateDirectorySlugs: bigint;
  readonly duplicateListingSlugs: bigint;
  readonly invalidActiveListings: bigint;
  readonly invalidDealerLeadReceipts: bigint;
  readonly invalidDirectoryEntries: bigint;
  readonly invalidListingLineage: bigint;
  readonly orphanLeadCreatedReceipts: bigint;
  readonly orphanListingImages: bigint;
  readonly receiptTenantMismatches: bigint;
  readonly tenantBindingViolations: bigint;
}

interface PreflightResult {
  readonly confirmationToken: string;
  readonly identity: DatabaseIdentity;
  readonly pendingMigrationProofs: readonly PendingMigrationProof[];
  readonly pendingMigrations: readonly string[];
  readonly readiness: ReadinessCounts;
  readonly server: {
    readonly database: string;
    readonly inRecovery: boolean;
    readonly readOnly: boolean;
    readonly schema: string;
    readonly user: string;
    readonly version: string;
  };
}

const requiredTables = [
  "AuditLog",
  "Conversation",
  "ConversationParticipant",
  "DealerMember",
  "DealerOrg",
  "Lead",
  "MarketplaceListing",
  "MarketplaceListingImage",
  "OrganizationDirectoryEntry",
  "_prisma_migrations",
] as const;

const RELEASE_OUTPUT_SCHEMA = "automarket.database-release.v1";
const allowedFlags = new Set([
  "allow-production",
  "apply",
  "confirm-backup",
  "confirm-branch",
]);
const allowedValues = new Set([
  "backup-reference",
  "confirm",
  "expected-database",
  "expected-host",
  "expected-port",
  "format",
  "max-affected-rows",
  "minimum-public-listings",
  "neon-branch-id",
  "target",
]);
const NON_NEGATIVE_INTEGER_PATTERN = /^\d+$/;
const EXPECTED_PORT_PATTERN = /^[1-9]\d{0,4}$/;
const NEON_BRANCH_ID_PATTERN = /^br-[a-z0-9-]+$/i;
const OUTPUT_LINE_PATTERN = /\r?\n/;
const PRISMA_CHANGED_TABLE_PATTERN = /^\[\*\] Changed the (.+) table$/;
const PRISMA_DIFF_ITEM_PATTERN = /^\[[+*-]\]/;
const customIndexContracts = new Map<string, RegExp>([
  [
    "InventorySourceCredentialBinding_one_active_per_purpose",
    /status.*active/i,
  ],
  [
    "OrganizationBrandRelationship_global_relationship_key",
    /marketCountryCode.*IS NULL/i,
  ],
  [
    "OrganizationDirectoryClaimRequest_one_open_per_entry",
    /status.*pending.*in_review/i,
  ],
  ["OrganizationKybCase_one_open_per_org", /status.*draft.*manual_review/i],
  [
    "OrganizationVerificationGrant_one_live_per_org",
    /status.*active.*suspended/i,
  ],
]);

const parseBigIntOption = (value: string | undefined, name: string) => {
  if (!(value && NON_NEGATIVE_INTEGER_PATTERN.test(value))) {
    return refuse(
      "operator_attestation",
      `${name} must be a non-negative integer`
    );
  }
  return BigInt(value);
};

const parseConnectionUrl = (connectionString: string) => {
  try {
    return new URL(connectionString);
  } catch {
    return refuse("operator_attestation", "DATABASE_URL is not a valid URL");
  }
};

export const parseConnectionIdentity = (connectionString: string) => {
  const url = parseConnectionUrl(connectionString);
  if (!(url.protocol === "postgres:" || url.protocol === "postgresql:")) {
    refuse(
      "operator_attestation",
      "DATABASE_URL must use the postgres protocol"
    );
  }
  const database = decodeURIComponent(url.pathname.slice(1));
  if (!(url.hostname && database)) {
    refuse(
      "operator_attestation",
      "DATABASE_URL must identify a host and database"
    );
  }
  return {
    database,
    host: url.hostname.toLowerCase(),
    port: url.port || "5432",
  } satisfies DatabaseIdentity;
};

const readReleaseArgumentMaps = (arguments_: readonly string[]) => {
  const values = new Map<string, string>();
  const flags = new Set<string>();
  for (const argument of arguments_) {
    if (!argument.startsWith("--")) {
      refuse(
        "operator_attestation",
        `Unsupported positional argument: ${argument}`
      );
    }
    const separator = argument.indexOf("=");
    if (separator === -1) {
      const flag = argument.slice(2);
      if (!allowedFlags.has(flag)) {
        refuse("operator_attestation", `Unsupported flag: --${flag}`);
      }
      if (flags.has(flag)) {
        refuse("operator_attestation", `Duplicate flag: --${flag}`);
      }
      flags.add(flag);
      continue;
    }

    const name = argument.slice(2, separator);
    if (!allowedValues.has(name)) {
      refuse("operator_attestation", `Unsupported option: --${name}`);
    }
    if (values.has(name)) {
      refuse("operator_attestation", `Duplicate option: --${name}`);
    }
    values.set(name, argument.slice(separator + 1));
  }
  return { flags, values };
};

const parseTarget = (value: string | undefined): Target | undefined => {
  if (value && value !== "preview" && value !== "production") {
    refuse("operator_attestation", "--target must be preview or production");
  }
  return value as Target | undefined;
};

const parseOutputFormat = (value: string | undefined): OutputFormat => {
  const outputFormat = value ?? "text";
  if (!(outputFormat === "json" || outputFormat === "text")) {
    return refuse("operator_attestation", "--format must be json or text");
  }
  return outputFormat;
};

const parseExpectedPort = (value: string | undefined) => {
  if (!(value && EXPECTED_PORT_PATTERN.test(value))) {
    return refuse(
      "operator_attestation",
      "--expected-port must be an integer from 1 through 65535"
    );
  }
  const port = Number(value);
  if (port > 65_535) {
    return refuse(
      "operator_attestation",
      "--expected-port must be an integer from 1 through 65535"
    );
  }
  return value;
};

export const parseReleaseArguments = (
  arguments_: readonly string[]
): ReleaseOptions => {
  const { flags, values } = readReleaseArgumentMaps(arguments_);
  const target = parseTarget(values.get("target"));
  const outputFormat = parseOutputFormat(values.get("format"));
  let minimumPublicListings = target === "production" ? 1n : 0n;
  if (values.has("minimum-public-listings")) {
    minimumPublicListings = parseBigIntOption(
      values.get("minimum-public-listings"),
      "--minimum-public-listings"
    );
  }

  return {
    allowProduction: flags.has("allow-production"),
    apply: flags.has("apply"),
    backupConfirmed: flags.has("confirm-backup"),
    backupReference: values.get("backup-reference"),
    branchConfirmed: flags.has("confirm-branch"),
    confirmation: values.get("confirm"),
    expectedDatabase: values.get("expected-database"),
    expectedHost: values.get("expected-host")?.toLowerCase(),
    expectedPort: values.has("expected-port")
      ? parseExpectedPort(values.get("expected-port"))
      : undefined,
    maxAffectedRows: values.has("max-affected-rows")
      ? parseBigIntOption(
          values.get("max-affected-rows"),
          "--max-affected-rows"
        )
      : undefined,
    minimumPublicListings,
    neonBranchId: values.get("neon-branch-id"),
    outputFormat,
    target,
  };
};

export const validateReleaseOptions = (
  options: ReleaseOptions,
  identity: DatabaseIdentity
) => {
  if (!options.target) {
    refuse("operator_attestation", "--target is required");
  }
  if (options.target === "production" && !options.allowProduction) {
    refuse(
      "operator_attestation",
      "Production is refused by default; pass --allow-production only during an approved cutover"
    );
  }
  if (
    !(options.expectedHost && options.expectedPort && options.expectedDatabase)
  ) {
    refuse(
      "operator_attestation",
      "--expected-host, --expected-port and --expected-database are required"
    );
  }
  if (
    options.expectedHost !== identity.host ||
    options.expectedPort !== identity.port ||
    options.expectedDatabase !== identity.database
  ) {
    refuse(
      "operator_attestation",
      "DATABASE_URL does not match the explicitly expected target"
    );
  }
  if (!NEON_BRANCH_ID_PATTERN.test(options.neonBranchId ?? "")) {
    refuse(
      "operator_attestation",
      "--neon-branch-id must contain the operator-attested Neon branch id"
    );
  }
  if (!options.branchConfirmed) {
    refuse(
      "operator_attestation",
      "--confirm-branch is an operator attestation required after independently verifying the Neon branch; the wrapper does not query the Neon API"
    );
  }
  if ((options.backupReference?.trim().length ?? 0) < 8) {
    refuse(
      "operator_attestation",
      "--backup-reference must identify the operator-attested snapshot or backup branch"
    );
  }
  if (!options.backupConfirmed) {
    refuse(
      "operator_attestation",
      "--confirm-backup is an operator attestation required after independently verifying the recovery point; the wrapper does not query the Neon API"
    );
  }
  if (options.maxAffectedRows === undefined) {
    refuse("operator_attestation", "--max-affected-rows is required");
  }
};

const migrationNames = () =>
  readdirSync(migrationsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

export const createMigrationSqlProof = (
  migrationName: string,
  migrationSql: string
): PendingMigrationProof => ({
  migrationName,
  sha256: createHash("sha256").update(migrationSql).digest("hex"),
});

const readPendingMigrationProofs = (migrationNames_: readonly string[]) =>
  migrationNames_.map((migrationName) =>
    createMigrationSqlProof(
      migrationName,
      readFileSync(join(migrationsRoot, migrationName, "migration.sql"), "utf8")
    )
  );

const migrationChecksum = (migrationName: string) =>
  readPendingMigrationProofs([migrationName])[0]?.sha256;

export const assertPendingMigrationSqlUnchanged = (
  expected: readonly PendingMigrationProof[],
  current: readonly PendingMigrationProof[] = readPendingMigrationProofs(
    expected.map(({ migrationName }) => migrationName)
  )
) => {
  const changed = expected.flatMap((proof, index) => {
    const currentProof = current[index];
    return currentProof?.migrationName === proof.migrationName &&
      currentProof.sha256 === proof.sha256
      ? []
      : [proof.migrationName];
  });
  if (current.length !== expected.length) {
    changed.push("ordered pending migration set");
  }
  if (changed.length > 0) {
    refuse(
      "code_blocker",
      `Pending migration SQL changed after preflight (${[...new Set(changed)].join(", ")}); refusing apply`
    );
  }
};

export const createConfirmationToken = (input: {
  readonly affectedParticipants: bigint;
  readonly backupReference: string;
  readonly branchId: string;
  readonly identity: DatabaseIdentity;
  readonly pendingMigrationProofs: readonly PendingMigrationProof[];
  readonly target: Target;
}) => {
  const payload = [
    input.target,
    input.identity.host,
    input.identity.port,
    input.identity.database,
    input.branchId,
    input.backupReference,
    input.pendingMigrationProofs
      .map(({ migrationName, sha256 }) => `${migrationName}:${sha256}`)
      .join("\n"),
    input.affectedParticipants.toString(),
  ].join("\n");
  return `APPLY-${createHash("sha256").update(payload).digest("hex").slice(0, 16)}`;
};

export const assertConfirmationToken = (
  provided: string | undefined,
  expected: string
) => {
  if (provided !== expected) {
    refuse(
      "operator_attestation",
      "--confirm does not match this exact target, operator-attested branch/recovery references, pending migration SQL SHA-256 proofs and affected-row count"
    );
  }
};

const run = async (
  command: string,
  arguments_: readonly string[],
  environment: NodeJS.ProcessEnv
) =>
  await new Promise<{ readonly code: number; readonly output: string }>(
    (resolvePromise, reject) => {
      const child = spawn(command, arguments_, {
        cwd: packageRoot,
        env: environment,
        shell: process.platform === "win32",
        stdio: ["ignore", "pipe", "pipe"],
      });
      let output = "";
      child.stdout.on("data", (chunk) => {
        output += chunk.toString();
      });
      child.stderr.on("data", (chunk) => {
        output += chunk.toString();
      });
      child.on("error", reject);
      child.on("close", (code) =>
        resolvePromise({ code: code ?? 1, output: output.trim() })
      );
    }
  );

export const assertPrismaDriftFree = async (
  environment: NodeJS.ProcessEnv,
  pendingMigrations: readonly string[]
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: This release gate intentionally compares every reviewed drift branch in one fail-closed audit routine.
) => {
  const prismaEnvironment = createDatabaseToolEnvironment(
    environment,
    environment.DATABASE_URL ?? ""
  );
  const result = await run(
    prismaCommand,
    [
      "migrate",
      "diff",
      `--config=${configPath}`,
      `--from-schema=${schemaPath}`,
      "--to-config-datasource",
      "--exit-code",
    ],
    prismaEnvironment
  );
  if (result.code === 0) {
    return;
  }
  if (result.code !== 2) {
    throw new Error(`Prisma drift check failed: ${result.output}`);
  }

  // Prisma cannot represent these five reviewed partial unique indexes. They
  // are verified separately through pg_catalog below. The lease default is an
  // expected difference only while its corrective release migration is pending.
  const expected = new Set([
    "InventorySourceCredentialBinding|[+] Added unique index on columns (inventorySourceId, purpose)",
    "OrganizationBrandRelationship|[+] Added unique index on columns (directoryEntryId, brandName, relationshipType)",
    "OrganizationDirectoryClaimRequest|[+] Added unique index on columns (directoryEntryId)",
    "OrganizationKybCase|[+] Added unique index on columns (dealerOrgId)",
    "OrganizationVerificationGrant|[+] Added unique index on columns (dealerOrgId)",
  ]);
  if (pendingMigrations.includes(DROP_IMPORT_ATTEMPT_LEASE_DEFAULT_MIGRATION)) {
    expected.add(
      "InventoryImportChunkAttempt|[*] Altered column leaseExpiresAt (default changed from None to Some(Now))"
    );
  }
  if (
    pendingMigrations.includes(SELLER_PROFILE_VERIFICATION_DEFAULT_MIGRATION)
  ) {
    expected.add(
      'SellerProfile|[*] Altered column verificationStatus (default changed from Some(Value(Enum("unverified"))) to Some(Value(Enum("pending"))))'
    );
  }
  const taxonomyMigrationPending = pendingMigrations.includes(
    VEHICLE_TAXONOMY_FOUNDATION_MIGRATION
  );
  const monetizationMigrationPending = pendingMigrations.includes(
    MONETIZATION_ENTITLEMENTS_FOUNDATION_MIGRATION
  );
  const expectedUnscopedPendingSections = new Set([
    "[-] Removed enums",
    "[-] Removed tables",
  ]);
  if (taxonomyMigrationPending) {
    const expectedTaxonomyEntities = [
      "VehicleTaxonomySourceKind",
      "VehicleTaxonomyEntityKind",
      "VehicleTaxonomySource",
      "VehicleMake",
      "VehicleModelFamily",
      "VehicleDerivative",
      "VehicleGeneration",
      "VehicleTrim",
      "VehiclePowertrain",
      "VehicleTaxonomyReference",
    ];
    for (const entity of expectedTaxonomyEntities) {
      if (!result.output.includes(`  - ${entity}`)) {
        throw new Error(
          `Expected pending taxonomy drift is missing ${entity}:\n${result.output}`
        );
      }
    }

    const expectedTaxonomyTableDrift: Readonly<
      Record<string, readonly string[]>
    > = {
      CanonicalVehicle: [
        "[-] Removed foreign key on columns (vehicleMakeId)",
        "[-] Removed foreign key on columns (vehicleModelId)",
        "[-] Removed foreign key on columns (vehicleDerivativeId)",
        "[-] Removed foreign key on columns (vehicleGenerationId)",
        "[-] Removed foreign key on columns (vehicleTrimId)",
        "[-] Removed foreign key on columns (vehiclePowertrainId)",
        "[-] Removed index on columns (vehicleMakeId, vehicleModelId, year)",
        "[-] Removed index on columns (vehicleDerivativeId, vehicleGenerationId)",
        "[-] Removed column derivative",
        "[-] Removed column vehicleDerivativeId",
        "[-] Removed column vehicleGenerationId",
        "[-] Removed column vehicleMakeId",
        "[-] Removed column vehicleModelId",
        "[-] Removed column vehiclePowertrainId",
        "[-] Removed column vehicleTrimId",
      ],
      MarketplaceListing: [
        "[-] Removed foreign key on columns (vehicleMakeId)",
        "[-] Removed foreign key on columns (vehicleModelId)",
        "[-] Removed foreign key on columns (vehicleDerivativeId)",
        "[-] Removed foreign key on columns (vehicleGenerationId)",
        "[-] Removed foreign key on columns (vehicleTrimId)",
        "[-] Removed foreign key on columns (vehiclePowertrainId)",
        "[-] Removed index on columns (vehicleMakeId, vehicleModelId, status, publishedAt)",
        "[-] Removed index on columns (vehicleDerivativeId, status, publishedAt)",
        "[-] Removed column derivative",
        "[-] Removed column vehicleDerivativeId",
        "[-] Removed column vehicleGenerationId",
        "[-] Removed column vehicleMakeId",
        "[-] Removed column vehicleModelId",
        "[-] Removed column vehiclePowertrainId",
        "[-] Removed column vehicleTrimId",
      ],
      VehicleDerivative: ["[-] Removed foreign key on columns (modelId)"],
      VehicleGeneration: ["[-] Removed foreign key on columns (modelId)"],
      VehicleModelFamily: ["[-] Removed foreign key on columns (makeId)"],
      VehiclePowertrain: [
        "[-] Removed foreign key on columns (modelId)",
        "[-] Removed foreign key on columns (derivativeId, modelId)",
        "[-] Removed foreign key on columns (generationId, modelId)",
      ],
      VehicleTaxonomyReference: [
        "[-] Removed foreign key on columns (sourceId)",
        "[-] Removed foreign key on columns (makeId)",
        "[-] Removed foreign key on columns (modelId)",
        "[-] Removed foreign key on columns (derivativeId)",
        "[-] Removed foreign key on columns (generationId)",
        "[-] Removed foreign key on columns (trimId)",
        "[-] Removed foreign key on columns (powertrainId)",
      ],
      VehicleTrim: [
        "[-] Removed foreign key on columns (modelId)",
        "[-] Removed foreign key on columns (derivativeId, modelId)",
        "[-] Removed foreign key on columns (generationId, modelId)",
      ],
    };
    for (const [tableName, driftItems] of Object.entries(
      expectedTaxonomyTableDrift
    )) {
      for (const driftItem of driftItems) {
        expected.add(`${tableName}|${driftItem}`);
      }
    }
  }
  if (monetizationMigrationPending) {
    const expectedMonetizationEntities = [
      "EntitlementGrantStatus",
      "EntitlementGrantSource",
      "PromotionPaymentStatus",
      "PromotionCancellationStatus",
      "PromotionEventType",
      "EntitlementGrant",
      "EntitlementUsageEvent",
      "ListingPromotionEvent",
    ];
    for (const entity of expectedMonetizationEntities) {
      if (!result.output.includes(`  - ${entity}`)) {
        throw new Error(
          `Expected pending monetization drift is missing ${entity}:\n${result.output}`
        );
      }
    }

    const expectedMonetizationTableDrift: Readonly<
      Record<string, readonly string[]>
    > = {
      EntitlementGrant: [
        "[-] Removed foreign key on columns (dealerOrgId)",
        "[-] Removed foreign key on columns (sellerProfileId)",
        "[-] Removed foreign key on columns (createdByAccountId)",
      ],
      EntitlementUsageEvent: [
        "[-] Removed foreign key on columns (grantId)",
        "[-] Removed foreign key on columns (dealerOrgId)",
        "[-] Removed foreign key on columns (sellerProfileId)",
        "[-] Removed foreign key on columns (actorAccountId)",
      ],
      ListingPromotion: [
        "[-] Removed unique index on columns (idempotencyKey)",
        "[-] Removed unique index on columns (activatedByEventId)",
        "[-] Removed index on columns (paymentStatus, cancellationStatus, updatedAt)",
        "[-] Removed column activatedByEventId",
        "[-] Removed column canceledAt",
        "[-] Removed column cancellationStatus",
        "[-] Removed column idempotencyKey",
        "[-] Removed column paymentStatus",
        "[-] Removed column refundAmountMinor",
      ],
      ListingPromotionEvent: [
        "[-] Removed foreign key on columns (promotionId)",
        "[-] Removed foreign key on columns (dealerOrgId)",
        "[-] Removed foreign key on columns (actorAccountId)",
      ],
    };
    for (const [tableName, driftItems] of Object.entries(
      expectedMonetizationTableDrift
    )) {
      for (const driftItem of driftItems) {
        expected.add(`${tableName}|${driftItem}`);
      }
    }
  }
  const actual = new Set<string>();
  let table: string | undefined;
  for (const sourceLine of result.output.split(OUTPUT_LINE_PATTERN)) {
    const line = sourceLine.trim().replaceAll("`", "");
    const tableMatch = PRISMA_CHANGED_TABLE_PATTERN.exec(line);
    if (tableMatch) {
      table = tableMatch[1];
      continue;
    }
    if (PRISMA_DIFF_ITEM_PATTERN.test(line)) {
      if (!table) {
        if (
          (taxonomyMigrationPending || monetizationMigrationPending) &&
          expectedUnscopedPendingSections.has(line)
        ) {
          continue;
        }
        throw new Error(
          `Unscoped Prisma drift output: ${line}\nFull drift output:\n${result.output}`
        );
      }
      actual.add(`${table}|${line}`);
    }
  }
  const unexpected = [...actual].filter((item) => !expected.has(item));
  const missing = [...expected].filter((item) => !actual.has(item));
  if (unexpected.length > 0 || missing.length > 0) {
    throw new Error(
      `Unexpected Prisma-supported schema drift detected: ${[
        ...unexpected.map((item) => `unexpected ${item}`),
        ...missing.map((item) => `missing expected ${item}`),
      ].join("; ")}`
    );
  }
};

const readMigrationHistory = async (client: Client) => {
  const result = await client.query<MigrationHistoryRow>(`
    SELECT
      "migration_name",
      "checksum",
      "finished_at" IS NOT NULL AS "finished",
      "rolled_back_at" IS NOT NULL AS "rolled_back"
    FROM "_prisma_migrations"
    ORDER BY "started_at", "migration_name"
  `);
  return result.rows;
};

const assertMigrationHistory = (rows: readonly MigrationHistoryRow[]) => {
  const localMigrations = migrationNames();
  const recordsByName = new Map<string, MigrationHistoryRow[]>();
  for (const row of rows) {
    const records = recordsByName.get(row.migration_name) ?? [];
    records.push(row);
    recordsByName.set(row.migration_name, records);
  }

  const unexpected = [...recordsByName.keys()].filter(
    (name) => !localMigrations.includes(name)
  );
  if (unexpected.length > 0) {
    throw new Error(
      `Database has unexpected migrations: ${unexpected.join(", ")}`
    );
  }

  const pending: string[] = [];
  for (const migrationName of localMigrations) {
    const records = recordsByName.get(migrationName) ?? [];
    const applied = records.filter((row) => row.finished && !row.rolled_back);
    const unresolved = records.filter(
      (row) => !(row.finished || row.rolled_back)
    );
    if (unresolved.length > 0 || applied.length > 1) {
      throw new Error(`Migration history is unresolved for ${migrationName}`);
    }
    if (applied.length === 0) {
      pending.push(migrationName);
      continue;
    }
    if (applied[0]?.checksum !== migrationChecksum(migrationName)) {
      throw new Error(
        `Applied migration checksum differs for ${migrationName}`
      );
    }
  }
  return pending;
};

const count = (value: unknown) => BigInt(String(value));

const readReadiness = async (client: Client): Promise<ReadinessCounts> => {
  const tableResult = await client.query<{ table_name: string }>(
    `
    SELECT "table_name"
    FROM "information_schema"."tables"
    WHERE "table_schema" = 'public'
      AND "table_name" = ANY($1::text[])
  `,
    [requiredTables]
  );
  const found = new Set(tableResult.rows.map((row) => row.table_name));
  const missing = requiredTables.filter((table) => !found.has(table));
  if (missing.length > 0) {
    throw new Error(
      `Required production tables are missing: ${missing.join(", ")}`
    );
  }

  const customIndexResult = await client.query<{
    index_name: string;
    predicate: string;
    table_name: string;
    unique_index: boolean;
  }>(
    `
    SELECT
      index_class.relname AS "index_name",
      table_class.relname AS "table_name",
      index_catalog.indisunique AS "unique_index",
      pg_get_expr(index_catalog.indpred, index_catalog.indrelid) AS "predicate"
    FROM pg_index AS index_catalog
    JOIN pg_class AS index_class ON index_class.oid = index_catalog.indexrelid
    JOIN pg_class AS table_class ON table_class.oid = index_catalog.indrelid
    JOIN pg_namespace AS namespace ON namespace.oid = table_class.relnamespace
    WHERE namespace.nspname = 'public'
      AND index_class.relname = ANY($1::text[])
  `,
    [
      [
        "InventorySourceCredentialBinding_one_active_per_purpose",
        "OrganizationBrandRelationship_global_relationship_key",
        "OrganizationDirectoryClaimRequest_one_open_per_entry",
        "OrganizationKybCase_one_open_per_org",
        "OrganizationVerificationGrant_one_live_per_org",
      ],
    ]
  );
  for (const [indexName, predicatePattern] of customIndexContracts) {
    const index = customIndexResult.rows.find(
      (row) => row.index_name === indexName
    );
    if (!(index?.unique_index && predicatePattern.test(index.predicate))) {
      throw new Error(
        `Required partial unique index is missing or changed: ${indexName}`
      );
    }
  }

  const result = await client.query(`
    SELECT
      (
        SELECT COUNT(*)
        FROM "ConversationParticipant" AS participant
        JOIN "DealerMember" AS member ON member."id" = participant."dealerMemberId"
        JOIN "DealerOrg" AS organization ON organization."id" = member."dealerOrgId"
        WHERE participant."leftAt" IS NULL
          AND (
            member."status" <> 'active'
            OR member."disabledAt" IS NOT NULL
            OR member."clerkDeletedAt" IS NOT NULL
            OR organization."deletedAt" IS NOT NULL
          )
      ) AS "affectedParticipants",
      (
        SELECT COUNT(*)
        FROM "ConversationParticipant" AS participant
        LEFT JOIN "DealerMember" AS member ON member."id" = participant."dealerMemberId"
        JOIN "Conversation" AS conversation ON conversation."id" = participant."conversationId"
        WHERE (
          participant."role" = 'dealer_member'
          AND (
            member."id" IS NULL
            OR participant."accountId" <> member."accountId"
            OR conversation."dealerOrgId" IS DISTINCT FROM member."dealerOrgId"
          )
        ) OR (
          participant."role" <> 'dealer_member'
          AND participant."dealerMemberId" IS NOT NULL
        )
      ) AS "tenantBindingViolations",
      (
        SELECT COUNT(*)
        FROM "Lead" AS lead
        WHERE lead."dealerOrgId" IS NOT NULL
          AND (
            SELECT COUNT(*)
            FROM "AuditLog" AS receipt
            WHERE receipt."action" = 'lead.created'
              AND receipt."entityType" = 'lead'
              AND receipt."entityId" = lead."id"
              AND receipt."dealerOrgId" IS NOT DISTINCT FROM lead."dealerOrgId"
          ) <> 1
      ) AS "invalidDealerLeadReceipts",
      (
        SELECT COUNT(*)
        FROM "AuditLog" AS receipt
        LEFT JOIN "Lead" AS lead ON lead."id" = receipt."entityId"
        WHERE receipt."action" = 'lead.created'
          AND receipt."entityType" = 'lead'
          AND lead."id" IS NULL
      ) AS "orphanLeadCreatedReceipts",
      (
        SELECT COUNT(*)
        FROM "AuditLog" AS receipt
        JOIN "Lead" AS lead ON lead."id" = receipt."entityId"
        WHERE receipt."action" = 'lead.created'
          AND receipt."entityType" = 'lead'
          AND receipt."dealerOrgId" IS DISTINCT FROM lead."dealerOrgId"
      ) AS "receiptTenantMismatches",
      (
        SELECT COUNT(*)
        FROM "Lead"
        WHERE "dealerOrgId" IS NULL
          AND "sellerProfileId" IS NOT NULL
          AND "buyerAccountId" IS NULL
          AND "channel" = 'web_form'
      ) AS "anonymousPrivateSellerWebLeads",
      (
        SELECT COUNT(*) FROM (
          SELECT "slug" FROM "MarketplaceListing" GROUP BY "slug" HAVING COUNT(*) > 1
        ) AS duplicates
      ) AS "duplicateListingSlugs",
      (
        SELECT COUNT(*) FROM (
          SELECT "slug" FROM "OrganizationDirectoryEntry" GROUP BY "slug" HAVING COUNT(*) > 1
        ) AS duplicates
      ) AS "duplicateDirectorySlugs",
      (
        SELECT COUNT(*)
        FROM "MarketplaceListingImage" AS image
        LEFT JOIN "MarketplaceListing" AS listing ON listing."id" = image."listingId"
        WHERE listing."id" IS NULL
      ) AS "orphanListingImages",
      (
        SELECT COUNT(*)
        FROM "MarketplaceListing"
        WHERE "status" = 'active'
          AND (
            "deletedAt" IS NOT NULL
            OR BTRIM("slug") = ''
            OR BTRIM("title") = ''
            OR BTRIM("make") = ''
            OR BTRIM("model") = ''
            OR "priceAmountMinor" < 0
          )
      ) AS "invalidActiveListings",
      (
        SELECT COUNT(*)
        FROM "MarketplaceListing"
        WHERE ("inventoryOfferId" IS NULL) <> ("marketPublicationId" IS NULL)
      ) AS "invalidListingLineage",
      (
        SELECT COUNT(*)
        FROM "OrganizationDirectoryEntry" AS directory
        LEFT JOIN "DealerOrg" AS organization ON organization."id" = directory."dealerOrgId"
        WHERE directory."status" = 'published'
          AND (
            BTRIM(directory."slug") = ''
            OR (directory."dealerOrgId" IS NOT NULL AND organization."id" IS NULL)
            OR organization."deletedAt" IS NOT NULL
          )
      ) AS "invalidDirectoryEntries",
      (
        SELECT COUNT(*)
        FROM "MarketplaceListing"
        WHERE "status" = 'active'
          AND "deletedAt" IS NULL
          AND (
            ("inventoryOfferId" IS NULL AND "marketPublicationId" IS NULL)
            OR ("inventoryOfferId" IS NOT NULL AND "marketPublicationId" IS NOT NULL)
          )
      ) AS "activePublicListings"
  `);
  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row) {
    throw new Error("Readiness query returned no result");
  }
  return {
    activePublicListings: count(row.activePublicListings),
    affectedParticipants: count(row.affectedParticipants),
    anonymousPrivateSellerWebLeads: count(row.anonymousPrivateSellerWebLeads),
    duplicateDirectorySlugs: count(row.duplicateDirectorySlugs),
    duplicateListingSlugs: count(row.duplicateListingSlugs),
    invalidDealerLeadReceipts: count(row.invalidDealerLeadReceipts),
    invalidActiveListings: count(row.invalidActiveListings),
    invalidDirectoryEntries: count(row.invalidDirectoryEntries),
    invalidListingLineage: count(row.invalidListingLineage),
    orphanLeadCreatedReceipts: count(row.orphanLeadCreatedReceipts),
    orphanListingImages: count(row.orphanListingImages),
    receiptTenantMismatches: count(row.receiptTenantMismatches),
    tenantBindingViolations: count(row.tenantBindingViolations),
  };
};

const assertReadiness = (
  readiness: ReadinessCounts,
  options: ReleaseOptions
) => {
  const zeroRequired: Array<readonly [keyof ReadinessCounts, bigint]> = [
    [
      "anonymousPrivateSellerWebLeads",
      readiness.anonymousPrivateSellerWebLeads,
    ],
    ["duplicateDirectorySlugs", readiness.duplicateDirectorySlugs],
    ["duplicateListingSlugs", readiness.duplicateListingSlugs],
    ["invalidDealerLeadReceipts", readiness.invalidDealerLeadReceipts],
    ["invalidActiveListings", readiness.invalidActiveListings],
    ["invalidDirectoryEntries", readiness.invalidDirectoryEntries],
    ["invalidListingLineage", readiness.invalidListingLineage],
    ["orphanLeadCreatedReceipts", readiness.orphanLeadCreatedReceipts],
    ["orphanListingImages", readiness.orphanListingImages],
    ["receiptTenantMismatches", readiness.receiptTenantMismatches],
    ["tenantBindingViolations", readiness.tenantBindingViolations],
  ];
  const failures = zeroRequired.filter(([, value]) => value !== 0n);
  if (failures.length > 0) {
    refuse(
      "data_blocker",
      `Production data integrity checks failed: ${failures
        .map(([name, value]) => `${name}=${value}`)
        .join(", ")}`
    );
  }
  if (
    options.maxAffectedRows !== undefined &&
    readiness.affectedParticipants > options.maxAffectedRows
  ) {
    refuse(
      "data_blocker",
      `Affected participant count ${readiness.affectedParticipants} exceeds approved maximum ${options.maxAffectedRows}`
    );
  }
  if (readiness.activePublicListings < options.minimumPublicListings) {
    refuse(
      "data_blocker",
      `Public listing count ${readiness.activePublicListings} is below required minimum ${options.minimumPublicListings}`
    );
  }
};

const preflight = async (
  connectionString: string,
  identity: DatabaseIdentity,
  options: ReleaseOptions
): Promise<PreflightResult> => {
  const client = new Client({
    application_name: "automarket_database_release_preflight",
    connectionString,
    connectionTimeoutMillis: 15_000,
    query_timeout: 30_000,
  });
  await client.connect();
  try {
    await client.query("BEGIN TRANSACTION READ ONLY");
    await client.query("SET LOCAL statement_timeout = '30s'");
    const serverResult = await client.query<{
      database: string;
      in_recovery: boolean;
      read_only: string;
      schema: string;
      user_name: string;
      version: string;
    }>(`
      SELECT
        current_database() AS "database",
        current_schema() AS "schema",
        current_user AS "user_name",
        current_setting('server_version') AS "version",
        current_setting('transaction_read_only') AS "read_only",
        pg_is_in_recovery() AS "in_recovery"
    `);
    const serverRow = serverResult.rows[0];
    if (!serverRow || serverRow.database !== identity.database) {
      throw new Error("Connected database identity differs from DATABASE_URL");
    }
    const history = await readMigrationHistory(client);
    const pendingMigrations = assertMigrationHistory(history);
    if (
      pendingMigrations.join("\n") !== DATABASE_RELEASE_MIGRATIONS.join("\n")
    ) {
      throw new Error(
        `Expected only ${DATABASE_RELEASE_MIGRATIONS.join(", ")} to be pending; found ${pendingMigrations.join(", ") || "none"}`
      );
    }
    await assertPrismaDriftFree(
      { ...process.env, DATABASE_URL: connectionString },
      pendingMigrations
    );
    const readiness = await readReadiness(client);
    assertReadiness(readiness, options);
    const pendingMigrationProofs =
      readPendingMigrationProofs(pendingMigrations);
    const confirmationToken = createConfirmationToken({
      affectedParticipants: readiness.affectedParticipants,
      backupReference: options.backupReference ?? "",
      branchId: options.neonBranchId ?? "",
      identity,
      pendingMigrationProofs,
      target: options.target ?? "preview",
    });
    await client.query("COMMIT");
    return {
      confirmationToken,
      identity,
      pendingMigrations,
      pendingMigrationProofs,
      readiness,
      server: {
        database: serverRow.database,
        inRecovery: serverRow.in_recovery,
        readOnly: serverRow.read_only === "on",
        schema: serverRow.schema,
        user: serverRow.user_name,
        version: serverRow.version,
      },
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
};

const readinessForJson = (readiness: ReadinessCounts) =>
  Object.fromEntries(
    Object.entries(readiness).map(([name, value]) => [name, value.toString()])
  );

const formatPreflightText = (result: PreflightResult, apply: boolean) => {
  const lines = [
    `AutoMarket database release preflight: PASS (${apply ? "apply requested" : "read-only"})`,
    `Technically verified connection target: ${result.identity.host}:${result.identity.port}/${result.identity.database}`,
    `Technically verified server/schema: PostgreSQL ${result.server.version}; database=${result.server.database}; schema=${result.server.schema}; recovery=${result.server.inRecovery}`,
    "Operator-attested Neon resources: branch id and recovery reference supplied and token-bound; not independently verified by this wrapper.",
    `Pending: ${result.pendingMigrations.join(", ")}`,
    "Pending migration SQL SHA-256 proofs:",
    ...result.pendingMigrationProofs.map(
      ({ migrationName, sha256 }) => `  ${migrationName}: ${sha256}`
    ),
    `Affected conversation participants: ${result.readiness.affectedParticipants}`,
    `Structurally public listings: ${result.readiness.activePublicListings}`,
    "Integrity violations: 0",
  ];
  if (!apply) {
    lines.push(
      `Re-run with --apply --confirm=${result.confirmationToken} after application traffic and operator gates are ready.`
    );
  }
  lines.push("Secret values and row-level data are never printed.");
  return lines.join("\n");
};

const formatPreflightJson = (result: PreflightResult, apply: boolean) =>
  JSON.stringify({
    applyRequested: apply,
    blockerType: null,
    codeBlockers: [],
    confirmationToken: apply ? null : result.confirmationToken,
    dataBlockers: [],
    operatorAttestations: {
      neonBranch: "ATTESTED_NOT_TECHNICALLY_VERIFIED",
      recoveryReference: "ATTESTED_NOT_TECHNICALLY_VERIFIED",
      tokenBound: true,
    },
    pendingMigrations: result.pendingMigrationProofs,
    phase: "preflight",
    readiness: readinessForJson(result.readiness),
    remoteMutationPerformed: false,
    schemaVersion: RELEASE_OUTPUT_SCHEMA,
    status: "PASS",
    target: {
      database: result.identity.database,
      host: result.identity.host,
      port: result.identity.port,
    },
    technicalVerification: {
      appliedMigrationChecksums: "PASS",
      databaseIdentity: "PASS",
      dataReadiness: "PASS",
      pendingMigrationSqlChecksums: "PASS",
      prismaDrift: "PASS",
      schemaContracts: "PASS",
    },
  });

const formatPreflight = (
  result: PreflightResult,
  apply: boolean,
  outputFormat: OutputFormat
) =>
  outputFormat === "json"
    ? formatPreflightJson(result, apply)
    : formatPreflightText(result, apply);

const releaseError = (error: unknown) =>
  error instanceof ReleaseRefusal
    ? error
    : new ReleaseRefusal(
        "code_blocker",
        error instanceof Error ? error.message : String(error)
      );

export const formatReleaseRefusal = (
  error: unknown,
  outputFormat: OutputFormat,
  applyRequested = false
) => {
  const refusal = releaseError(error);
  if (outputFormat === "json") {
    return JSON.stringify({
      applyRequested,
      blockerType: refusal.blockerType,
      message: refusal.message,
      phase: "refusal",
      schemaVersion: RELEASE_OUTPUT_SCHEMA,
      status: "REFUSED",
    });
  }
  return `AutoMarket database release refused [${refusal.blockerType}]: ${refusal.message}`;
};

const deploy = async (
  connectionString: string,
  expectedPendingMigrationProofs: readonly PendingMigrationProof[]
) => {
  // This is deliberately the final synchronous operation before Prisma reads
  // the migration files. It fences changes made after token issuance/preflight.
  assertPendingMigrationSqlUnchanged(expectedPendingMigrationProofs);
  const result = await run(
    prismaCommand,
    ["migrate", "deploy", `--config=${configPath}`],
    createDatabaseToolEnvironment(process.env, connectionString)
  );
  if (result.code !== 0) {
    throw new Error(`Prisma migration deploy failed: ${result.output}`);
  }
  return result.output;
};

const main = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return refuse(
      "operator_attestation",
      "DATABASE_URL must be supplied explicitly; the release wrapper does not load .env files"
    );
  }
  const options = parseReleaseArguments(process.argv.slice(2));
  const identity = parseConnectionIdentity(connectionString);
  validateReleaseOptions(options, identity);
  const result = await preflight(connectionString, identity, options);
  process.stdout.write(
    `${formatPreflight(result, options.apply, options.outputFormat)}\n`
  );
  if (!options.apply) {
    return;
  }
  assertConfirmationToken(options.confirmation, result.confirmationToken);
  const deployOutput = await deploy(
    connectionString,
    result.pendingMigrationProofs
  );
  process.stdout.write(
    options.outputFormat === "json"
      ? `${JSON.stringify({
          phase: "deploy",
          prismaOutput: deployOutput,
          schemaVersion: RELEASE_OUTPUT_SCHEMA,
          status: "PASS",
        })}\n`
      : `${deployOutput}\n`
  );

  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 15_000,
  });
  await client.connect();
  try {
    const pending = assertMigrationHistory(await readMigrationHistory(client));
    if (pending.length > 0) {
      throw new Error(
        `Post-apply migrations remain pending: ${pending.join(", ")}`
      );
    }
    await assertPrismaDriftFree(
      { ...process.env, DATABASE_URL: connectionString },
      pending
    );
    const readiness = await readReadiness(client);
    if (readiness.affectedParticipants !== 0n) {
      throw new Error(
        `Post-apply verification found ${readiness.affectedParticipants} participants still requiring revocation`
      );
    }
    assertReadiness(readiness, { ...options, maxAffectedRows: 0n });
    process.stdout.write(
      options.outputFormat === "json"
        ? `${JSON.stringify({
            phase: "post_apply_verification",
            schemaVersion: RELEASE_OUTPUT_SCHEMA,
            status: "PASS",
          })}\n`
        : "AutoMarket database post-apply verification: PASS; no pending migrations or residual revocations.\n"
    );
  } finally {
    await client.end();
  }
};

const isDirectRun =
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  main().catch((error: unknown) => {
    const outputFormat = process.argv.includes("--format=json")
      ? "json"
      : "text";
    process.stderr.write(
      `${formatReleaseRefusal(error, outputFormat, process.argv.includes("--apply"))}\n`
    );
    process.exitCode = 1;
  });
}
