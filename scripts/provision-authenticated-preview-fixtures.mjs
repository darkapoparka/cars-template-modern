import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { validateAuthenticatedPreviewEnvironment } from "../apps/e2e/fixtures/authenticated-preview-contract.mts";
import { buildAuthenticatedPreviewFixture } from "../apps/e2e/fixtures/authenticated-preview-data.mts";

const requiredMutationAcknowledgement =
  "I_ACKNOWLEDGE_DISPOSABLE_PREVIEW_DATABASE";
const fieldPattern = /^\s*(\w+)\s+[^@\s]+/;
const fieldMappedNamePattern = /@map\("([^"]+)"\)/;
const insertPattern =
  /INSERT INTO "([^"]+)"\s*\(([\s\S]*?)\)\s*(?:SELECT|VALUES)/g;
const lineBreakPattern = /\r?\n/;
const modelMappedNamePattern = /@@map\("([^"]+)"\)/;
const modelPattern = /model\s+(\w+)\s*\{([\s\S]*?)\n\}/g;
const quotedIdentifierPattern = /"([^"]+)"/g;

const sqlLiteral = (value) => `'${String(value).replaceAll("'", "''")}'`;
const schemaPath = resolve(
  import.meta.dirname,
  "..",
  "packages",
  "database",
  "prisma",
  "schema.prisma"
);

const parsePrismaSchema = (schema) => {
  const models = new Map();
  for (const match of schema.matchAll(modelPattern)) {
    const [, modelName, body = ""] = match;
    const tableName = modelMappedNamePattern.exec(body)?.[1] ?? modelName;
    const columns = new Set();
    for (const line of body.split(lineBreakPattern)) {
      const field = fieldPattern.exec(line);
      if (field?.[1] && !field[1].startsWith("@@")) {
        columns.add(fieldMappedNamePattern.exec(line)?.[1] ?? field[1]);
      }
    }
    models.set(tableName, columns);
  }
  return models;
};

export const validateAuthenticatedPreviewFixtureSchema = (
  sql,
  schema = readFileSync(schemaPath, "utf8")
) => {
  const models = parsePrismaSchema(schema);
  let insertCount = 0;
  for (const match of sql.matchAll(insertPattern)) {
    insertCount += 1;
    const [, table, columnSource = ""] = match;
    const columns = models.get(table);
    if (!columns) {
      throw new Error(
        `Fixture SQL targets unknown Prisma model table ${table}`
      );
    }
    for (const columnMatch of columnSource.matchAll(quotedIdentifierPattern)) {
      const column = columnMatch[1];
      if (column && !columns.has(column)) {
        throw new Error(
          `Fixture SQL targets unknown Prisma column ${table}.${column}`
        );
      }
    }
  }
  if (insertCount === 0) {
    throw new Error("Fixture SQL contains no validated INSERT statements");
  }
  return insertCount;
};

export const buildAuthenticatedPreviewFixtureSql = (environment) => {
  const contract = validateAuthenticatedPreviewEnvironment(environment);
  const fixture = buildAuthenticatedPreviewFixture(contract);
  const { bases: ids, names, slug } = fixture;
  const user = contract.personaUserIds;
  const dealerOrgId = environment.E2E_DEALER_ORG_ID;
  const dealerRole =
    environment.E2E_DEALER_ORG_ROLE === "org:owner" ? "owner" : "manager";
  return `
BEGIN;

INSERT INTO "MarketplaceAccount" ("id", "clerkUserId", "status", "deletedAt", "createdAt", "updatedAt")
VALUES
  (${sqlLiteral(`${ids.buyer}_account`)}, ${sqlLiteral(user.buyer)}, 'active', NULL, NOW(), NOW()),
  (${sqlLiteral(`${ids.seller}_account`)}, ${sqlLiteral(user.seller)}, 'active', NULL, NOW(), NOW()),
  (${sqlLiteral(`${ids.dealer}_account`)}, ${sqlLiteral(user.dealer)}, 'active', NULL, NOW(), NOW()),
  (${sqlLiteral(`${ids.admin}_account`)}, ${sqlLiteral(user.admin)}, 'active', NULL, NOW(), NOW()),
  (${sqlLiteral(`${ids.operator}_account`)}, ${sqlLiteral(user.operator)}, 'active', NULL, NOW(), NOW())
ON CONFLICT ("clerkUserId") DO UPDATE
SET "status" = 'active', "deletedAt" = NULL, "updatedAt" = NOW();

INSERT INTO "SellerProfile" ("id", "accountId", "status", "displayName", "city", "country", "verificationStatus", "deletedAt", "createdAt", "updatedAt")
SELECT ${sqlLiteral(`${ids.seller}_profile`)}, account."id", 'active', ${sqlLiteral(`AM-E2E ${contract.databaseMarker} private seller`)}, 'Sofia', 'Bulgaria', 'verified', NULL, NOW(), NOW()
FROM "MarketplaceAccount" AS account
WHERE account."clerkUserId" = ${sqlLiteral(user.seller)}
ON CONFLICT ("accountId") DO UPDATE
SET "status" = 'active', "displayName" = EXCLUDED."displayName", "deletedAt" = NULL, "updatedAt" = NOW();

INSERT INTO "DealerOrg" ("id", "slug", "clerkOrgId", "orgType", "displayName", "legalName", "city", "country", "countryCode", "registrationCountryCode", "onboardingStatus", "kybStatus", "verificationStatus", "subscriptionStatus", "clerkDeletedAt", "deletedAt", "createdAt", "updatedAt")
VALUES (${sqlLiteral(`${ids.dealer}_org`)}, ${sqlLiteral(`am-e2e-${slug}-dealer-importer`)}, ${sqlLiteral(dealerOrgId)}, 'importer', ${sqlLiteral(names.dealerOrganization)}, ${sqlLiteral(`${names.dealerOrganization} EOOD`)}, 'Sofia', 'Bulgaria', 'BG', 'BG', 'approved', 'verified', 'verified', 'active', NULL, NULL, NOW(), NOW())
ON CONFLICT ("clerkOrgId") DO UPDATE
SET "orgType" = 'importer', "displayName" = EXCLUDED."displayName", "legalName" = EXCLUDED."legalName", "onboardingStatus" = 'approved', "kybStatus" = 'verified', "verificationStatus" = 'verified', "clerkDeletedAt" = NULL, "deletedAt" = NULL, "updatedAt" = NOW();

INSERT INTO "DealerOrg" ("id", "slug", "clerkOrgId", "orgType", "displayName", "legalName", "city", "country", "countryCode", "registrationCountryCode", "onboardingStatus", "kybStatus", "verificationStatus", "subscriptionStatus", "clerkDeletedAt", "deletedAt", "createdAt", "updatedAt")
VALUES (${sqlLiteral(`${ids.foreign}_org`)}, ${sqlLiteral(`am-e2e-${slug}-foreign-dealer`)}, ${sqlLiteral(`org_am_e2e_foreign_${slug}`)}, 'dealer', ${sqlLiteral(names.foreignOrganization)}, ${sqlLiteral(`${names.foreignOrganization} EOOD`)}, 'Plovdiv', 'Bulgaria', 'BG', 'BG', 'approved', 'verified', 'verified', 'active', NULL, NULL, NOW(), NOW())
ON CONFLICT ("clerkOrgId") DO UPDATE
SET "displayName" = EXCLUDED."displayName", "legalName" = EXCLUDED."legalName", "onboardingStatus" = 'approved', "kybStatus" = 'verified', "verificationStatus" = 'verified', "clerkDeletedAt" = NULL, "deletedAt" = NULL, "updatedAt" = NOW();

INSERT INTO "OrganizationDirectoryEntry" ("id", "slug", "dealerOrgId", "orgType", "status", "claimStatus", "sourceKind", "displayName", "legalName", "headline", "description", "city", "country", "headquartersCountryCode", "services", "publishedAt", "createdAt", "updatedAt")
SELECT ${sqlLiteral(`${ids.dealer}_directory_entry`)}, ${sqlLiteral(`am-e2e-${slug}-dealer-directory`)}, dealer."id", 'importer', 'published', 'claimed', 'first_party', ${sqlLiteral(names.dealerOrganization)}, ${sqlLiteral(`${names.dealerOrganization} EOOD`)}, 'Disposable authenticated Preview importer profile', 'Exact-marker Dealer Studio public-profile fixture.', 'Sofia', 'Bulgaria', 'BG', ARRAY['transport', 'vehicle_sourcing']::TEXT[], NOW(), NOW(), NOW()
FROM "DealerOrg" AS dealer
WHERE dealer."clerkOrgId" = ${sqlLiteral(dealerOrgId)}
ON CONFLICT ("dealerOrgId") DO UPDATE
SET "status" = 'published', "claimStatus" = 'claimed', "displayName" = EXCLUDED."displayName", "legalName" = EXCLUDED."legalName", "headline" = EXCLUDED."headline", "description" = EXCLUDED."description", "services" = EXCLUDED."services", "publishedAt" = NOW(), "updatedAt" = NOW();

INSERT INTO "DealerMember" ("id", "dealerOrgId", "accountId", "clerkSourceRole", "role", "status", "clerkDeletedAt", "disabledAt", "createdAt", "updatedAt")
SELECT ${sqlLiteral(`${ids.dealer}_member`)}, dealer."id", account."id", ${sqlLiteral(environment.E2E_DEALER_ORG_ROLE)}, ${sqlLiteral(dealerRole)}::"DealerRole", 'active', NULL, NULL, NOW(), NOW()
FROM "DealerOrg" AS dealer
CROSS JOIN "MarketplaceAccount" AS account
WHERE dealer."clerkOrgId" = ${sqlLiteral(dealerOrgId)} AND account."clerkUserId" = ${sqlLiteral(user.dealer)}
ON CONFLICT ("dealerOrgId", "accountId") DO UPDATE
SET "clerkSourceRole" = EXCLUDED."clerkSourceRole", "role" = EXCLUDED."role", "status" = 'active', "clerkDeletedAt" = NULL, "disabledAt" = NULL, "updatedAt" = NOW();

INSERT INTO "MarketplaceListing" (
  "id", "slug", "category", "status", "title", "description", "priceAmountMinor", "priceCurrency", "priceType", "badges", "make", "model", "year", "bodyType", "fuelType", "transmission", "mileageValue", "locationCity", "locationCountry", "sellerId", "sellerType", "sellerDisplayName", "sellerVerificationStatus", "sellerCity", "sellerProfileId", "createdByAccountId", "promoted", "statusChangedAt", "createdAt", "updatedAt"
)
SELECT ${sqlLiteral(`${ids.seller}_listing`)}, ${sqlLiteral(`am-e2e-${slug}-seller-baseline`)}, 'car', 'draft', ${sqlLiteral(names.sellerListing)}, 'Disposable authenticated Preview seller fixture.', 4200000, 'BGN', 'fixed', ARRAY[]::TEXT[], 'BMW', 'Preview E2E', 2024, 'suv', 'gasoline', 'automatic', 42, 'Sofia', 'Bulgaria', profile."id", 'private', profile."displayName", 'verified', 'Sofia', profile."id", account."id", FALSE, NOW(), NOW(), NOW()
FROM "MarketplaceAccount" AS account
JOIN "SellerProfile" AS profile ON profile."accountId" = account."id"
WHERE account."clerkUserId" = ${sqlLiteral(user.seller)}
ON CONFLICT ("id") DO UPDATE
SET "status" = 'draft', "title" = EXCLUDED."title", "description" = EXCLUDED."description", "deletedAt" = NULL, "updatedAt" = NOW();

INSERT INTO "MarketplaceListing" (
  "id", "slug", "category", "status", "title", "description", "priceAmountMinor", "priceCurrency", "priceType", "badges", "make", "model", "year", "bodyType", "fuelType", "transmission", "mileageValue", "locationCity", "locationCountry", "sellerId", "sellerType", "sellerDisplayName", "sellerVerificationStatus", "sellerCity", "dealerOrgId", "createdByAccountId", "promoted", "publishedAt", "statusChangedAt", "createdAt", "updatedAt"
)
SELECT ${sqlLiteral(`${ids.dealer}_listing`)}, ${sqlLiteral(`am-e2e-${slug}-dealer-inventory`)}, 'car', 'active', ${sqlLiteral(names.dealerListing)}, 'Disposable authenticated Preview dealer and importer fixture.', 8400000, 'BGN', 'fixed', ARRAY[]::TEXT[], 'Volvo', 'Preview E2E', 2025, 'suv', 'hybrid', 'automatic', 84, 'Sofia', 'Bulgaria', dealer."id", 'dealer', dealer."displayName", 'verified', 'Sofia', dealer."id", account."id", FALSE, NOW(), NOW(), NOW(), NOW()
FROM "DealerOrg" AS dealer
CROSS JOIN "MarketplaceAccount" AS account
WHERE dealer."clerkOrgId" = ${sqlLiteral(dealerOrgId)} AND account."clerkUserId" = ${sqlLiteral(user.dealer)}
ON CONFLICT ("id") DO UPDATE
SET "status" = 'active', "title" = EXCLUDED."title", "description" = EXCLUDED."description", "deletedAt" = NULL, "publishedAt" = NOW(), "updatedAt" = NOW();

INSERT INTO "MarketplaceListing" (
  "id", "slug", "category", "status", "title", "description", "priceAmountMinor", "priceCurrency", "priceType", "badges", "make", "model", "year", "bodyType", "fuelType", "transmission", "mileageValue", "locationCity", "locationCountry", "sellerId", "sellerType", "sellerDisplayName", "sellerVerificationStatus", "sellerCity", "dealerOrgId", "createdByAccountId", "promoted", "publishedAt", "statusChangedAt", "createdAt", "updatedAt"
)
SELECT ${sqlLiteral(`${ids.foreign}_listing`)}, ${sqlLiteral(`am-e2e-${slug}-foreign-dealer-inventory`)}, 'car', 'active', ${sqlLiteral(names.foreignListing)}, 'Disposable authenticated Preview cross-tenant fixture.', 12600000, 'BGN', 'fixed', ARRAY[]::TEXT[], 'Audi', 'Foreign Preview E2E', 2025, 'suv', 'diesel', 'automatic', 126, 'Plovdiv', 'Bulgaria', dealer."id", 'dealer', dealer."displayName", 'verified', 'Plovdiv', dealer."id", account."id", FALSE, NOW(), NOW(), NOW(), NOW()
FROM "DealerOrg" AS dealer
CROSS JOIN "MarketplaceAccount" AS account
WHERE dealer."clerkOrgId" = ${sqlLiteral(`org_am_e2e_foreign_${slug}`)} AND account."clerkUserId" = ${sqlLiteral(user.operator)}
ON CONFLICT ("id") DO UPDATE
SET "status" = 'active', "title" = EXCLUDED."title", "description" = EXCLUDED."description", "dealerOrgId" = EXCLUDED."dealerOrgId", "sellerId" = EXCLUDED."sellerId", "deletedAt" = NULL, "publishedAt" = NOW(), "updatedAt" = NOW();

INSERT INTO "SavedListing" ("id", "accountId", "listingId", "createdAt")
SELECT ${sqlLiteral(`${ids.buyer}_saved_listing`)}, account."id", ${sqlLiteral(`${ids.dealer}_listing`)}, NOW()
FROM "MarketplaceAccount" AS account
WHERE account."clerkUserId" = ${sqlLiteral(user.buyer)}
ON CONFLICT ("accountId", "listingId") DO NOTHING;

INSERT INTO "SavedSearch" ("id", "accountId", "title", "description", "filters", "cadence", "enabled", "channel", "timezone", "newMatches", "createdAt", "updatedAt")
SELECT ${sqlLiteral(`${ids.buyer}_saved_search`)}, account."id", ${sqlLiteral(names.buyerSavedSearch)}, 'Disposable authenticated Preview saved-search fixture.', ${sqlLiteral(JSON.stringify({ category: "car", make: "BMW", q: contract.databaseMarker }))}::JSONB, 'daily', TRUE, 'email', 'Europe/Sofia', 1, NOW(), NOW()
FROM "MarketplaceAccount" AS account
WHERE account."clerkUserId" = ${sqlLiteral(user.buyer)}
ON CONFLICT ("id") DO UPDATE
SET "title" = EXCLUDED."title", "filters" = EXCLUDED."filters", "cadence" = 'daily', "enabled" = TRUE, "updatedAt" = NOW();

INSERT INTO "SavedSearch" ("id", "accountId", "title", "description", "filters", "cadence", "enabled", "channel", "timezone", "newMatches", "createdAt", "updatedAt")
SELECT ${sqlLiteral(`${ids.operator}_saved_search`)}, account."id", ${sqlLiteral(names.operatorSavedSearch)}, 'Disposable authenticated Preview foreign-account fixture.', ${sqlLiteral(JSON.stringify({ category: "car", make: "Audi", q: contract.databaseMarker }))}::JSONB, 'daily', TRUE, 'email', 'Europe/Sofia', 1, NOW(), NOW()
FROM "MarketplaceAccount" AS account
WHERE account."clerkUserId" = ${sqlLiteral(user.operator)}
ON CONFLICT ("id") DO UPDATE
SET "title" = EXCLUDED."title", "filters" = EXCLUDED."filters", "cadence" = 'daily', "enabled" = TRUE, "updatedAt" = NOW();

INSERT INTO "Lead" ("id", "listingId", "dealerOrgId", "buyerAccountId", "buyerVerificationStatus", "inquiryDedupeKey", "buyerName", "contactMethod", "message", "status", "source", "channel", "intent", "deletedAt", "createdAt", "updatedAt")
SELECT ${sqlLiteral(`${ids.dealer}_lead`)}, ${sqlLiteral(`${ids.dealer}_listing`)}, dealer."id", buyer."id", 'verified', ${sqlLiteral(`am-e2e:${slug}:dealer-lead`)}, 'AM E2E Buyer', 'in_app', ${sqlLiteral(names.dealerLead)}, 'new', 'listing', 'in_app', 'availability', NULL, NOW(), NOW()
FROM "DealerOrg" AS dealer
CROSS JOIN "MarketplaceAccount" AS buyer
WHERE dealer."clerkOrgId" = ${sqlLiteral(dealerOrgId)} AND buyer."clerkUserId" = ${sqlLiteral(user.buyer)}
ON CONFLICT ("inquiryDedupeKey") DO UPDATE
SET "message" = EXCLUDED."message", "status" = 'new', "deletedAt" = NULL, "updatedAt" = NOW();

INSERT INTO "Lead" ("id", "listingId", "dealerOrgId", "buyerAccountId", "buyerVerificationStatus", "inquiryDedupeKey", "buyerName", "contactMethod", "message", "status", "source", "channel", "intent", "deletedAt", "createdAt", "updatedAt")
SELECT ${sqlLiteral(`${ids.foreign}_lead`)}, ${sqlLiteral(`${ids.foreign}_listing`)}, dealer."id", buyer."id", 'verified', ${sqlLiteral(`am-e2e:${slug}:foreign-dealer-lead`)}, 'AM E2E Buyer', 'in_app', ${sqlLiteral(names.foreignLead)}, 'new', 'listing', 'in_app', 'availability', NULL, NOW(), NOW()
FROM "DealerOrg" AS dealer
CROSS JOIN "MarketplaceAccount" AS buyer
WHERE dealer."clerkOrgId" = ${sqlLiteral(`org_am_e2e_foreign_${slug}`)} AND buyer."clerkUserId" = ${sqlLiteral(user.buyer)}
ON CONFLICT ("inquiryDedupeKey") DO UPDATE
SET "listingId" = EXCLUDED."listingId", "dealerOrgId" = EXCLUDED."dealerOrgId", "message" = EXCLUDED."message", "status" = 'new', "deletedAt" = NULL, "updatedAt" = NOW();

INSERT INTO "Conversation" ("id", "leadId", "listingId", "dealerOrgId", "status", "subject", "lastMessageAt", "createdAt", "updatedAt")
SELECT ${sqlLiteral(`${ids.buyer}_conversation`)}, lead."id", lead."listingId", lead."dealerOrgId", 'open', ${sqlLiteral(names.buyerConversation)}, NOW(), NOW(), NOW()
FROM "Lead" AS lead
WHERE lead."inquiryDedupeKey" = ${sqlLiteral(`am-e2e:${slug}:dealer-lead`)}
ON CONFLICT ("leadId") DO UPDATE
SET "status" = 'open', "subject" = EXCLUDED."subject", "closedAt" = NULL, "lastMessageAt" = NOW(), "updatedAt" = NOW();

INSERT INTO "ConversationParticipant" ("id", "conversationId", "accountId", "dealerMemberId", "role", "joinedAt", "leftAt")
SELECT ${sqlLiteral(`${ids.buyer}_participant`)}, conversation."id", account."id", NULL, 'buyer', NOW(), NULL
FROM "Conversation" AS conversation
JOIN "Lead" AS lead ON lead."id" = conversation."leadId"
CROSS JOIN "MarketplaceAccount" AS account
WHERE lead."inquiryDedupeKey" = ${sqlLiteral(`am-e2e:${slug}:dealer-lead`)} AND account."clerkUserId" = ${sqlLiteral(user.buyer)}
ON CONFLICT ("conversationId", "accountId") DO UPDATE SET "leftAt" = NULL;

INSERT INTO "ConversationParticipant" ("id", "conversationId", "accountId", "dealerMemberId", "role", "joinedAt", "leftAt")
SELECT ${sqlLiteral(`${ids.dealer}_participant`)}, conversation."id", account."id", member."id", 'dealer_member', NOW(), NULL
FROM "Conversation" AS conversation
JOIN "Lead" AS lead ON lead."id" = conversation."leadId"
CROSS JOIN "MarketplaceAccount" AS account
JOIN "DealerMember" AS member ON member."accountId" = account."id"
WHERE lead."inquiryDedupeKey" = ${sqlLiteral(`am-e2e:${slug}:dealer-lead`)} AND account."clerkUserId" = ${sqlLiteral(user.dealer)}
ON CONFLICT ("conversationId", "accountId") DO UPDATE SET "dealerMemberId" = EXCLUDED."dealerMemberId", "role" = 'dealer_member', "leftAt" = NULL;

INSERT INTO "ConversationMessage" ("id", "conversationId", "senderParticipantId", "kind", "status", "body", "clientMessageId", "createdAt")
SELECT ${sqlLiteral(`${ids.buyer}_message`)}, participant."conversationId", participant."id", 'text', 'sent', ${sqlLiteral(`AM-E2E ${contract.databaseMarker} initial message`)}, ${sqlLiteral(`am-e2e:${slug}:initial-message`)}, NOW()
FROM "ConversationParticipant" AS participant
JOIN "Conversation" AS conversation ON conversation."id" = participant."conversationId"
JOIN "Lead" AS lead ON lead."id" = conversation."leadId"
JOIN "MarketplaceAccount" AS account ON account."id" = participant."accountId"
WHERE lead."inquiryDedupeKey" = ${sqlLiteral(`am-e2e:${slug}:dealer-lead`)} AND account."clerkUserId" = ${sqlLiteral(user.buyer)}
ON CONFLICT ("conversationId", "clientMessageId") DO UPDATE SET "body" = EXCLUDED."body", "status" = 'sent', "deletedAt" = NULL;

INSERT INTO "ModerationReport" ("id", "listingId", "reporterAccountId", "source", "reason", "severity", "status", "details", "flags", "listingTitleSnapshot", "sellerIdSnapshot", "createdAt", "updatedAt")
SELECT ${sqlLiteral(`${ids.admin}_moderation`)}, listing."id", buyer."id", 'buyer_report', 'incorrect_details', 'medium', 'new', ${sqlLiteral(names.moderation)}, ARRAY['authenticated-preview']::TEXT[], ${sqlLiteral(names.moderation)}, listing."sellerId", NOW(), NOW()
FROM "MarketplaceListing" AS listing
CROSS JOIN "MarketplaceAccount" AS buyer
WHERE listing."id" = ${sqlLiteral(`${ids.dealer}_listing`)} AND buyer."clerkUserId" = ${sqlLiteral(user.buyer)}
ON CONFLICT ("id") DO UPDATE
SET "status" = 'new', "details" = EXCLUDED."details", "listingTitleSnapshot" = EXCLUDED."listingTitleSnapshot", "resolvedAt" = NULL, "updatedAt" = NOW();

COMMIT;
`;
};

const executeSql = (sql, environment) =>
  new Promise((resolveExecution, reject) => {
    const executable = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
    const child = spawn(
      executable,
      [
        "--filter",
        "@repo/database",
        "exec",
        "prisma",
        "db",
        "execute",
        "--stdin",
      ],
      {
        cwd: resolve(import.meta.dirname, ".."),
        env: environment,
        stdio: ["pipe", "pipe", "pipe"],
        windowsHide: true,
      }
    );
    child.stdout.resume();
    child.stderr.resume();
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal || code !== 0) {
        reject(new Error("Preview fixture provisioning command failed"));
        return;
      }
      resolveExecution();
    });
    child.stdin.end(sql);
  });

export const provisionAuthenticatedPreviewFixtures = async (
  environment = process.env
) => {
  const contract = validateAuthenticatedPreviewEnvironment(environment);
  if (
    environment.AUTOMARKET_E2E_DATABASE_MUTATION !==
    requiredMutationAcknowledgement
  ) {
    throw new Error(
      "AUTOMARKET_E2E_DATABASE_MUTATION must explicitly acknowledge a disposable Preview database"
    );
  }
  const databaseUrl = environment.DATABASE_URL;
  let parsedDatabaseUrl;
  try {
    parsedDatabaseUrl = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL must be a valid Preview Postgres URL");
  }
  if (
    !(
      ["postgres:", "postgresql:"].includes(parsedDatabaseUrl.protocol) &&
      parsedDatabaseUrl.hostname.startsWith(`${contract.databaseEndpointId}.`)
    )
  ) {
    throw new Error("DATABASE_URL does not match E2E_DATABASE_ENDPOINT_ID");
  }

  const sql = buildAuthenticatedPreviewFixtureSql(environment);
  validateAuthenticatedPreviewFixtureSchema(sql);
  if (process.argv.includes("--dry-run")) {
    return createHash("sha256").update(sql).digest("hex");
  }
  await executeSql(sql, environment);
  return createHash("sha256").update(sql).digest("hex");
};

const isMain =
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isMain) {
  try {
    const digest = await provisionAuthenticatedPreviewFixtures();
    process.stdout.write(
      `Authenticated Preview fixture contract prepared (${digest.slice(0, 12)}).\n`
    );
  } catch (error) {
    process.stderr.write(
      `Authenticated Preview fixture provisioning refused: ${
        error instanceof Error ? error.message : "unknown error"
      }\n`
    );
    process.exitCode = 1;
  }
}
