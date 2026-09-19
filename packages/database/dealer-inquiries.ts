import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import type { PrismaClient } from "./generated/client";
import { database } from "./index";

const supportKeyPattern = /^support:[a-f0-9]{64}$/;

const inquirySchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    email: z.email().max(254).optional(),
    phone: z.string().trim().min(5).max(40).optional(),
    message: z.string().max(6000),
    locale: z.enum(["bg", "en"]),
    listingSlug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(180)
      .optional(),
    source: z.enum(["import", "dealer_profile"]),
    intent: z.enum(["general", "finance", "trade_in"]),
  })
  .refine(
    (request) => Boolean(request.phone || request.email),
    "Provide a contact method"
  );
export type DealerInquiryInput = z.infer<typeof inquirySchema>;

/** The server owns destination identity. Retries cannot duplicate a same-day intake. */
export const createPublicDealerInquiry = async (
  dealerOrgId: string,
  input: DealerInquiryInput,
  idempotencyKey: string,
  client: PrismaClient = database,
  now = new Date()
) => {
  if (
    !dealerOrgId ||
    dealerOrgId.length > 128 ||
    !supportKeyPattern.test(idempotencyKey)
  ) {
    throw new Error("Invalid inquiry destination or key");
  }
  const request = inquirySchema.parse(input);
  const dedupeKey = createHash("sha256")
    .update(
      JSON.stringify([
        dealerOrgId,
        now.toISOString().slice(0, 10),
        idempotencyKey,
      ])
    )
    .digest("hex");
  return await client.$transaction(async (tx) => {
    const dealer = await tx.dealerOrg.findFirst({
      select: { id: true },
      where: { id: dealerOrgId, deletedAt: null, clerkDeletedAt: null },
    });
    if (!dealer) {
      throw new Error("Inquiry destination is unavailable");
    }
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${dedupeKey}))`;
    const existing = await tx.lead.findUnique({
      select: {
        id: true,
        dealerOrgId: true,
        deletedAt: true,
        buyerName: true,
        email: true,
        phone: true,
        message: true,
        buyerLocale: true,
        source: true,
        intent: true,
        listing: { select: { slug: true } },
      },
      where: { inquiryDedupeKey: dedupeKey },
    });
    if (existing) {
      if (
        existing.dealerOrgId !== dealerOrgId ||
        existing.deletedAt ||
        existing.buyerName !== request.name ||
        (existing.email ?? undefined) !== request.email ||
        (existing.phone ?? undefined) !== request.phone ||
        existing.message !== request.message ||
        existing.buyerLocale !== request.locale ||
        existing.source !== request.source ||
        existing.intent !== request.intent ||
        existing.listing?.slug !== request.listingSlug
      ) {
        throw new Error("Inquiry retry is unavailable");
      }
      return { id: existing.id };
    }
    const listing = request.listingSlug
      ? await tx.marketplaceListing.findFirst({
          select: { id: true },
          where: {
            slug: request.listingSlug,
            dealerOrgId,
            deletedAt: null,
            status: "active",
          },
        })
      : null;
    if (request.listingSlug && !listing) {
      throw new Error("Inquiry listing is unavailable in this dealership");
    }
    const lead = await tx.lead.create({
      select: { id: true },
      data: {
        dealerOrgId,
        listingId: listing?.id,
        inquiryDedupeKey: dedupeKey,
        buyerName: request.name,
        email: request.email,
        phone: request.phone,
        buyerLocale: request.locale,
        message: request.message,
        source: request.source,
        intent: request.intent,
        channel: "web_form",
        contactMethod: "form",
        status: "new",
      },
    });
    await tx.auditLog.create({
      data: {
        action: "lead.created",
        actorType: "system",
        dealerOrgId,
        entityType: "lead",
        entityId: lead.id,
        metadata: {
          deliveryChannel: "dealer_inbox",
          deliveryState: "received",
          source: request.source,
        },
      },
    });
    return lead;
  });
};
