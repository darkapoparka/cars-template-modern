import { listOwnedListings } from "@repo/database/listings";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { isSourceManagedListing } from "@repo/marketplace";
import { EyeIcon, PencilIcon, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "../../components/header";
import { getPublicWebBaseUrl } from "../../marketplace-url";
import { requireListingActor } from "../actor";

export const metadata: Metadata = {
  title: "Моите обяви",
  description: "Вашите обяви за продажба в AutoMarket.",
};

const SellerListingsPage = async () => {
  const listings = await listOwnedListings(await requireListingActor());
  const webBaseUrl = getPublicWebBaseUrl();

  return (
    <>
      <Header page="Моите обяви" pages={["AutoMarket", "Продавач"]}>
        <Button asChild className="mr-3 h-9 gap-2 rounded-lg sm:mr-4">
          <Link href="/sell/new">
            <PlusIcon className="h-4 w-4" />
            Нова обява
          </Link>
        </Button>
      </Header>
      <main className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
        <h1 className="sr-only">Моите обяви</h1>
        {listings.length === 0 ? (
          <section className="rounded-lg border bg-card p-8 text-center">
            <h2 className="font-semibold">Все още няма обяви</h2>
            <p className="mt-1 text-muted-foreground text-sm">
              Създайте чернова, за да започнете първата си обява.
            </p>
          </section>
        ) : (
          <section className="grid gap-3">
            {listings.map((listing) => (
              <article
                className="rounded-lg border border-border bg-card p-3 sm:p-4"
                key={listing.id}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h2 className="truncate font-semibold text-base">
                        {listing.title}
                      </h2>
                      <Badge className="rounded-full" variant="secondary">
                        {{
                          active: "Активна",
                          archived: "Архивирана",
                          draft: "Чернова",
                          expired: "Изтекла",
                          paused: "На пауза",
                          pending_review: "Чака преглед",
                          rejected: "Отхвърлена",
                          sold: "Продадена",
                        }[listing.status] ?? listing.status.replace("_", " ")}
                      </Badge>
                      {isSourceManagedListing(listing) && (
                        <Badge className="rounded-full" variant="secondary">
                          Управлява се от източник
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {Math.round(
                        listing.priceAmountMinor / 100
                      ).toLocaleString()}{" "}
                      {listing.priceCurrency} · {listing.locationCity} ·{" "}
                      {listing._count.leads} запитвания
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {listing.status === "active" && (
                      <Button asChild className="h-9 gap-2" variant="secondary">
                        <Link href={`${webBaseUrl}/bg/listing/${listing.slug}`}>
                          <EyeIcon className="h-4 w-4" /> Преглед
                        </Link>
                      </Button>
                    )}
                    {!isSourceManagedListing(listing) && (
                      <Button asChild className="h-9 gap-2">
                        <Link href={`/sell/listings/${listing.id}/edit`}>
                          <PencilIcon className="h-4 w-4" /> Редактиране
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </>
  );
};

export default SellerListingsPage;
