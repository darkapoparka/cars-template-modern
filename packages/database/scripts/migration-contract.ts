import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import { Client } from "pg";
import { PrismaClient } from "../generated/client";
import {
  assertPrismaDriftFree,
  DATABASE_RELEASE_MIGRATIONS,
  DROP_IMPORT_ATTEMPT_LEASE_DEFAULT_MIGRATION,
  REVOKE_INACTIVE_CONVERSATIONS_MIGRATION,
  SELLER_PROFILE_VERIFICATION_DEFAULT_MIGRATION,
  VEHICLE_TAXONOMY_FOUNDATION_MIGRATION,
} from "./database-release";
import { resolvePostgresBin } from "./postgres-bin";
import { createDatabaseToolEnvironment } from "./tool-environment";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsRoot = join(packageRoot, "prisma", "migrations");
const schemaPath = join(packageRoot, "prisma", "schema.prisma");
const realConfigPath = join(packageRoot, "prisma.config.ts");
const runId = randomUUID().replaceAll("-", "").slice(0, 12);
const prismaCommand = join(
  packageRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "prisma.cmd" : "prisma"
);
const tsxCommand = join(
  packageRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "tsx.cmd" : "tsx"
);
const SAFE_DATABASE_IDENTIFIER_PATTERN = /^automarket_migration_[a-z0-9_]+$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const LOCK_TIMEOUT_PATTERN =
  /lock timeout|canceling statement due to lock timeout/i;

interface CommandResult {
  readonly code: number;
  readonly output: string;
}

const run = async (
  command: string,
  arguments_: readonly string[],
  options: {
    readonly env?: NodeJS.ProcessEnv;
    readonly timeoutMs?: number;
  } = {}
) =>
  await new Promise<CommandResult>((resolvePromise, reject) => {
    const child = spawn(command, arguments_, {
      cwd: packageRoot,
      env: options.env ?? process.env,
      shell:
        process.platform === "win32" && command.toLowerCase().endsWith(".cmd"),
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error(`${command} timed out`));
    }, options.timeoutMs ?? 120_000);
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    // On Windows, pg_ctl's background postgres process can inherit pipe handles.
    // The pg_ctl process has exited successfully even though those handles remain
    // open, so wait for the child process exit rather than every inherited pipe.
    child.on("exit", (code) => {
      clearTimeout(timeout);
      resolvePromise({ code: code ?? 1, output: output.trim() });
    });
  });

const runRequired = async (
  command: string,
  arguments_: readonly string[],
  options?: { readonly env?: NodeJS.ProcessEnv; readonly timeoutMs?: number }
) => {
  const result = await run(command, arguments_, options);
  if (result.code !== 0) {
    throw new Error(
      `${command} ${arguments_.join(" ")} failed (${result.code}):\n${result.output}`
    );
  }
  return result.output;
};

const reservePort = async () =>
  await new Promise<number>((resolvePromise, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Could not reserve a local PostgreSQL port"));
        return;
      }
      const { port } = address;
      server.close((error) => (error ? reject(error) : resolvePromise(port)));
    });
  });

const quoteIdentifier = (identifier: string) => {
  if (!SAFE_DATABASE_IDENTIFIER_PATTERN.test(identifier)) {
    throw new Error(`Unsafe test database identifier: ${identifier}`);
  }
  return `"${identifier}"`;
};

const databaseUrl = (port: number, database: string) =>
  `postgresql://postgres@127.0.0.1:${port}/${database}`;

const prisma = async (
  arguments_: readonly string[],
  connectionString: string,
  timeoutMs = 180_000
) => {
  return await runRequired(prismaCommand, arguments_, {
    env: createDatabaseToolEnvironment(process.env, connectionString),
    timeoutMs,
  });
};

const createUpgradeConfig = (workRoot: string) => {
  const stagedMigrations = join(workRoot, "migrations-before-pending");
  mkdirSync(stagedMigrations, { recursive: true });
  cpSync(
    join(migrationsRoot, "migration_lock.toml"),
    join(stagedMigrations, "migration_lock.toml")
  );
  for (const entry of readdirSync(migrationsRoot, { withFileTypes: true })) {
    if (
      !(
        entry.isDirectory() &&
        entry.name < REVOKE_INACTIVE_CONVERSATIONS_MIGRATION
      )
    ) {
      continue;
    }
    cpSync(
      join(migrationsRoot, entry.name),
      join(stagedMigrations, entry.name),
      {
        recursive: true,
      }
    );
  }
  const configPath = join(workRoot, "upgrade-prisma.config.ts");
  writeFileSync(
    configPath,
    `import { defineConfig } from "prisma/config";\n\nexport default defineConfig({\n  schema: ${JSON.stringify(schemaPath)},\n  migrations: { path: ${JSON.stringify(stagedMigrations)} },\n  datasource: { url: process.env.DATABASE_URL ?? "" },\n});\n`,
    "utf8"
  );
  return configPath;
};

const deploy = async (connectionString: string, configPath: string) =>
  await prisma(
    ["migrate", "deploy", `--config=${configPath}`],
    connectionString
  );

const assertDriftFree = async (
  connectionString: string,
  pendingMigrations: readonly string[] = []
) =>
  await assertPrismaDriftFree(
    createDatabaseToolEnvironment(process.env, connectionString),
    pendingMigrations
  );

const assertReadinessReport = async (
  psqlCommand: string,
  connectionString: string
) =>
  await runRequired(
    psqlCommand,
    [
      "-X",
      "--set=ON_ERROR_STOP=1",
      `--dbname=${connectionString}`,
      `--file=${join(packageRoot, "production-readiness.sql")}`,
    ],
    { timeoutMs: 120_000 }
  );

const releaseArguments = (
  database: string,
  port: string,
  maxAffectedRows: number
) =>
  [
    "scripts/database-release.ts",
    "--format=json",
    "--target=preview",
    "--expected-host=127.0.0.1",
    `--expected-port=${port}`,
    `--expected-database=${database}`,
    "--neon-branch-id=br-local-contract",
    "--confirm-branch",
    "--backup-reference=local-contract-recovery-attestation",
    "--confirm-backup",
    `--max-affected-rows=${maxAffectedRows}`,
    "--minimum-public-listings=0",
  ] as const;

const assertMachineReadableReleasePreflight = async (
  connectionString: string,
  database: string
) => {
  const baseEnvironment = createDatabaseToolEnvironment(
    process.env,
    connectionString
  );
  const expectedPort = new URL(connectionString).port || "5432";
  const pass = await runRequired(
    tsxCommand,
    releaseArguments(database, expectedPort, 4),
    {
      env: baseEnvironment,
      timeoutMs: 180_000,
    }
  );
  const report = JSON.parse(pass) as Record<string, unknown>;
  const pendingMigrations = report.pendingMigrations as Array<{
    migrationName: string;
    sha256: string;
  }>;
  if (
    report.status !== "PASS" ||
    report.blockerType !== null ||
    report.schemaVersion !== "automarket.database-release.v1" ||
    !Array.isArray(report.codeBlockers) ||
    report.codeBlockers.length !== 0 ||
    !Array.isArray(report.dataBlockers) ||
    report.dataBlockers.length !== 0 ||
    pendingMigrations.map(({ migrationName }) => migrationName).join("\n") !==
      DATABASE_RELEASE_MIGRATIONS.join("\n") ||
    pendingMigrations.some(({ sha256 }) => !SHA256_PATTERN.test(sha256))
  ) {
    throw new Error(`Machine-readable release PASS contract failed: ${pass}`);
  }
  const attestations = report.operatorAttestations as Record<string, unknown>;
  if (
    attestations.neonBranch !== "ATTESTED_NOT_TECHNICALLY_VERIFIED" ||
    attestations.recoveryReference !== "ATTESTED_NOT_TECHNICALLY_VERIFIED"
  ) {
    throw new Error(
      "Operator attestations were overstated as technical checks"
    );
  }

  const blocked = await run(
    tsxCommand,
    releaseArguments(database, expectedPort, 3),
    {
      env: baseEnvironment,
      timeoutMs: 180_000,
    }
  );
  const refusal = JSON.parse(blocked.output) as Record<string, unknown>;
  if (
    blocked.code === 0 ||
    refusal.status !== "REFUSED" ||
    refusal.blockerType !== "data_blocker"
  ) {
    throw new Error(
      `Machine-readable data-blocker contract failed: ${blocked.output}`
    );
  }
};

const assertMigrationStatus = async (connectionString: string) => {
  const output = await prisma(
    ["migrate", "status", `--config=${realConfigPath}`],
    connectionString
  );
  if (!output.includes("Database schema is up to date")) {
    throw new Error(`Prisma did not report an up-to-date schema:\n${output}`);
  }
};

const assertImportAttemptLeaseContract = async (
  client: Client,
  defaultExpected: boolean
) => {
  const column = await client.query<{ column_default: string | null }>(`
    SELECT "column_default"
    FROM "information_schema"."columns"
    WHERE "table_schema" = 'public'
      AND "table_name" = 'InventoryImportChunkAttempt'
      AND "column_name" = 'leaseExpiresAt'
  `);
  if (column.rows.length !== 1) {
    throw new Error("InventoryImportChunkAttempt.leaseExpiresAt is missing");
  }
  const columnDefault = column.rows[0]?.column_default ?? null;
  if (
    (defaultExpected && !columnDefault?.includes("CURRENT_TIMESTAMP")) ||
    (!defaultExpected && columnDefault !== null)
  ) {
    throw new Error(
      `Unexpected leaseExpiresAt default: expected=${defaultExpected ? "CURRENT_TIMESTAMP" : "none"} actual=${columnDefault ?? "none"}`
    );
  }

  const index = await client.query<{
    indexed_columns: string[];
    valid: boolean;
  }>(`
    SELECT
      ARRAY(
        SELECT attribute.attname
        FROM UNNEST(index_catalog.indkey)
          WITH ORDINALITY AS key_column(attnum, ordinal)
        JOIN "pg_attribute" AS attribute
          ON attribute.attrelid = index_catalog.indrelid
          AND attribute.attnum = key_column.attnum
        ORDER BY key_column.ordinal
      )::text[] AS "indexed_columns",
      index_catalog.indisvalid AND index_catalog.indisready AS "valid"
    FROM "pg_index" AS index_catalog
    JOIN "pg_class" AS index_class
      ON index_class.oid = index_catalog.indexrelid
    JOIN "pg_namespace" AS namespace
      ON namespace.oid = index_class.relnamespace
    WHERE namespace.nspname = 'public'
      AND index_class.relname = 'InventoryImportChunkAttempt_status_leaseExpiresAt_idx'
  `);
  if (
    index.rows.length !== 1 ||
    !index.rows[0]?.valid ||
    index.rows[0].indexed_columns.join(",") !== "status,leaseExpiresAt"
  ) {
    throw new Error("The import-attempt lease scheduling index is missing");
  }
};

const createUpgradeFixtures = async (client: Client) => {
  const disabledAt = new Date("2026-07-18T08:00:00.000Z");
  const clerkDeletedAt = new Date("2026-07-18T08:01:00.000Z");
  const organizationDeletedAt = new Date("2026-07-18T08:02:00.000Z");
  const alreadyLeftAt = new Date("2026-07-18T07:00:00.000Z");
  await client.query(
    `
      INSERT INTO "MarketplaceAccount" ("id", "clerkUserId", "status", "createdAt", "updatedAt")
      VALUES
        ('acct_active', 'user_active', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('acct_disabled', 'user_disabled', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('acct_deleted', 'user_deleted', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('acct_invited', 'user_invited', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('acct_org_deleted', 'user_org_deleted', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('acct_left', 'user_left', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('acct_buyer', 'user_buyer', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

      INSERT INTO "DealerOrg" (
        "id", "slug", "clerkOrgId", "displayName", "deletedAt", "createdAt", "updatedAt"
      ) VALUES
        ('org_active', 'migration-active', 'org_migration_active', 'Migration Active', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('org_deleted', 'migration-deleted', 'org_migration_deleted', 'Migration Deleted', TIMESTAMPTZ '2026-07-18 08:02:00+00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

      INSERT INTO "DealerMember" (
        "id", "dealerOrgId", "accountId", "disabledAt", "clerkDeletedAt", "role", "status", "createdAt", "updatedAt"
      ) VALUES
        ('member_active', 'org_active', 'acct_active', NULL, NULL, 'sales', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('member_disabled', 'org_active', 'acct_disabled', TIMESTAMPTZ '2026-07-18 08:00:00+00', NULL, 'sales', 'disabled', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('member_deleted', 'org_active', 'acct_deleted', NULL, TIMESTAMPTZ '2026-07-18 08:01:00+00', 'sales', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('member_invited', 'org_active', 'acct_invited', NULL, NULL, 'sales', 'invited', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('member_org_deleted', 'org_deleted', 'acct_org_deleted', NULL, NULL, 'sales', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('member_left', 'org_active', 'acct_left', TIMESTAMPTZ '2026-07-18 08:00:00+00', NULL, 'sales', 'disabled', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

      INSERT INTO "Conversation" (
        "id", "dealerOrgId", "status", "subject", "createdAt", "updatedAt"
      ) VALUES
        ('conv_active', 'org_active', 'open', 'Active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('conv_disabled', 'org_active', 'open', 'Disabled', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('conv_deleted', 'org_active', 'open', 'Deleted', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('conv_invited', 'org_active', 'open', 'Invited', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('conv_org_deleted', 'org_deleted', 'open', 'Organization deleted', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('conv_left', 'org_active', 'open', 'Already left', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('conv_buyer', 'org_active', 'open', 'Buyer', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

      INSERT INTO "ConversationParticipant" (
        "id", "conversationId", "accountId", "dealerMemberId", "role", "joinedAt", "leftAt"
      ) VALUES
        ('participant_active', 'conv_active', 'acct_active', 'member_active', 'dealer_member', CURRENT_TIMESTAMP, NULL),
        ('participant_disabled', 'conv_disabled', 'acct_disabled', 'member_disabled', 'dealer_member', CURRENT_TIMESTAMP, NULL),
        ('participant_deleted', 'conv_deleted', 'acct_deleted', 'member_deleted', 'dealer_member', CURRENT_TIMESTAMP, NULL),
        ('participant_invited', 'conv_invited', 'acct_invited', 'member_invited', 'dealer_member', CURRENT_TIMESTAMP, NULL),
        ('participant_org_deleted', 'conv_org_deleted', 'acct_org_deleted', 'member_org_deleted', 'dealer_member', CURRENT_TIMESTAMP, NULL),
        ('participant_left', 'conv_left', 'acct_left', 'member_left', 'dealer_member', CURRENT_TIMESTAMP, TIMESTAMPTZ '2026-07-18 07:00:00+00'),
        ('participant_buyer', 'conv_buyer', 'acct_buyer', NULL, 'buyer', CURRENT_TIMESTAMP, NULL);

      INSERT INTO "Lead" (
        "id", "dealerOrgId", "buyerName", "contactMethod", "status", "source",
        "channel", "createdAt", "updatedAt"
      ) VALUES (
        'lead_receipt', 'org_active', 'Migration receipt', 'form', 'new',
        'listing', 'web_form', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      );

      INSERT INTO "AuditLog" (
        "id", "actorType", "dealerOrgId", "action", "entityType", "entityId",
        "metadata", "createdAt"
      ) VALUES (
        'audit_lead_receipt', 'system', 'org_active', 'lead.created', 'lead',
        'lead_receipt',
        '{"deliveryChannel":"dealer_inbox","deliveryState":"delivered"}'::jsonb,
        CURRENT_TIMESTAMP
      );
    `
  );
  return { alreadyLeftAt, clerkDeletedAt, disabledAt, organizationDeletedAt };
};

const readParticipantState = async (client: Client) => {
  const result = await client.query<{ id: string; leftAt: Date | null }>(`
    SELECT "id", "leftAt"
    FROM "ConversationParticipant"
    ORDER BY "id"
  `);
  return new Map(result.rows.map((row) => [row.id, row.leftAt]));
};

const readLeadReceiptState = async (client: Client) => {
  const result = await client.query(`
    SELECT
      lead."id" AS "leadId",
      lead."dealerOrgId" AS "leadDealerOrgId",
      lead."sellerProfileId",
      lead."buyerAccountId",
      lead."channel"::text AS "channel",
      lead."contactMethod",
      lead."status"::text AS "leadStatus",
      lead."deletedAt",
      receipt."id" AS "receiptId",
      receipt."dealerOrgId" AS "receiptDealerOrgId",
      receipt."action",
      receipt."entityType",
      receipt."entityId",
      receipt."metadata"::text AS "metadata"
    FROM "Lead" AS lead
    LEFT JOIN "AuditLog" AS receipt
      ON receipt."action" = 'lead.created'
      AND receipt."entityType" = 'lead'
      AND receipt."entityId" = lead."id"
    WHERE lead."id" = 'lead_receipt'
    ORDER BY receipt."id"
  `);
  if (result.rows.length !== 1) {
    throw new Error(
      `Expected one durable Lead/AuditLog receipt, found ${result.rows.length}`
    );
  }
  return JSON.stringify(result.rows[0]);
};

const assertLeadReceiptUnchanged = async (client: Client, expected: string) => {
  const actual = await readLeadReceiptState(client);
  if (actual !== expected) {
    throw new Error(
      "Conversation revocation changed the durable Lead/AuditLog receipt"
    );
  }
};

const expectDate = (actual: Date | null | undefined, expected: Date) => {
  if (!(actual && actual.getTime() === expected.getTime())) {
    throw new Error(
      `Expected ${expected.toISOString()}, received ${actual?.toISOString()}`
    );
  }
};

const assertBeforeMigration = (state: Map<string, Date | null>) => {
  for (const id of [
    "participant_active",
    "participant_buyer",
    "participant_deleted",
    "participant_disabled",
    "participant_invited",
    "participant_org_deleted",
  ]) {
    if (state.get(id) !== null) {
      throw new Error(`${id} should be active before the migration`);
    }
  }
};

const assertAfterMigration = (
  state: Map<string, Date | null>,
  timestamps: Awaited<ReturnType<typeof createUpgradeFixtures>>
) => {
  if (
    state.get("participant_active") !== null ||
    state.get("participant_buyer") !== null
  ) {
    throw new Error("Active dealer and buyer participation must remain open");
  }
  expectDate(state.get("participant_disabled"), timestamps.disabledAt);
  expectDate(state.get("participant_deleted"), timestamps.clerkDeletedAt);
  expectDate(
    state.get("participant_org_deleted"),
    timestamps.organizationDeletedAt
  );
  expectDate(state.get("participant_left"), timestamps.alreadyLeftAt);
  if (!state.get("participant_invited")) {
    throw new Error(
      "Inactive participation without a source timestamp needs a fallback timestamp"
    );
  }
};

const assertGeneratedClientCompatible = async (connectionString: string) => {
  const client = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  try {
    await client.$transaction([
      client.marketplaceListing.count(),
      client.conversationParticipant.count(),
      client.dealerMember.count(),
      client.lead.count(),
      client.auditLog.count(),
    ]);
  } finally {
    await client.$disconnect();
  }
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: This integration harness owns one linear database lifecycle with mandatory cleanup.
const main = async () => {
  if (
    process.env.DATABASE_URL &&
    !process.argv.includes("--ignore-database-url")
  ) {
    throw new Error(
      "Refusing to run while DATABASE_URL is set; pass --ignore-database-url only to use the isolated local cluster"
    );
  }
  const postgresBin = resolvePostgresBin();
  const executable = (name: string) =>
    join(postgresBin, `${name}${process.platform === "win32" ? ".exe" : ""}`);
  const tempPrefix = resolve(tmpdir(), "automarket-migration-contract-");
  const clusterRoot = mkdtempSync(tempPrefix);
  const clusterData = join(clusterRoot, "data");
  const clusterLog = join(clusterRoot, "postgres.log");
  const workParent = join(packageRoot, ".tmp");
  mkdirSync(workParent, { recursive: true });
  const workRoot = mkdtempSync(join(workParent, "migration-contract-"));
  const resolvedCluster = resolve(clusterRoot);
  const resolvedTemp = resolve(tmpdir());
  if (
    !(
      resolvedCluster.startsWith(`${resolvedTemp}\\`) ||
      resolvedCluster.startsWith(`${resolvedTemp}/`)
    )
  ) {
    throw new Error(
      "Refusing to use a migration cluster outside the system temp directory"
    );
  }
  const resolvedWork = resolve(workRoot);
  const resolvedParent = resolve(workParent);
  if (
    !(
      resolvedWork.startsWith(`${resolvedParent}\\`) ||
      resolvedWork.startsWith(`${resolvedParent}/`)
    )
  ) {
    throw new Error(
      "Refusing to use a migration work directory outside packages/database/.tmp"
    );
  }
  const port = await reservePort();
  let started = false;
  let upgradeClient: Client | undefined;

  try {
    await runRequired(executable("initdb"), [
      "-D",
      clusterData,
      "--auth=trust",
      "--username=postgres",
      "--encoding=UTF8",
      "--no-locale",
    ]);
    await runRequired(
      executable("pg_ctl"),
      [
        "-D",
        clusterData,
        "-l",
        clusterLog,
        "-o",
        `-F -p ${port} -h 127.0.0.1`,
        "-w",
        "start",
      ],
      { timeoutMs: 60_000 }
    );
    started = true;

    const admin = new Client({
      connectionString: databaseUrl(port, "postgres"),
    });
    await admin.connect();
    const freshDatabase = `automarket_migration_fresh_${runId}`;
    const upgradeDatabase = `automarket_migration_upgrade_${runId}`;
    try {
      await admin.query(`CREATE DATABASE ${quoteIdentifier(freshDatabase)}`);
      await admin.query(`CREATE DATABASE ${quoteIdentifier(upgradeDatabase)}`);
    } finally {
      await admin.end();
    }

    const freshUrl = databaseUrl(port, freshDatabase);
    const upgradeUrl = databaseUrl(port, upgradeDatabase);
    const upgradeConfig = createUpgradeConfig(workRoot);

    await deploy(freshUrl, realConfigPath);
    await assertDriftFree(freshUrl);
    await assertMigrationStatus(freshUrl);
    await assertGeneratedClientCompatible(freshUrl);
    await assertReadinessReport(executable("psql"), freshUrl);
    const freshClient = new Client({ connectionString: freshUrl });
    await freshClient.connect();
    try {
      await assertImportAttemptLeaseContract(freshClient, false);
    } finally {
      await freshClient.end();
    }

    await deploy(upgradeUrl, upgradeConfig);
    await assertDriftFree(upgradeUrl, DATABASE_RELEASE_MIGRATIONS);
    upgradeClient = new Client({ connectionString: upgradeUrl });
    await upgradeClient.connect();
    const timestamps = await createUpgradeFixtures(upgradeClient);
    const leadReceipt = await readLeadReceiptState(upgradeClient);
    assertBeforeMigration(await readParticipantState(upgradeClient));
    await assertImportAttemptLeaseContract(upgradeClient, true);
    await assertMachineReadableReleasePreflight(upgradeUrl, upgradeDatabase);

    const pendingSql = readFileSync(
      join(
        migrationsRoot,
        REVOKE_INACTIVE_CONVERSATIONS_MIGRATION,
        "migration.sql"
      ),
      "utf8"
    );
    const leaseDefaultSql = readFileSync(
      join(
        migrationsRoot,
        DROP_IMPORT_ATTEMPT_LEASE_DEFAULT_MIGRATION,
        "migration.sql"
      ),
      "utf8"
    );
    const vehicleTaxonomySql = readFileSync(
      join(
        migrationsRoot,
        VEHICLE_TAXONOMY_FOUNDATION_MIGRATION,
        "migration.sql"
      ),
      "utf8"
    );
    const sellerVerificationDefaultSql = readFileSync(
      join(
        migrationsRoot,
        SELLER_PROFILE_VERIFICATION_DEFAULT_MIGRATION,
        "migration.sql"
      ),
      "utf8"
    );

    const index = await upgradeClient.query<{ present: boolean }>(`
      SELECT EXISTS (
        SELECT 1 FROM "pg_indexes"
        WHERE "schemaname" = 'public'
          AND "indexname" = 'ConversationParticipant_dealerMemberId_conversationId_idx'
      ) AS "present"
    `);
    if (!index.rows[0]?.present) {
      throw new Error("The revocation join index is missing");
    }

    const lockHolder = new Client({ connectionString: upgradeUrl });
    const blockedMigration = new Client({ connectionString: upgradeUrl });
    await lockHolder.connect();
    await blockedMigration.connect();
    try {
      await lockHolder.query("BEGIN");
      await lockHolder.query(
        `SELECT "id" FROM "ConversationParticipant" WHERE "id" = 'participant_disabled' FOR UPDATE`
      );
      const startedAt = Date.now();
      let lockTimedOut = false;
      try {
        await blockedMigration.query(pendingSql);
      } catch (error) {
        lockTimedOut = LOCK_TIMEOUT_PATTERN.test(
          error instanceof Error ? error.message : String(error)
        );
      }
      const elapsedMs = Date.now() - startedAt;
      if (!(lockTimedOut && elapsedMs >= 4000 && elapsedMs < 12_000)) {
        throw new Error(
          `Expected a bounded lock timeout near 5s; timedOut=${lockTimedOut} elapsedMs=${elapsedMs}`
        );
      }
      assertBeforeMigration(await readParticipantState(upgradeClient));
      await assertLeadReceiptUnchanged(upgradeClient, leadReceipt);
    } finally {
      await lockHolder.query("ROLLBACK").catch(() => undefined);
      await lockHolder.end();
      await blockedMigration.end();
    }

    await upgradeClient.query("BEGIN");
    try {
      await upgradeClient.query(pendingSql);
      await upgradeClient.query(leaseDefaultSql);
      await upgradeClient.query(vehicleTaxonomySql);
      await upgradeClient.query(sellerVerificationDefaultSql);
      assertAfterMigration(
        await readParticipantState(upgradeClient),
        timestamps
      );
      await assertImportAttemptLeaseContract(upgradeClient, false);
      await assertLeadReceiptUnchanged(upgradeClient, leadReceipt);
    } finally {
      await upgradeClient.query("ROLLBACK");
    }
    assertBeforeMigration(await readParticipantState(upgradeClient));
    await assertImportAttemptLeaseContract(upgradeClient, true);
    await assertLeadReceiptUnchanged(upgradeClient, leadReceipt);
    await upgradeClient.end();
    upgradeClient = undefined;

    await deploy(upgradeUrl, realConfigPath);
    await assertMigrationStatus(upgradeUrl);
    await assertDriftFree(upgradeUrl);
    await assertGeneratedClientCompatible(upgradeUrl);
    await assertReadinessReport(executable("psql"), upgradeUrl);

    const verified = new Client({ connectionString: upgradeUrl });
    await verified.connect();
    try {
      await assertImportAttemptLeaseContract(verified, false);
      const migratedState = await readParticipantState(verified);
      assertAfterMigration(migratedState, timestamps);
      await assertLeadReceiptUnchanged(verified, leadReceipt);
      await verified.query(pendingSql);
      const reappliedState = await readParticipantState(verified);
      assertAfterMigration(reappliedState, timestamps);
      await assertLeadReceiptUnchanged(verified, leadReceipt);
      for (const [id, leftAt] of migratedState) {
        const reapplied = reappliedState.get(id);
        if ((leftAt?.getTime() ?? null) !== (reapplied?.getTime() ?? null)) {
          throw new Error(`Idempotent reapply changed ${id}`);
        }
      }
    } finally {
      await verified.end();
    }

    process.stdout.write(
      `${JSON.stringify(
        {
          freshDatabase: "passed",
          generatedClient: "passed",
          importAttemptLeaseDefault: "removed_with_index_preserved",
          leadAuditReceipt: "unchanged",
          lockTimeout: "passed",
          machineReadablePreflight: "passed",
          remoteMutation: false,
          rollbackSimulation: "passed",
          unexpectedSchemaDrift: "none",
          upgradeDatabase: "passed",
        },
        undefined,
        2
      )}\n`
    );
  } finally {
    if (upgradeClient) {
      await upgradeClient.end().catch(() => undefined);
    }
    if (started) {
      await run(
        executable("pg_ctl"),
        ["-D", clusterData, "-m", "fast", "-w", "stop"],
        {
          timeoutMs: 60_000,
        }
      ).catch(() => undefined);
    }
    rmSync(resolvedCluster, { force: true, recursive: true });
    rmSync(resolvedWork, { force: true, recursive: true });
  }
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Migration contract failed: ${message}\n`);
  process.exitCode = 1;
});
