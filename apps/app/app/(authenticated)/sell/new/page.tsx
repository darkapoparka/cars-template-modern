import { Button } from "@repo/design-system/components/ui/button";
import { vehicleCategories, vehicleMakes } from "@repo/marketplace";
import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "../../components/header";
import { SellerListingStartForm } from "../components/seller-listing-start-form";
import { createOrResumeMinimumDraft } from "../start-actions";

interface NewListingPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const metadata: Metadata = {
  title: "Създаване на обява",
  description: "Създайте обява за продажба в AutoMarket.",
};

const firstValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const boundedInteger = (
  value: string | undefined,
  minimum: number,
  maximum: number
) => {
  const number = Number(value);

  return Number.isInteger(number) && number >= minimum && number <= maximum
    ? number
    : undefined;
};

const getListingDefaults = (
  searchParams: Record<string, string | string[] | undefined>
) => {
  const categoryCandidate = firstValue(searchParams.category);
  const makeCandidate = firstValue(searchParams.make);
  const modelCandidate = firstValue(searchParams.model)?.trim();
  const category = vehicleCategories.find(
    (candidate) =>
      candidate.id !== "lease" && candidate.id === categoryCandidate
  )?.id;
  const make = vehicleMakes.find((candidate) => candidate === makeCandidate);

  return {
    category,
    make,
    mileageValue: boundedInteger(
      firstValue(searchParams.mileage),
      0,
      10_000_000
    ),
    model:
      modelCandidate && modelCandidate.length <= 80
        ? modelCandidate
        : undefined,
    year: boundedInteger(firstValue(searchParams.year), 1886, 2100),
  };
};

const NewListingPage = async ({ searchParams }: NewListingPageProps) => {
  const defaults = getListingDefaults(await searchParams);

  return (
    <>
      <Header page="Създаване на обява" pages={["AutoMarket", "Продавач"]}>
        <Button
          asChild
          className="mr-3 h-9 gap-2 rounded-lg sm:mr-4"
          variant="secondary"
        >
          <Link href="/sell/listings">
            <ArrowLeftIcon className="h-4 w-4" />
            Обяви
          </Link>
        </Button>
      </Header>
      <main className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
        <SellerListingStartForm
          action={createOrResumeMinimumDraft}
          defaults={defaults}
        />
      </main>
    </>
  );
};

export default NewListingPage;
