"use server";

import { randomUUID } from "node:crypto";
import {
  createOrganizationKybCase,
  OrganizationVerificationConflictError,
  saveOrganizationLegalEntity,
  transitionOrganizationKybCase,
} from "@repo/database/organization-verification";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireDealerOrganizationActor } from "../actor";

const legalEntitySchema = z.object({
  addressCountryCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/),
  addressLine1: z.string().trim().min(2).max(200),
  addressLine2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(120),
  entityType: z.enum([
    "sole_proprietor",
    "partnership",
    "private_company",
    "public_company",
    "nonprofit",
    "government",
    "other",
  ]),
  eoriNumber: z.string().trim().max(64).optional(),
  expectedDataVersion: z.coerce.number().int().positive().optional(),
  incorporationDate: z.string().trim().optional(),
  legalName: z.string().trim().min(2).max(200),
  postalCode: z.string().trim().max(32).optional(),
  region: z.string().trim().max(120).optional(),
  registrationCountryCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/),
  registrationNumber: z.string().trim().min(2).max(80),
  taxId: z.string().trim().max(80).optional(),
  tradingName: z.string().trim().max(200).optional(),
  vatId: z.string().trim().max(80).optional(),
});

const caseTransitionSchema = z.object({
  expectedVersion: z.coerce.number().int().positive(),
  kybCaseId: z.string().min(6).max(128),
  nextStatus: z.enum([
    "awaiting_documents",
    "ready_for_submission",
    "submitted",
    "cancelled",
  ]),
});

const optional = (formData: FormData, key: string) => {
  const value = String(formData.get(key) ?? "").trim();
  return value || undefined;
};

const settingsState = (state: string): never =>
  redirect(`/dealer/settings?state=${encodeURIComponent(state)}`);

export const saveLegalEntityAction = async (formData: FormData) => {
  const parsed = legalEntitySchema.safeParse({
    addressCountryCode: formData.get("addressCountryCode"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: optional(formData, "addressLine2"),
    city: formData.get("city"),
    entityType: formData.get("entityType"),
    eoriNumber: optional(formData, "eoriNumber"),
    expectedDataVersion: optional(formData, "expectedDataVersion"),
    incorporationDate: optional(formData, "incorporationDate"),
    legalName: formData.get("legalName"),
    postalCode: optional(formData, "postalCode"),
    region: optional(formData, "region"),
    registrationCountryCode: formData.get("registrationCountryCode"),
    registrationNumber: formData.get("registrationNumber"),
    taxId: optional(formData, "taxId"),
    tradingName: optional(formData, "tradingName"),
    vatId: optional(formData, "vatId"),
  });
  const data = parsed.success
    ? parsed.data
    : settingsState("invalid_legal_entity");

  const actor = await requireDealerOrganizationActor(["owner", "manager"]);
  const incorporationDate = data.incorporationDate
    ? new Date(`${data.incorporationDate}T00:00:00.000Z`)
    : undefined;

  if (incorporationDate && Number.isNaN(incorporationDate.getTime())) {
    settingsState("invalid_legal_entity");
  }

  try {
    await saveOrganizationLegalEntity({
      addressCountryCode: data.addressCountryCode,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      actor,
      city: data.city,
      entityType: data.entityType,
      eoriNumber: data.eoriNumber,
      expectedDataVersion: data.expectedDataVersion,
      incorporationDate,
      legalName: data.legalName,
      postalCode: data.postalCode,
      region: data.region,
      registrationCountryCode: data.registrationCountryCode,
      registrationNumber: data.registrationNumber,
      taxId: data.taxId,
      tradingName: data.tradingName,
      vatId: data.vatId,
    });
  } catch (error) {
    settingsState(
      error instanceof OrganizationVerificationConflictError
        ? "verification_conflict"
        : "legal_entity_failed"
    );
  }

  revalidatePath("/dealer/settings");
  settingsState("legal_entity_saved");
};

export const startKybCaseAction = async () => {
  const actor = await requireDealerOrganizationActor(["owner", "manager"]);

  try {
    await createOrganizationKybCase({ actor });
  } catch (error) {
    settingsState(
      error instanceof OrganizationVerificationConflictError
        ? "verification_conflict"
        : "kyb_case_failed"
    );
  }

  revalidatePath("/dealer/settings");
  settingsState("kyb_case_started");
};

export const transitionKybCaseAction = async (formData: FormData) => {
  const parsed = caseTransitionSchema.safeParse({
    expectedVersion: formData.get("expectedVersion"),
    kybCaseId: formData.get("kybCaseId"),
    nextStatus: formData.get("nextStatus"),
  });
  const data = parsed.success
    ? parsed.data
    : settingsState("verification_conflict");

  const actor = await requireDealerOrganizationActor(["owner", "manager"]);

  try {
    await transitionOrganizationKybCase({
      actor,
      expectedVersion: data.expectedVersion,
      kybCaseId: data.kybCaseId,
      nextStatus: data.nextStatus,
      requestId: randomUUID(),
    });
  } catch (error) {
    settingsState(
      error instanceof OrganizationVerificationConflictError
        ? "verification_conflict"
        : "kyb_transition_failed"
    );
  }

  revalidatePath("/dealer/settings");
  settingsState("kyb_status_updated");
};
