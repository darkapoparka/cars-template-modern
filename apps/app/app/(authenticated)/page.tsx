import { auth } from "@repo/auth/server";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  BellIcon,
  HeartIcon,
  MessageSquareIcon,
  SearchIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  listBuyerInquiries,
  listBuyerSavedListings,
  listBuyerSavedSearches,
} from "./buyer-data";
import { BuyerListingCard } from "./components/buyer-listing-card";
import { Header } from "./components/header";
import { getPublicMarketplaceSearchHref } from "./marketplace-url";

export const metadata: Metadata = {
  title: "Преглед за купувача",
  description: "Вашето пространство за купувачи в AutoMarket.",
};

const cadenceLabels: Record<string, string> = {
  daily: "Ежедневно",
  instant: "Веднага",
  off: "Изключени",
  weekly: "Седмично",
};

const OverviewPage = async () => {
  const session = await auth();

  if (!session.userId) {
    return session.redirectToSignIn();
  }

  const [savedListings, savedSearches, inquiries] = await Promise.all([
    listBuyerSavedListings(session.userId),
    listBuyerSavedSearches(session.userId),
    listBuyerInquiries(session.userId),
  ]);
  const alertCount = savedSearches.filter(
    (search) => search.cadence !== "off"
  ).length;
  const marketplaceHref = getPublicMarketplaceSearchHref();

  return (
    <>
      <Header page="Преглед" pages={["AutoMarket", "Купувач"]}>
        <Button asChild className="mr-3 gap-2 sm:mr-4" size="sm">
          <Link href={marketplaceHref}>
            <SearchIcon className="size-4" />
            Търси
          </Link>
        </Button>
      </Header>
      <main className="flex flex-1 flex-col gap-5 p-3 sm:p-4 lg:p-6">
        <section>
          <p className="text-muted-foreground text-sm">
            Пространство за купувача
          </p>
          <h1 className="mt-1 font-semibold text-2xl">
            Продължете търсенето на автомобил
          </h1>
          <p className="mt-1 max-w-2xl text-muted-foreground text-sm">
            Преглеждайте избраните обяви, известията и запитванията към
            продавачи на едно място.
          </p>
        </section>

        <section className="grid grid-cols-3 gap-2 md:gap-3">
          {[
            { icon: HeartIcon, label: "Запазени", value: savedListings.length },
            { icon: BellIcon, label: "Активни известия", value: alertCount },
            {
              icon: MessageSquareIcon,
              label: "Запитвания",
              value: inquiries.length,
            },
          ].map((item) => (
            <article
              className="rounded-lg border border-border bg-card p-3 md:p-4"
              key={item.label}
            >
              <div className="flex items-center justify-between gap-2 text-muted-foreground">
                <span className="text-xs md:text-sm">{item.label}</span>
                <item.icon className="size-4" />
              </div>
              <p className="mt-3 font-semibold text-2xl tabular-nums">
                {item.value}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="font-semibold text-lg">Последно запазени</h2>
                <p className="text-muted-foreground text-sm">
                  Последните обяви във вашия списък.
                </p>
              </div>
              <Button asChild size="sm" variant="secondary">
                <Link href="/saved">Виж всички</Link>
              </Button>
            </div>
            {savedListings.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {savedListings.slice(0, 4).map((savedListing) => (
                  <BuyerListingCard
                    key={savedListing.id}
                    savedListing={savedListing}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed bg-card p-8 text-center">
                <p className="font-medium">Списъкът ви е празен</p>
                <p className="mt-1 text-muted-foreground text-sm">
                  Разгледайте пазара и запазете автомобилите, към които искате
                  да се върнете.
                </p>
                <Button asChild className="mt-4" size="sm">
                  <Link href={marketplaceHref}>Търси автомобили</Link>
                </Button>
              </div>
            )}
          </div>

          <aside className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold">Известия за търсене</h2>
                <p className="text-muted-foreground text-sm">
                  Последни запазени търсения
                </p>
              </div>
              <Button asChild size="sm" variant="ghost">
                <Link href="/saved/searches">Управление</Link>
              </Button>
            </div>
            <div className="mt-3 grid gap-2">
              {savedSearches.length > 0 ? (
                savedSearches.slice(0, 4).map((search) => (
                  <Link
                    className="rounded-md bg-secondary p-3 transition-colors hover:bg-accent"
                    href="/saved/searches"
                    key={search.id}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm">{search.title}</p>
                      <Badge
                        variant={
                          search.cadence === "off" ? "outline" : "secondary"
                        }
                      >
                        {cadenceLabels[search.cadence] ?? search.cadence}
                      </Badge>
                    </div>
                    <p className="mt-1 text-muted-foreground text-xs">
                      {search.newMatches} нови съвпадения
                    </p>
                  </Link>
                ))
              ) : (
                <p className="rounded-md bg-secondary p-4 text-muted-foreground text-sm">
                  Все още няма известия за търсене.
                </p>
              )}
            </div>
          </aside>
        </section>
      </main>
    </>
  );
};

export default OverviewPage;
