import { auth } from "@repo/auth/server";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/design-system/components/ui/empty";
import { HeartIcon, SearchIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { listBuyerSavedListings } from "../buyer-data";
import { BuyerListingCard } from "../components/buyer-listing-card";
import { Header } from "../components/header";
import { getPublicMarketplaceSearchHref } from "../marketplace-url";

export const metadata: Metadata = {
  title: "Запазени обяви",
  description: "Запазени автомобили в AutoMarket.",
};

const SavedListingsPage = async () => {
  const session = await auth();

  if (!session.userId) {
    return session.redirectToSignIn();
  }

  const savedListings = await listBuyerSavedListings(session.userId);
  const marketplaceHref = getPublicMarketplaceSearchHref();

  return (
    <>
      <Header page="Запазени обяви" pages={["AutoMarket", "Купувач"]}>
        <Button
          asChild
          className="mr-3 gap-2 sm:mr-4"
          size="sm"
          variant="secondary"
        >
          <Link href={marketplaceHref}>
            <SearchIcon className="size-4" />
            Разгледай
          </Link>
        </Button>
      </Header>
      <main className="flex flex-1 flex-col gap-4 p-3 sm:p-4 lg:p-6">
        <div>
          <h1 className="font-semibold text-xl">Вашият списък</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {savedListings.length}{" "}
            {savedListings.length === 1
              ? "запазен автомобил"
              : "запазени автомобила"}
            .
          </p>
        </div>
        {savedListings.length > 0 ? (
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {savedListings.map((savedListing) => (
              <BuyerListingCard
                key={savedListing.id}
                savedListing={savedListing}
                showRemove
              />
            ))}
          </section>
        ) : (
          <Empty className="min-h-80 border bg-card">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HeartIcon />
              </EmptyMedia>
              <EmptyTitle>Все още няма запазени автомобили</EmptyTitle>
              <EmptyDescription>
                Запазвайте автомобили от търсенето, за да ги сравните тук
                по-късно.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href={marketplaceHref}>Търси автомобили</Link>
              </Button>
            </EmptyContent>
          </Empty>
        )}
      </main>
    </>
  );
};

export default SavedListingsPage;
