"use server";

import { randomUUID } from "node:crypto";
import {
  OrganizationProfileConflictError,
  publishDealerStudioPublicProfile,
  saveDealerStudioPublicProfileDraft,
} from "@repo/database/organization-profile";
import {
  getDealerPublicProfileEditorPath,
  getDealerPublicProfilePreviewPath,
  type OrganizationImportServiceKind,
  organizationDirectoryProfileInputSchema,
  organizationImportServiceKinds,
} from "@repo/marketplace";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireDealerOrganizationActor } from "../actor";

const serviceKindSet: ReadonlySet<string> = new Set(
  organizationImportServiceKinds
);
const listSeparatorPattern = /[\n,]/;
const tradeLanePattern = /^([A-Za-z]{2})\s*(?:>|→|-)\s*([A-Za-z]{2})$/;

const optional = (formData: FormData, key: string) => {
  const value = String(formData.get(key) ?? "").trim();
  return value || undefined;
};

const parseList = (value: FormDataEntryValue | null) =>
  String(value ?? "")
    .split(listSeparatorPattern)
    .map((item) => item.trim())
    .filter(Boolean);

const parseServices = (formData: FormData): OrganizationImportServiceKind[] =>
  formData
    .getAll("services")
    .map(String)
    .filter((value): value is OrganizationImportServiceKind =>
      serviceKindSet.has(value)
    );

const parseTradeLanes = (
  formData: FormData,
  services: OrganizationImportServiceKind[]
) => {
  const lines = String(formData.get("tradeLanes") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line) => {
    const match = tradeLanePattern.exec(line);
    if (!(match?.[1] && match[2])) {
      throw new Error(`Invalid import route: ${line}`);
    }
    return {
      destinationCountryCode: match[2].toUpperCase(),
      originCountryCode: match[1].toUpperCase(),
      serviceKinds: services,
      vehicleCategories: ["car" as const],
    };
  });
};

const readProfile = (formData: FormData) => {
  const services = parseServices(formData);
  return organizationDirectoryProfileInputSchema.parse({
    brandNames: parseList(formData.get("brandNames")),
    contact: {
      email: optional(formData, "email"),
      phone: optional(formData, "phone"),
      websiteUrl: optional(formData, "websiteUrl"),
    },
    description: optional(formData, "description"),
    displayName: formData.get("displayName"),
    headline: optional(formData, "headline"),
    headquarters: {
      city: optional(formData, "city"),
      countryCode: formData.get("countryCode"),
      region: optional(formData, "region"),
    },
    logoUrl: optional(formData, "logoUrl"),
    profileImageUrl: optional(formData, "profileImageUrl"),
    services,
    tradeLanes: parseTradeLanes(formData, services),
  });
};

const profileState = (state: string, preview = false): never =>
  redirect(
    `${preview ? getDealerPublicProfilePreviewPath() : getDealerPublicProfileEditorPath()}?state=${encodeURIComponent(state)}`
  );

const readValidProfile = (
  formData: FormData
): ReturnType<typeof readProfile> => {
  try {
    return readProfile(formData);
  } catch {
    return profileState("invalid_profile");
  }
};

const readExpectedDraftVersion = (formData: FormData): number => {
  const parsed = z.coerce
    .number()
    .int()
    .positive()
    .safeParse(formData.get("expectedDraftVersion"));
  return parsed.success && parsed.data !== undefined
    ? parsed.data
    : profileState("profile_conflict", true);
};

export const saveDealerPublicProfileDraftAction = async (
  formData: FormData
) => {
  const profile = readValidProfile(formData);

  const expectedVersion = optional(formData, "expectedVersion");
  const parsedVersion = expectedVersion
    ? z.coerce.number().int().positive().safeParse(expectedVersion)
    : null;
  if (parsedVersion && !parsedVersion.success) {
    profileState("profile_conflict");
  }
  const actor = await requireDealerOrganizationActor(["owner", "manager"]);

  try {
    await saveDealerStudioPublicProfileDraft({
      actor,
      expectedVersion: parsedVersion?.data,
      profile,
      requestId: randomUUID(),
    });
  } catch (error) {
    profileState(
      error instanceof OrganizationProfileConflictError
        ? "profile_conflict"
        : "profile_save_failed"
    );
  }

  revalidatePath(getDealerPublicProfileEditorPath());
  revalidatePath(getDealerPublicProfilePreviewPath());
  profileState("draft_saved");
};

export const publishDealerPublicProfileAction = async (formData: FormData) => {
  const expectedDraftVersion = readExpectedDraftVersion(formData);

  const actor = await requireDealerOrganizationActor(["owner", "manager"]);
  try {
    await publishDealerStudioPublicProfile({
      actor,
      expectedDraftVersion,
      requestId: randomUUID(),
    });
  } catch (error) {
    profileState(
      error instanceof OrganizationProfileConflictError
        ? "profile_conflict"
        : "profile_publish_failed",
      true
    );
  }

  revalidatePath(getDealerPublicProfileEditorPath());
  revalidatePath(getDealerPublicProfilePreviewPath());
  profileState("profile_published");
};
