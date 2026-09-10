import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  applyDealerOrganizationSyncEvent,
  receiveExternalIdentitySyncEvent,
} from "./auth-sync";
import { PrismaClient } from "./generated/client";
import { applyDealerMemberClerkEvent } from "./organizations";

const connectionString = process.env.DATABASE_URL;
const integrationDescribe = connectionString ? describe : describe.skip;

integrationDescribe(
  "ordered Clerk membership events against PostgreSQL",
  () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const clerkOrgId = `org_membership_${suffix}`;
    const clerkUserId = `user_membership_${suffix}`;
    const clerkMembershipId = `orgmem_${suffix}`;
    let client: PrismaClient;

    beforeAll(async () => {
      if (!connectionString) {
        throw new Error("DATABASE_URL is required for the integration test");
      }
      client = new PrismaClient({
        adapter: new PrismaPg({ connectionString }),
      });
      await client.dealerOrg.create({
        data: {
          id: randomUUID(),
          clerkOrgId,
          displayName: "Ordered Membership Test",
          slug: `ordered-membership-${suffix}`,
        },
      });
    });

    afterAll(async () => {
      await client?.$disconnect();
    });

    it("keeps delete tombstones over older/equal updates and accepts a newer recreation", async () => {
      const deletedAt = new Date("2026-07-13T12:00:00.000Z");
      const deletion = await applyDealerMemberClerkEvent(
        {
          clerkMembershipId,
          clerkOrgId,
          clerkUserId,
          eventId: `msg_delete_${suffix}`,
          eventKind: "deleted",
          clerkSourceRole: "org:member",
          recognizedRole: true,
          role: "sales",
          providerUpdatedAt: deletedAt,
        },
        client
      );
      expect(deletion).toMatchObject({
        applied: true,
        member: { clerkDeletedAt: deletedAt, status: "disabled" },
      });

      for (const [eventId, providerUpdatedAt] of [
        [`msg_older_${suffix}`, new Date("2026-07-13T11:59:59.000Z")],
        [`msg_equal_${suffix}`, deletedAt],
      ] as const) {
        const ignored = await applyDealerMemberClerkEvent(
          {
            clerkMembershipId,
            clerkOrgId,
            clerkUserId,
            eventId,
            eventKind: "active",
            clerkSourceRole: "org:admin",
            recognizedRole: true,
            role: "manager",
            providerUpdatedAt,
          },
          client
        );
        expect(ignored).toMatchObject({
          applied: false,
          member: { clerkDeletedAt: deletedAt, status: "disabled" },
        });
      }

      const duplicateDelete = await applyDealerMemberClerkEvent(
        {
          clerkMembershipId,
          clerkOrgId,
          clerkUserId,
          eventId: `msg_delete_${suffix}`,
          eventKind: "deleted",
          clerkSourceRole: "org:member",
          recognizedRole: true,
          role: "sales",
          providerUpdatedAt: deletedAt,
        },
        client
      );
      expect(duplicateDelete).toMatchObject({ applied: false });

      const recreated = await applyDealerMemberClerkEvent(
        {
          clerkMembershipId: `orgmem_recreated_${suffix}`,
          clerkOrgId,
          clerkUserId,
          eventId: `msg_recreated_${suffix}`,
          eventKind: "active",
          clerkSourceRole: "org:admin",
          recognizedRole: true,
          role: "manager",
          providerUpdatedAt: new Date("2026-07-13T12:00:01.000Z"),
        },
        client
      );
      expect(recreated).toMatchObject({
        applied: true,
        member: {
          clerkDeletedAt: null,
          clerkMembershipId: `orgmem_recreated_${suffix}`,
          role: "manager",
          status: "active",
        },
      });
    });
  }
);

integrationDescribe("durable Clerk organization deletion", () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const clerkOrgId = `org_delete_${suffix}`;
  let client: PrismaClient;

  beforeAll(() => {
    if (!connectionString) {
      throw new Error("DATABASE_URL is required for the integration test");
    }
    client = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  });

  afterAll(async () => {
    await client?.$disconnect();
  });

  it("atomically disables public dealer state and terminals stale inbox work", async () => {
    const organization = await client.dealerOrg.create({
      data: {
        id: randomUUID(),
        clerkOrgId,
        displayName: "Deletion Safety Dealer",
        slug: `deletion-safety-${suffix}`,
      },
    });
    const listing = await client.marketplaceListing.create({
      data: {
        bodyType: "suv",
        category: "car",
        dealerOrgId: organization.id,
        description:
          "A manual dealer listing that must not survive org deletion.",
        fuelType: "diesel",
        locationCity: "Sofia",
        locationCountry: "Bulgaria",
        make: "Volvo",
        mileageValue: 42_000,
        model: "XC60",
        priceAmountMinor: 8_000_000,
        priceCurrency: "BGN",
        sellerCity: "Sofia",
        sellerDisplayName: "Deletion Safety Dealer",
        sellerId: `dealer-${suffix}`,
        sellerType: "dealer",
        slug: `delete-listing-${suffix}`,
        status: "active",
        title: "2022 Volvo XC60",
        transmission: "automatic",
        year: 2022,
      },
    });
    const deletedAt = new Date("2026-07-14T06:00:00.000Z");
    const deleteEventId = `evt_org_delete_${suffix}`;
    await receiveExternalIdentitySyncEvent(
      {
        aggregateId: clerkOrgId,
        aggregateType: "organization",
        eventType: "organization.deleted",
        payloadHash: "a".repeat(64),
        providerEventId: deleteEventId,
        providerOccurredAt: deletedAt,
      },
      client
    );
    await applyDealerOrganizationSyncEvent(
      {
        clerkOrgId,
        displayName: organization.displayName,
        eventKind: "deleted",
        providerEventId: deleteEventId,
        providerUpdatedAt: deletedAt,
        slug: organization.slug,
      },
      client
    );

    expect(
      await client.marketplaceListing.findUnique({ where: { id: listing.id } })
    ).toMatchObject({ pausedAt: deletedAt, status: "paused" });
    expect(
      await client.listingStatusEvent.findFirst({
        where: { listingId: listing.id, reasonCode: "organization_inactive" },
      })
    ).toMatchObject({ fromStatus: "active", toStatus: "paused" });
    expect(
      await client.externalIdentitySyncEvent.findUnique({
        where: {
          provider_providerEventId: {
            provider: "clerk",
            providerEventId: deleteEventId,
          },
        },
      })
    ).toMatchObject({ status: "applied" });

    const staleEventId = `evt_org_stale_${suffix}`;
    await receiveExternalIdentitySyncEvent(
      {
        aggregateId: clerkOrgId,
        aggregateType: "organization",
        eventType: "organization.updated",
        payloadHash: "b".repeat(64),
        providerEventId: staleEventId,
        providerOccurredAt: new Date(deletedAt.getTime() - 1000),
      },
      client
    );
    await expect(
      applyDealerOrganizationSyncEvent(
        {
          clerkOrgId,
          displayName: "Stale resurrection",
          eventKind: "active",
          providerEventId: staleEventId,
          providerUpdatedAt: new Date(deletedAt.getTime() - 1000),
        },
        client
      )
    ).resolves.toMatchObject({ applied: false });
    expect(
      await client.externalIdentitySyncEvent.findUnique({
        where: {
          provider_providerEventId: {
            provider: "clerk",
            providerEventId: staleEventId,
          },
        },
      })
    ).toMatchObject({ status: "ignored_stale" });
  });
});
