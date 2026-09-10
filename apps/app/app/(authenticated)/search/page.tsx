import { auth } from "@repo/auth/server";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import {
  type MarketplaceSearchParams,
  parseMarketplaceSearchParams,
} from "@repo/marketplace";
import { BellIcon, ExternalLinkIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "../components/header";
import { getPublicMarketplaceSearchHref } from "../marketplace-url";
import { createSavedSearchAction } from "../saved/actions";

interface SearchPageProperties {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const metadata: Metadata = {
  title: "Запази търсене",
  description: "Запазете филтри от публичния пазар в профила си.",
};

const categoryLabels: Record<MarketplaceSearchParams["category"], string> = {
  car: "Автомобили",
  lease: "Лизинг",
  motorbike: "Мотоциклети",
  truck: "Камиони",
  van: "Бусове",
};

const getSearchSummary = (filters: MarketplaceSearchParams) => {
  const summary = [categoryLabels[filters.category]];

  if (filters.q) {
    summary.push(filters.q);
  }
  if (filters.make || filters.model || filters.trim) {
    summary.push(
      [filters.make, filters.model, filters.trim].filter(Boolean).join(" ")
    );
  }
  if (filters.location) {
    summary.push(filters.location);
  }

  return summary;
};

const SearchPage = async ({ searchParams }: SearchPageProperties) => {
  const session = await auth();

  if (!session.userId) {
    return session.redirectToSignIn();
  }

  const filters = parseMarketplaceSearchParams(await searchParams);
  const publicResultsHref = getPublicMarketplaceSearchHref(filters);
  const summary = getSearchSummary(filters);

  return (
    <>
      <Header page="Запази търсене" pages={["AutoMarket", "Купувач"]} />
      <main className="flex flex-1 flex-col gap-4 p-3 sm:p-4 lg:p-6">
        <section className="rounded-lg border border-border bg-card p-4 sm:p-5">
          <p className="text-muted-foreground text-sm">Публичен пазар</p>
          <h1 className="mt-1 font-semibold text-xl">Запазете това търсене</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground text-sm">
            Резултатите и филтрите остават в публичния пазар. В профила си
            управлявате само името и честотата на известията.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {summary.map((item) => (
              <Badge key={item} variant="secondary">
                {item}
              </Badge>
            ))}
          </div>

          <form
            action={createSavedSearchAction}
            className="mt-5 grid gap-3 border-border border-t pt-5 sm:max-w-xl sm:grid-cols-[minmax(0,1fr)_auto]"
          >
            <input
              name="filters"
              type="hidden"
              value={JSON.stringify(filters)}
            />
            <label className="grid gap-1.5" htmlFor="saved-search-title">
              <span className="font-medium text-sm">Име на търсенето</span>
              <Input
                defaultValue={
                  filters.q ? `Търсене: ${filters.q}` : summary.join(" · ")
                }
                id="saved-search-title"
                maxLength={80}
                name="title"
                required
              />
            </label>
            <Button className="sm:self-end" type="submit">
              <BellIcon aria-hidden="true" className="size-4" />
              Запази
            </Button>
          </form>

          <Button asChild className="mt-3" variant="ghost">
            <Link href={publicResultsHref}>
              Виж резултатите в пазара
              <ExternalLinkIcon aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        </section>
      </main>
    </>
  );
};

export default SearchPage;
