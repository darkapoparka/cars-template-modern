import { auth } from "@repo/auth/server";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/design-system/components/ui/empty";
import { Input } from "@repo/design-system/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import {
  type MarketplaceSearchParams,
  parseMarketplaceSearchParams,
} from "@repo/marketplace";
import { BellIcon, ExternalLinkIcon, Trash2Icon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { listBuyerSavedSearches } from "../../buyer-data";
import { Header } from "../../components/header";
import { getPublicMarketplaceSearchHref } from "../../marketplace-url";
import { deleteSavedSearchAction, updateSavedSearchAction } from "../actions";

export const metadata: Metadata = {
  title: "Запазени търсения",
  description: "Запазени търсения и известия в AutoMarket.",
};

const cadenceLabels: Record<string, string> = {
  daily: "Ежедневно",
  instant: "Веднага",
  off: "Изключени",
  weekly: "Седмично",
};

const getStoredFilters = (value: unknown): MarketplaceSearchParams => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return parseMarketplaceSearchParams();
  }

  try {
    return parseMarketplaceSearchParams(
      value as Record<string, string | string[] | number | undefined>
    );
  } catch {
    return parseMarketplaceSearchParams();
  }
};

const SavedSearchesPage = async () => {
  const session = await auth();

  if (!session.userId) {
    return session.redirectToSignIn();
  }

  const savedSearches = await listBuyerSavedSearches(session.userId);
  const newSearchHref = getPublicMarketplaceSearchHref();

  return (
    <>
      <Header page="Запазени търсения" pages={["AutoMarket", "Купувач"]}>
        <Button asChild className="mr-3 sm:mr-4" size="sm">
          <Link href={newSearchHref}>Ново търсене</Link>
        </Button>
      </Header>
      <main className="flex flex-1 flex-col gap-4 p-3 sm:p-4 lg:p-6">
        <div>
          <h1 className="font-semibold text-xl">Известия за търсене</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Изберете колко често да получавате известия. Автоматичното изпращане
            ще започне след активиране на услугата за известия.
          </p>
        </div>
        {savedSearches.length > 0 ? (
          <section className="grid gap-3">
            {savedSearches.map((search) => {
              const filters = getStoredFilters(search.filters);

              return (
                <article
                  className="rounded-lg border border-border bg-card p-4"
                  key={search.id}
                >
                  <form
                    action={updateSavedSearchAction}
                    className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_12rem_auto] lg:items-end"
                  >
                    <input
                      name="savedSearchId"
                      type="hidden"
                      value={search.id}
                    />
                    <label
                      className="grid gap-1.5"
                      htmlFor={`saved-search-title-${search.id}`}
                    >
                      <span className="font-medium text-sm">
                        Име на търсенето
                      </span>
                      <Input
                        defaultValue={search.title}
                        id={`saved-search-title-${search.id}`}
                        maxLength={80}
                        name="title"
                        required
                      />
                    </label>
                    <div className="grid gap-1.5">
                      <span
                        className="font-medium text-sm"
                        id={`saved-search-cadence-${search.id}`}
                      >
                        Честота на известията
                      </span>
                      <Select defaultValue={search.cadence} name="cadence">
                        <SelectTrigger
                          aria-labelledby={`saved-search-cadence-${search.id}`}
                          className="w-full"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="off">Изключени</SelectItem>
                          <SelectItem value="instant">Веднага</SelectItem>
                          <SelectItem value="daily">Ежедневно</SelectItem>
                          <SelectItem value="weekly">Седмично</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit">Запази настройките</Button>
                  </form>
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-border border-t pt-4">
                    <Badge
                      variant={
                        search.cadence === "off" ? "outline" : "secondary"
                      }
                    >
                      <BellIcon className="size-3.5" />
                      {search.cadence === "off"
                        ? "Известията са изключени"
                        : (cadenceLabels[search.cadence] ?? search.cadence)}
                    </Badge>
                    {search.newMatches > 0 && (
                      <Badge>{search.newMatches} нови</Badge>
                    )}
                    <Button asChild size="sm" variant="ghost">
                      <Link href={getPublicMarketplaceSearchHref(filters)}>
                        Отвори резултатите
                        <ExternalLinkIcon className="size-4" />
                      </Link>
                    </Button>
                    <form action={deleteSavedSearchAction} className="ml-auto">
                      <input
                        name="savedSearchId"
                        type="hidden"
                        value={search.id}
                      />
                      <Button
                        aria-label={`Изтрий ${search.title}`}
                        size="sm"
                        type="submit"
                        variant="ghost"
                      >
                        <Trash2Icon className="size-4" />
                        Изтрий
                      </Button>
                    </form>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <Empty className="min-h-80 border bg-card">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BellIcon />
              </EmptyMedia>
              <EmptyTitle>Няма запазени търсения</EmptyTitle>
              <EmptyDescription>
                Направете търсене и запазете филтрите му, за да получавате
                известия.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href={newSearchHref}>Започни търсене</Link>
              </Button>
            </EmptyContent>
          </Empty>
        )}
      </main>
    </>
  );
};

export default SavedSearchesPage;
