// biome-ignore-all lint/performance/useTopLevelRegex: These migration-audit regexes execute once per test run.
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  assertConfirmationToken,
  assertPendingMigrationSqlUnchanged,
  createConfirmationToken,
  createMigrationSqlProof,
  DATABASE_RELEASE_MIGRATIONS,
  DROP_IMPORT_ATTEMPT_LEASE_DEFAULT_MIGRATION,
  formatReleaseRefusal,
  MONETIZATION_ENTITLEMENTS_FOUNDATION_MIGRATION,
  parseConnectionIdentity,
  parseReleaseArguments,
  REVOKE_INACTIVE_CONVERSATIONS_MIGRATION,
  ReleaseRefusal,
  VEHICLE_TAXONOMY_FOUNDATION_MIGRATION,
  validateReleaseOptions,
} from "./scripts/database-release";
import { resolvePostgresBin } from "./scripts/postgres-bin";
import { createDatabaseToolEnvironment } from "./scripts/tool-environment";

const packageRoot = resolve(import.meta.dirname);
const migrationsRoot = join(packageRoot, "prisma", "migrations");
const migrationNames = readdirSync(migrationsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
const migrationSql = (name: string) =>
  readFileSync(join(migrationsRoot, name, "migration.sql"), "utf8");
const pendingSql = migrationSql(REVOKE_INACTIVE_CONVERSATIONS_MIGRATION);
const leaseDefaultSql = migrationSql(
  DROP_IMPORT_ATTEMPT_LEASE_DEFAULT_MIGRATION
);
const vehicleTaxonomySql = migrationSql(VEHICLE_TAXONOMY_FOUNDATION_MIGRATION);
const monetizationEntitlementsSql = migrationSql(
  MONETIZATION_ENTITLEMENTS_FOUNDATION_MIGRATION
);

describe("database release wrapper contracts", () => {
  it("redacts credentials while binding confirmation to the exact target", () => {
    const identity = parseConnectionIdentity(
      "postgresql://automarket:do-not-print@ep-example.neon.tech/automarket?sslmode=require"
    );
    expect(identity).toEqual({
      database: "automarket",
      host: "ep-example.neon.tech",
      port: "5432",
    });

    const input = {
      affectedParticipants: 7n,
      backupReference: "snapshot-20260722-pre-cutover",
      branchId: "br-production-123",
      identity,
      pendingMigrationProofs: DATABASE_RELEASE_MIGRATIONS.map((migrationName) =>
        createMigrationSqlProof(migrationName, migrationSql(migrationName))
      ),
      target: "production" as const,
    };
    const token = createConfirmationToken(input);
    expect(token).toMatch(/^APPLY-[a-f0-9]{16}$/);
    expect(
      createConfirmationToken({ ...input, affectedParticipants: 8n })
    ).not.toBe(token);
    expect(
      createConfirmationToken({
        ...input,
        identity: { ...identity, port: "6432" },
      })
    ).not.toBe(token);
    expect(
      createConfirmationToken({
        ...input,
        pendingMigrationProofs: [...input.pendingMigrationProofs].reverse(),
      })
    ).not.toBe(token);
    expect(JSON.stringify(identity)).not.toContain("do-not-print");
  });

  it("invalidates the token and blocks apply after a one-byte pending SQL change", () => {
    const migrationName = REVOKE_INACTIVE_CONVERSATIONS_MIGRATION;
    const preflightProof = createMigrationSqlProof(
      migrationName,
      "SELECT 1;\n"
    );
    const changedProof = createMigrationSqlProof(migrationName, "SELECT 2;\n");
    const input = {
      affectedParticipants: 0n,
      backupReference: "snapshot-pre-cutover",
      branchId: "br-production-123",
      identity: {
        database: "automarket",
        host: "ep-prod.neon.tech",
        port: "5432",
      },
      pendingMigrationProofs: [preflightProof],
      target: "production" as const,
    };

    expect(changedProof.sha256).not.toBe(preflightProof.sha256);
    expect(
      createConfirmationToken({
        ...input,
        pendingMigrationProofs: [changedProof],
      })
    ).not.toBe(createConfirmationToken(input));
    expect(() =>
      assertPendingMigrationSqlUnchanged([preflightProof], [changedProof])
    ).toThrow("Pending migration SQL changed after preflight");
  });

  it("refuses Production and target mismatches unless every operator gate is explicit", () => {
    const identity = {
      database: "automarket",
      host: "ep-prod.neon.tech",
      port: "5432",
    };
    const base = {
      allowProduction: false,
      apply: false,
      backupConfirmed: true,
      backupReference: "snapshot-pre-cutover",
      branchConfirmed: true,
      expectedDatabase: "automarket",
      expectedHost: "ep-prod.neon.tech",
      expectedPort: "5432",
      maxAffectedRows: 100n,
      minimumPublicListings: 1n,
      neonBranchId: "br-production-123",
      outputFormat: "text" as const,
      target: "production" as const,
    };

    expect(() => validateReleaseOptions(base, identity)).toThrow(
      "Production is refused by default"
    );
    try {
      validateReleaseOptions(base, identity);
    } catch (error) {
      expect(error).toMatchObject({ blockerType: "operator_attestation" });
    }
    expect(() =>
      validateReleaseOptions(
        { ...base, allowProduction: true, expectedDatabase: "wrong" },
        identity
      )
    ).toThrow("does not match");
    expect(() =>
      validateReleaseOptions(
        { ...base, allowProduction: true, expectedPort: "6432" },
        identity
      )
    ).toThrow("does not match");
    expect(() =>
      validateReleaseOptions({ ...base, allowProduction: true }, identity)
    ).not.toThrow();
  });

  it("serializes stable machine-readable blocker classes without secrets", () => {
    const report = JSON.parse(
      formatReleaseRefusal(
        new ReleaseRefusal("data_blocker", "integrity count is nonzero"),
        "json"
      )
    ) as Record<string, unknown>;

    expect(report).toMatchObject({
      blockerType: "data_blocker",
      phase: "refusal",
      schemaVersion: "automarket.database-release.v1",
      status: "REFUSED",
    });
    expect(JSON.stringify(report)).not.toContain("postgresql://");
  });

  it("classifies a missing or stale apply token as an operator attestation", () => {
    expect(() => assertConfirmationToken(undefined, "APPLY-expected")).toThrow(
      "--confirm does not match"
    );
    try {
      assertConfirmationToken("APPLY-stale", "APPLY-expected");
    } catch (error) {
      expect(error).toMatchObject({ blockerType: "operator_attestation" });
    }
  });

  it("refuses unknown or misspelled CLI options", () => {
    expect(() => parseReleaseArguments(["--confirm-brnach"])).toThrow(
      "Unsupported flag"
    );
    expect(() => parseReleaseArguments(["--targte=production"])).toThrow(
      "Unsupported option"
    );
    expect(() =>
      parseReleaseArguments(["--target=preview", "--target=production"])
    ).toThrow("Duplicate option");
    expect(() => parseReleaseArguments(["--expected-port=0"])).toThrow(
      "integer from 1 through 65535"
    );
    expect(() => parseReleaseArguments(["--expected-port=65536"])).toThrow(
      "integer from 1 through 65535"
    );
    expect(parseReleaseArguments(["--expected-port=5432"]).expectedPort).toBe(
      "5432"
    );
    expect(parseReleaseArguments(["--format=json"]).outputFormat).toBe("json");
  });
});

describe("migration history safety contracts", () => {
  it("has unique lexically ordered timestamp migrations and a PostgreSQL lock", () => {
    const onDiskOrder = readdirSync(migrationsRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
    expect(new Set(onDiskOrder).size).toBe(onDiskOrder.length);
    expect(migrationNames).toEqual([...migrationNames].sort());
    expect(
      readFileSync(join(migrationsRoot, "migration_lock.toml"), "utf8")
    ).toContain('provider = "postgresql"');
    for (const name of migrationNames) {
      expect(name).toMatch(/^\d{14}_[a-z0-9_]+$/);
      expect(migrationSql(name).trim().length).toBeGreaterThan(0);
    }
  });

  it("keeps non-transactional DDL out of the Prisma migration chain", () => {
    const combined = migrationNames.map(migrationSql).join("\n");
    expect(combined).not.toMatch(
      /CREATE\s+(?:UNIQUE\s+)?INDEX\s+CONCURRENTLY/i
    );
    expect(combined).not.toMatch(/DROP\s+INDEX\s+CONCURRENTLY/i);
    expect(combined).not.toMatch(
      /\bVACUUM\b|\bCREATE\s+DATABASE\b|\bALTER\s+SYSTEM\b/i
    );
  });

  it("contains destructive DDL only in reviewed historical migrations", () => {
    const reviewedDestructiveMigrations = new Set([
      "20260711190000_task08_02_expand",
      "20260711190200_task08_04_contract",
      "20260712220000_global_inventory_m1_hardening",
      "20260712221000_global_inventory_m1_vin_contract",
      "20260713003000_global_inventory_m1_integrity",
    ]);
    const destructivePattern =
      /\bDROP\s+(?:TABLE|COLUMN|TYPE|INDEX|CONSTRAINT)\b|\bTRUNCATE\b|\bDELETE\s+FROM\b/i;
    const destructive = migrationNames.filter((name) =>
      destructivePattern.test(migrationSql(name))
    );
    expect(destructive).toEqual([...reviewedDestructiveMigrations].sort());
  });

  it("snapshots legacy data before destructive conversion and asserts backfills before cleanup", () => {
    const snapshot = migrationNames.indexOf(
      "20260711185900_task08_01_expand_snapshot"
    );
    const expand = migrationNames.indexOf("20260711190000_task08_02_expand");
    const backfill = migrationNames.indexOf(
      "20260711190100_task08_03_backfill_constraints"
    );
    const cleanup = migrationNames.indexOf("20260711190200_task08_04_contract");
    expect(snapshot).toBeLessThan(expand);
    expect(expand).toBeLessThan(backfill);
    expect(backfill).toBeLessThan(cleanup);
    expect(migrationSql(migrationNames[snapshot] ?? "")).toContain(
      'CREATE TABLE "_Task08MarketplaceListing" AS TABLE "MarketplaceListing"'
    );
    expect(migrationSql(migrationNames[backfill] ?? "")).toContain(
      "Task 08 listing backfill incomplete"
    );
    expect(migrationSql(migrationNames[cleanup] ?? "")).toContain(
      'DROP TABLE "_Task08MarketplaceListing"'
    );
  });

  it("validates every deferred check constraint later in migration history", () => {
    const combined = migrationNames.map(migrationSql).join("\n");
    const deferred = [
      ...combined.matchAll(
        /ADD\s+CONSTRAINT\s+"([^"]+)"(?:(?!ADD\s+CONSTRAINT|;)[\s\S])*?NOT\s+VALID/gi
      ),
    ].map((match) => match[1]);
    const validated = new Set(
      [...combined.matchAll(/VALIDATE\s+CONSTRAINT\s+"([^"]+)"/gi)].map(
        (match) => match[1]
      )
    );
    expect(deferred.length).toBeGreaterThan(0);
    expect(deferred.filter((name) => name && !validated.has(name))).toEqual([]);
  });
});

describe("local PostgreSQL tooling environment contract", () => {
  const canonicalBin = "C:\\PostgreSQL\\canonical\\bin";
  const fallbackBin = "C:\\PostgreSQL\\fallback\\bin";
  const requiredExecutables = [
    "initdb.exe",
    "pg_ctl.exe",
    "postgres.exe",
    "psql.exe",
  ];
  const executableExists = (path: string) =>
    [canonicalBin, fallbackBin].some((bin) =>
      requiredExecutables.some((executable) => path === join(bin, executable))
    );

  it("uses only the canonical explicit PostgreSQL binary override", () => {
    expect(
      resolvePostgresBin({
        environment: { AUTOMARKET_PG_BIN: canonicalBin },
        fallbackCandidates: [fallbackBin],
        fileExists: executableExists,
        platform: "win32",
      })
    ).toBe(canonicalBin);
  });

  it("refuses the legacy PG_BIN alias instead of silently accepting it", () => {
    expect(() =>
      resolvePostgresBin({
        environment: { PG_BIN: fallbackBin },
        fallbackCandidates: [fallbackBin],
        fileExists: executableExists,
        platform: "win32",
      })
    ).toThrow("PG_BIN is not supported; rename it to AUTOMARKET_PG_BIN");
  });

  it("refuses an incomplete canonical toolchain instead of changing tool identity", () => {
    expect(() =>
      resolvePostgresBin({
        environment: { AUTOMARKET_PG_BIN: canonicalBin },
        fallbackCandidates: [fallbackBin],
        fileExists: (path) =>
          path === join(canonicalBin, "initdb.exe") ||
          requiredExecutables.some(
            (executable) => path === join(fallbackBin, executable)
          ),
        platform: "win32",
      })
    ).toThrow(
      "AUTOMARKET_PG_BIN is missing pg_ctl.exe, postgres.exe, psql.exe; refusing fallback discovery"
    );
  });

  it("retains deterministic fallback discovery when no override is supplied", () => {
    expect(
      resolvePostgresBin({
        environment: {},
        fallbackCandidates: ["C:\\PostgreSQL\\missing\\bin", fallbackBin],
        fileExists: executableExists,
        platform: "win32",
      })
    ).toBe(fallbackBin);
  });

  it("removes ambient shadow targets from every Prisma subprocess environment", () => {
    const source = {
      DATABASE_URL: "postgresql://remote.example/ambient",
      SAFE_MARKER: "preserved",
      SHADOW_DATABASE_URL: "postgresql://remote.example/shadow",
    };
    const sanitized = createDatabaseToolEnvironment(
      source,
      "postgresql://127.0.0.1:5432/local_contract"
    );

    expect(sanitized).toMatchObject({
      DATABASE_URL: "postgresql://127.0.0.1:5432/local_contract",
      SAFE_MARKER: "preserved",
    });
    expect(sanitized).not.toHaveProperty("SHADOW_DATABASE_URL");
    expect(source.SHADOW_DATABASE_URL).toContain("/shadow");
  });
});

describe("inactive dealer conversation migration contract", () => {
  it("is the first release migration, data-only, bounded and fail-closed on tenant inconsistencies", () => {
    expect(migrationNames.slice(-DATABASE_RELEASE_MIGRATIONS.length)).toEqual(
      DATABASE_RELEASE_MIGRATIONS
    );
    expect(pendingSql).toContain("SET lock_timeout = '5s'");
    expect(pendingSql).toContain("SET statement_timeout = '30s'");
    expect(pendingSql).toContain("tenant bindings are inconsistent");
    expect(pendingSql).toContain(
      'conversation."dealerOrgId" IS DISTINCT FROM member."dealerOrgId"'
    );
    expect(pendingSql).toContain(
      'participant."accountId" <> member."accountId"'
    );
    expect(pendingSql).toContain('participant."leftAt" IS NULL');
    expect(pendingSql).toContain("member.\"status\" <> 'active'");
    expect(pendingSql).not.toMatch(
      /\b(?:CREATE|ALTER|DROP|TRUNCATE|DELETE|INSERT)\s+(?:TABLE|TYPE|FROM|INTO)?/i
    );
    expect(pendingSql).not.toMatch(/\b(?:Lead|AuditLog)\b/);
  });

  it("removes only the reviewed temporary import-attempt backfill default", () => {
    expect(migrationNames).toContain(
      DROP_IMPORT_ATTEMPT_LEASE_DEFAULT_MIGRATION
    );
    expect(leaseDefaultSql).toContain(
      'ALTER COLUMN "leaseExpiresAt" DROP DEFAULT'
    );
    expect(leaseDefaultSql).toContain("SET lock_timeout = '5s'");
    expect(leaseDefaultSql).toContain("SET statement_timeout = '30s'");
    expect(leaseDefaultSql).not.toMatch(
      /\b(?:UPDATE|DELETE|INSERT|TRUNCATE)\b/i
    );
  });

  it("adds normalized vehicle taxonomy without rewriting listing truth", () => {
    expect(vehicleTaxonomySql).toContain('CREATE TABLE "VehicleModelFamily"');
    expect(vehicleTaxonomySql).toContain('CREATE TABLE "VehicleDerivative"');
    expect(vehicleTaxonomySql).toContain(
      '"VehicleTaxonomyReference_one_target_check"'
    );
    expect(vehicleTaxonomySql).not.toMatch(
      /(?:^|\n)\s*(?:UPDATE\b|DELETE\s+FROM\b|TRUNCATE\b)/i
    );
  });

  it("adds entitlement and promotion audit state without inventing paid rows", () => {
    expect(monetizationEntitlementsSql).toContain(
      'CREATE TABLE "EntitlementGrant"'
    );
    expect(monetizationEntitlementsSql).toContain(
      'CREATE TABLE "EntitlementUsageEvent"'
    );
    expect(monetizationEntitlementsSql).toContain(
      'CREATE TABLE "ListingPromotionEvent"'
    );
    expect(monetizationEntitlementsSql).toContain(
      '"EntitlementGrant_exactly_one_subject_check"'
    );
    expect(monetizationEntitlementsSql).toContain(
      '"ListingPromotion_refund_amount_check"'
    );
    expect(monetizationEntitlementsSql).toContain(
      'WHERE "providerPaymentIntentId" IS NOT NULL'
    );
    expect(monetizationEntitlementsSql).not.toMatch(
      /UPDATE\s+"ListingPromotion"\s+SET\s+"paymentStatus"\s*=\s*'paid'\s*;/i
    );
    expect(monetizationEntitlementsSql).not.toMatch(
      /(?:STRIPE_SECRET|sk_live_|whsec_)/i
    );
  });

  it("matches every current query and revocation action authorization invariant", () => {
    const authSync = readFileSync(join(packageRoot, "auth-sync.ts"), "utf8");
    const leads = readFileSync(join(packageRoot, "leads.ts"), "utf8");
    const organizations = readFileSync(
      join(packageRoot, "organizations.ts"),
      "utf8"
    );

    expect(leads).toContain("leftAt: null");
    expect(leads).toContain('role: "dealer_member" as const');
    expect(leads).toContain(
      "participant.dealerMember.dealerOrgId ===\n          participant.conversation.dealerOrgId"
    );
    expect(leads).toContain('participant.dealerMember.status === "active"');
    expect(leads).toContain("participant.dealerMember.disabledAt === null");
    expect(leads).toContain("participant.dealerMember.clerkDeletedAt === null");
    expect(organizations).toContain("tx.conversationParticipant.updateMany");
    expect(organizations).toContain(
      "dealerMember: { dealerOrgId: organization.id }"
    );
    expect(organizations).toContain(
      'data: { leftAt: status === "active" ? null : input.providerUpdatedAt }'
    );
    expect(authSync).toContain("tx.conversationParticipant.updateMany");
    expect(authSync).toContain(
      "where: { accountId: account.id, leftAt: null }"
    );
    expect(authSync).toContain("data: { leftAt: input.providerUpdatedAt }");
    expect(leads).toContain(
      "Anonymous private-seller lead delivery is not configured"
    );
    expect(leads).toContain('action: "lead.created"');
    expect(leads).toContain('entityType: "lead"');
    expect(leads).toContain('deliveryState: "delivered"');
  });
});
