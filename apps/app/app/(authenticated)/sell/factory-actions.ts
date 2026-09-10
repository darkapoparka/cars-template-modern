"use server";

import {
  AI_LIMITS,
  type AiEntitlementPort,
  generateListingCopy,
  LISTING_COPY_PROMPT_VERSION,
  sanitizePlainText,
} from "@repo/ai";
import { database } from "@repo/database";
import { ensureDealerActor } from "@repo/database/accounts";
import {
  assertOwnedListingIsManuallyEditable,
  getOwnedListing,
} from "@repo/database/listings";
import { stubVinDecodeProvider } from "@repo/marketplace";
import { stubPhotoProcessingProvider } from "@repo/storage/photo-processing";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireListingActor } from "./actor";

const requestIdPattern = /^[a-zA-Z0-9_-]{8,80}$/;
const titleSchema = z.string().trim().min(3).max(160);
const descriptionSchema = z.string().trim().min(20).max(10_000);

const getText = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
};

const getCopyTrialLimit = () => {
  const configured = Number.parseInt(
    process.env.AUTOMARKET_AI_LISTING_TRIAL_LIMIT ?? "",
    10
  );
  return Number.isInteger(configured) && configured >= 0 && configured <= 100
    ? configured
    : AI_LIMITS.listingCopy.trialUsesPerListing;
};

const createListingEntitlementPort = (
  listingId: string
): AiEntitlementPort => ({
  async authorizeAndConsume() {
    const limit = getCopyTrialLimit();
    const used = await database.listingGeneration.count({
      where: {
        listingId,
        status: { in: ["done", "processing", "queued"] },
      },
    });
    const allowed = used <= limit;
    return {
      allowed,
      limit,
      remaining: Math.max(0, limit - used),
      source: "listing-generation" as const,
    };
  },
});

const toUsageMetadata = (
  usage:
    | {
        readonly inputTokens?: number;
        readonly outputTokens?: number;
        readonly totalTokens?: number;
      }
    | undefined
) =>
  usage
    ? {
        inputTokens: usage.inputTokens ?? null,
        outputTokens: usage.outputTokens ?? null,
        totalTokens: usage.totalTokens ?? null,
      }
    : null;

const getFactoryContext = async (listingId: string) => {
  const actor = await requireListingActor();
  if (!(actor.clerkOrgId && actor.orgRole)) {
    throw new Error("Listing Factory requires a dealer organization");
  }

  const [listing, dealer] = await Promise.all([
    getOwnedListing(listingId, actor),
    ensureDealerActor({
      allowedRoles: ["owner", "manager", "sales"],
      clerkOrgId: actor.clerkOrgId,
      clerkUserId: actor.clerkUserId,
      orgRole: actor.orgRole,
    }),
  ]);
  if (!listing || listing.dealerOrgId !== dealer.dealerOrg.id) {
    throw new Error("Listing Factory access denied");
  }
  assertOwnedListingIsManuallyEditable(listing);

  return { actor, dealer, listing };
};

export const runDeterministicFactoryAction = async (formData: FormData) => {
  const listingId = getText(formData, "listingId");
  if (!listingId) {
    throw new Error("listingId is required");
  }

  const { dealer, listing } = await getFactoryContext(listingId);
  const notes = sanitizePlainText(getText(formData, "notes"), 2000);
  const submittedRequestId = getText(formData, "requestId");
  const requestId =
    submittedRequestId && requestIdPattern.test(submittedRequestId)
      ? submittedRequestId
      : `listing-v${listing.version}`;
  const idempotencyKey = `factory:${listing.id}:${LISTING_COPY_PROMPT_VERSION}:${requestId}`;
  const existing = await database.listingGeneration.findUnique({
    where: { idempotencyKey },
  });

  if (existing) {
    return redirect(
      `/sell/listings/${listing.id}/edit?factory=${existing.status}`
    );
  }

  const reservation = await database.listingGeneration.create({
    data: {
      attemptCount: 1,
      createdByAccountId: dealer.account.id,
      dealerOrgId: dealer.dealerOrg.id,
      idempotencyKey,
      inputNotes: notes,
      inputPhotoUrls: listing.images.map((image) => image.url),
      listingId: listing.id,
      metadata: {
        confirmationRequired: true,
        feature: "listing-copy",
        requestId,
      },
      promptVersion: LISTING_COPY_PROMPT_VERSION,
      provider: "pending",
      startedAt: new Date(),
      status: "processing",
      vin: listing.vin,
    },
  });

  const copy = await generateListingCopy(
    {
      dealerDisplayName: dealer.dealerOrg.displayName,
      derivative: listing.derivative ?? undefined,
      make: listing.make,
      mileageValue: listing.mileageValue,
      model: listing.model,
      notes,
      photoUrls: listing.images.map((image) => image.url),
      trim: listing.trim ?? undefined,
      vin: listing.vin ?? undefined,
      year: listing.year,
    },
    {
      entitlementPort: createListingEntitlementPort(listing.id),
      idempotencyKey,
      listingId: listing.id,
      organizationId: dealer.dealerOrg.id,
      requestId,
      subjectId: dealer.account.id,
    }
  );
  const vinResult = listing.vin
    ? await stubVinDecodeProvider.decodeVin({ vin: listing.vin })
    : null;
  const photoResults = await Promise.all(
    listing.images.map((image) =>
      stubPhotoProcessingProvider.processPhoto({
        dealerOrgId: dealer.dealerOrg.id,
        imageId: image.id,
        imageUrl: image.url,
        listingId: listing.id,
      })
    )
  );

  await database.$transaction(async (tx) => {
    await tx.listingGeneration.update({
      data: {
        completedAt: new Date(),
        errorMessage: copy.errorCode,
        generatedDescriptionBg: copy.descriptionBg,
        generatedDescriptionEn: copy.descriptionEn,
        generatedShortCopy: copy.shortCopy,
        generatedSocialCaption: copy.socialCaption,
        generatedTitle: copy.title,
        metadata: {
          confirmationRequired: true,
          entitlement: copy.entitlement
            ? {
                allowed: copy.entitlement.allowed,
                limit: copy.entitlement.limit,
                remaining: copy.entitlement.remaining,
                source: copy.entitlement.source,
              }
            : null,
          errorCode: copy.errorCode ?? null,
          feature: "listing-copy",
          limits: {
            maxImages: AI_LIMITS.listingCopy.maxImages,
            maxOutputTokens: AI_LIMITS.listingCopy.maxOutputTokens,
            maxSteps: AI_LIMITS.listingCopy.maxSteps,
            timeoutMs: AI_LIMITS.listingCopy.timeoutMs,
          },
          mode: copy.mode,
          requestId,
          suggestions: copy.suggestions,
          usage: toUsageMetadata(copy.usage),
        },
        model: copy.model,
        provider: copy.provider,
        status: copy.status,
      },
      where: { id: reservation.id },
    });

    if (listing.vin && vinResult) {
      await tx.listingVinDecodeJob.upsert({
        create: {
          completedAt: new Date(),
          createdByAccountId: dealer.account.id,
          dealerOrgId: dealer.dealerOrg.id,
          decodedSpec: vinResult.spec ? { ...vinResult.spec } : {},
          idempotencyKey: `vin:${listing.id}:${listing.vin}`,
          listingId: listing.id,
          provider: vinResult.provider,
          status: vinResult.status,
          vin: listing.vin,
        },
        update: {},
        where: { idempotencyKey: `vin:${listing.id}:${listing.vin}` },
      });
    }

    for (const [index, image] of listing.images.entries()) {
      const result = photoResults[index];
      if (!result) {
        continue;
      }
      await tx.listingPhotoJob.updateMany({
        data: {
          completedAt: new Date(),
          metadata: result.metadata,
          processedUrl: result.processedUrl,
          provider: result.provider,
          status: result.status,
        },
        where: { imageId: image.id, listingId: listing.id },
      });
      await tx.marketplaceListingImage.update({
        data: {
          processedUrl: result.processedUrl,
          processingMetadata: result.metadata,
          processingProvider: result.provider,
          processingStatus: result.status,
        },
        where: { id: image.id },
      });
    }

    await tx.auditLog.create({
      data: {
        action: "listing.factory.suggestions_generated",
        actorAccountId: dealer.account.id,
        actorType: "account",
        dealerOrgId: dealer.dealerOrg.id,
        entityId: listing.id,
        entityType: "listing",
        metadata: {
          confirmationRequired: true,
          errorCode: copy.errorCode ?? null,
          mode: copy.mode,
          model: copy.model ?? null,
          promptVersion: copy.promptVersion,
          provider: copy.provider,
          requestId,
          usage: toUsageMetadata(copy.usage),
        },
      },
    });
  });

  revalidatePath("/dealer/inventory");
  revalidatePath(`/sell/listings/${listing.id}/edit`);
  redirect(`/sell/listings/${listing.id}/edit?factory=ready`);
};

export const applyListingFactorySuggestionsAction = async (
  formData: FormData
) => {
  const listingId = getText(formData, "listingId");
  const generationId = getText(formData, "generationId");
  if (!(listingId && generationId)) {
    throw new Error("listingId and generationId are required");
  }

  const { dealer, listing } = await getFactoryContext(listingId);
  if (listing.status !== "draft") {
    throw new Error("AI suggestions can only be applied to a draft");
  }
  const generation = await database.listingGeneration.findFirst({
    where: {
      dealerOrgId: dealer.dealerOrg.id,
      id: generationId,
      listingId: listing.id,
      status: "done",
    },
  });
  if (!generation) {
    throw new Error("Listing suggestions not found");
  }

  const applyTitle = formData.get("applyTitle") === "on";
  const applyDescription = formData.get("applyDescription") === "on";
  const descriptionLocale =
    formData.get("descriptionLocale") === "en" ? "en" : "bg";
  if (!(applyTitle || applyDescription)) {
    throw new Error("Select at least one suggestion");
  }

  const title = applyTitle
    ? titleSchema.parse(generation.generatedTitle)
    : undefined;
  const description = applyDescription
    ? descriptionSchema.parse(
        descriptionLocale === "en"
          ? generation.generatedDescriptionEn
          : generation.generatedDescriptionBg
      )
    : undefined;
  const appliedFields = [
    ...(title ? ["title"] : []),
    ...(description ? [`description.${descriptionLocale}`] : []),
  ];

  await database.$transaction(async (tx) => {
    const result = await tx.marketplaceListing.updateMany({
      data: {
        ...(description ? { description } : {}),
        ...(title ? { title } : {}),
        version: { increment: 1 },
      },
      where: { id: listing.id, status: "draft", version: listing.version },
    });
    if (result.count !== 1) {
      throw new Error("Listing changed in another session");
    }
    await tx.auditLog.create({
      data: {
        action: "listing.factory.suggestions_applied",
        actorAccountId: dealer.account.id,
        actorType: "account",
        dealerOrgId: dealer.dealerOrg.id,
        entityId: listing.id,
        entityType: "listing",
        metadata: {
          appliedFields,
          generationId: generation.id,
          promptVersion: generation.promptVersion,
        },
      },
    });
  });

  revalidatePath(`/sell/listings/${listing.id}/edit`);
  redirect(`/sell/listings/${listing.id}/edit?factory=applied`);
};
