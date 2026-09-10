"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import {
  buildMarketplaceSearchHref,
  type MarketplaceSearchParams,
  type VehicleCategory,
} from "@repo/marketplace";
import { ArrowRightIcon, LoaderCircle, SearchIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  type AssistedSearchResponse,
  assistedSearchResponseSchema,
} from "@/lib/assisted-search";

interface AssistedSearchPanelProps {
  readonly basePath: string;
  readonly category: VehicleCategory;
  readonly locale: string;
}

interface AssistedSearchView extends AssistedSearchResponse {
  readonly requestId: string;
}

const getCopy = (locale: string) => {
  const isBg = locale.toLocaleLowerCase().startsWith("bg");
  return isBg
    ? {
        close: "Затвори търсенето по описание",
        error:
          "Не успях да разчета заявката. Проверете текста и опитайте отново.",
        heading: "Търсене по описание",
        loading: "Търсене…",
        openResults: "Покажи реалните обяви",
        placeholder: "Напр. семеен автоматик под 35 000 лв, след 2020",
        remove: "Премахни",
        retry: "Опитай отново",
        submit: "Намери автомобили",
        supporting: "Добавете бюджет, година, гориво или скоростна кутия.",
      }
    : {
        close: "Close description search",
        error: "I could not parse that request. Check the text and try again.",
        heading: "Search by description",
        loading: "Searching…",
        openResults: "Show live listings",
        placeholder: "e.g. family automatic under 35,000 BGN after 2020",
        remove: "Remove",
        retry: "Try again",
        submit: "Find vehicles",
        supporting: "Add a budget, year, fuel, or transmission.",
      };
};

const parseResponse = (value: unknown): AssistedSearchView | null => {
  if (
    typeof value !== "object" ||
    value === null ||
    !("requestId" in value) ||
    typeof value.requestId !== "string"
  ) {
    return null;
  }
  const { requestId, ...payload } = value;
  const parsed = assistedSearchResponseSchema.safeParse(payload);
  return parsed.success ? { ...parsed.data, requestId } : null;
};

export const AssistedSearchPanel = ({
  basePath,
  category,
  locale,
}: AssistedSearchPanelProps) => {
  const copy = getCopy(locale);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [pending, setPending] = useState(false);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AssistedSearchView | null>(null);

  const removeChip = (chipId: string) => {
    if (!result) {
      return;
    }
    const chip = result.chips.find((candidate) => candidate.id === chipId);
    if (!chip) {
      return;
    }
    const filters = { ...result.filters };
    for (const key of chip.keys) {
      delete filters[key];
    }
    const typedFilters = filters as Partial<MarketplaceSearchParams>;
    setResult({
      ...result,
      chips: result.chips.filter((candidate) => candidate.id !== chipId),
      filters,
      href: buildMarketplaceSearchHref(typedFilters, basePath),
    });
  };

  const runSearch = async () => {
    if (query.trim().length < 2) {
      return;
    }

    setError(false);
    setPending(true);
    try {
      const response = await fetch("/api/ai/search", {
        body: JSON.stringify({
          basePath,
          category,
          locale,
          query: query.trim(),
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
        signal: AbortSignal.timeout(7000),
      });
      const json: unknown = await response.json();
      const parsed = response.ok ? parseResponse(json) : null;
      if (!parsed) {
        throw new Error("invalid_assisted_search_response");
      }
      setResult(parsed);
    } catch {
      setError(true);
      setResult(null);
    } finally {
      setPending(false);
    }
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await runSearch();
  };

  if (!expanded) {
    return (
      <Button
        className="h-auto w-full justify-start gap-3 rounded-xl px-3 py-2.5 text-left font-normal"
        data-slot="assisted-search-trigger"
        onClick={() => setExpanded(true)}
        type="button"
        variant="ghost"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-control text-foreground/75">
          <SearchIcon aria-hidden="true" className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-sm">{copy.heading}</span>
          <span className="mt-0.5 block truncate text-meta text-muted-foreground">
            {copy.supporting}
          </span>
        </span>
        <ArrowRightIcon
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground"
        />
      </Button>
    );
  }

  return (
    <div
      aria-busy={pending}
      className="rounded-xl bg-control p-3"
      data-slot="assisted-search"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-card text-foreground shadow-sm">
          <SearchIcon aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-sm">{copy.heading}</h2>
          <p className="mt-0.5 text-muted-foreground text-xs">
            {copy.supporting}
          </p>
        </div>
        <Button
          aria-label={copy.close}
          className="size-9 shrink-0 rounded-lg"
          onClick={() => setExpanded(false)}
          size="icon"
          type="button"
          variant="ghost"
        >
          <XIcon aria-hidden="true" className="size-4" />
        </Button>
      </div>

      <form className="mt-3 flex gap-2" onSubmit={submit}>
        <label
          className="relative min-w-0 flex-1"
          htmlFor="assisted-search-query"
        >
          <span className="sr-only">{copy.heading}</span>
          <SearchIcon
            aria-hidden="true"
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-describedby={
              error ? "assisted-search-error" : "assisted-search-help"
            }
            className="h-10 rounded-lg bg-card pl-9"
            id="assisted-search-query"
            maxLength={500}
            minLength={2}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.placeholder}
            required
            type="search"
            value={query}
          />
        </label>
        <Button
          className="h-10 shrink-0 rounded-lg"
          disabled={pending || query.trim().length < 2}
          type="submit"
        >
          {pending ? (
            <>
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin"
              />
              {copy.loading}
            </>
          ) : (
            copy.submit
          )}
        </Button>
      </form>
      <p className="sr-only" id="assisted-search-help">
        {copy.supporting}
      </p>

      {error ? (
        <div
          aria-live="polite"
          className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-destructive/10 p-3 text-sm"
          id="assisted-search-error"
          role="alert"
        >
          <span>{copy.error}</span>
          <Button
            disabled={pending}
            onClick={() => {
              runSearch();
            }}
            size="sm"
            variant="ghost"
          >
            {copy.retry}
          </Button>
        </div>
      ) : null}

      {result ? (
        <div aria-live="polite" className="mt-3 grid gap-3">
          {result.chips.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {result.chips.map((chip) => (
                <Button
                  aria-label={`${copy.remove}: ${chip.label}`}
                  className="h-8 gap-1.5 rounded-full px-3 text-xs"
                  key={chip.id}
                  onClick={() => removeChip(chip.id)}
                  type="button"
                  variant="secondary"
                >
                  {chip.label}
                  <XIcon aria-hidden="true" className="size-3" />
                </Button>
              ))}
            </div>
          ) : null}
          {result.ambiguities.length > 0 ? (
            <ul className="grid gap-1 rounded-lg bg-card p-3 text-muted-foreground text-xs">
              {result.ambiguities.map((ambiguity) => (
                <li key={ambiguity}>{ambiguity}</li>
              ))}
            </ul>
          ) : null}
          {result.chips.length > 0 ? (
            <Button asChild className="w-fit gap-2 rounded-lg">
              <Link href={result.href}>
                {copy.openResults}
                <ArrowRightIcon aria-hidden="true" className="size-4" />
              </Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
