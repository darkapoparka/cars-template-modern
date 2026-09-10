"use server";

import { createListingDraft } from "@repo/database/listings";
import { listingInputFromFormData } from "@repo/marketplace";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { ZodError } from "zod";
import { requireListingActor } from "../../../sell/actor";
import { requireDealerOrganizationActor } from "../../actor";

const listingWriterRoles = ["owner", "manager", "sales"] as const;

export const createDealerListingAction = async (formData: FormData) => {
  await requireDealerOrganizationActor(listingWriterRoles);
  const actor = await requireListingActor();

  if (!(actor.clerkOrgId && actor.orgRole)) {
    notFound();
  }

  let listingInput: ReturnType<typeof listingInputFromFormData>;

  try {
    listingInput = listingInputFromFormData(formData);
  } catch (error) {
    if (error instanceof ZodError) {
      return redirect("/dealer/inventory/new?state=invalid");
    }

    throw error;
  }

  await createListingDraft(listingInput, actor);
  revalidatePath("/dealer/inventory");
  revalidatePath("/sell/listings");
  redirect("/dealer/inventory");
};
