const loadingCards = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
] as const;

const loadingFilters = [
  "body",
  "make",
  "mileage",
  "fuel",
  "location",
  "more",
] as const;

interface PublicRouteLoadingProps {
  mobileTone?: "leasing";
  variant?: "discovery" | "results";
}

const LoadingCardContent = () => (
  <div className="flex flex-1 flex-col gap-2 p-3.5">
    <div className="h-5 w-2/5 rounded bg-secondary" />
    <div className="h-4 w-4/5 rounded bg-secondary" />
    <div className="mt-1 grid grid-cols-2 gap-2 lg:flex">
      <div className="h-3 w-full rounded bg-secondary" />
      <div className="h-3 w-full rounded bg-secondary" />
    </div>
    <div className="mt-auto h-6 w-3/5 rounded-full bg-secondary" />
  </div>
);

const MobileLoadingHeader = ({ mobileTone }: { mobileTone?: "leasing" }) => (
  <div className="lg:hidden">
    {mobileTone ? (
      <MobileDealerServiceHero
        helpAction={<div className="size-11" />}
        imageSrc=""
        locale="bg"
        tone={mobileTone}
      >
        <div className="h-[52px] rounded-full bg-white" />
      </MobileDealerServiceHero>
    ) : (
      <div className="bg-zinc-950">
        <MobileDealerChrome
          brandRow={
            <div className="grid h-11 grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-3">
              <div className="size-11" />
              <DealerMobileBrandBar isBg tone="clean" />
              <div className="size-11" />
            </div>
          }
        >
          <div className="h-[52px] rounded-full bg-white" />
        </MobileDealerChrome>
      </div>
    )}
    <div
      className={`${mobileDealerContentClassName} pb-3`}
      data-slot="mobile-dealer-content"
    >
      <div className="flex gap-2 overflow-hidden">
        {loadingFilters.slice(0, 5).map((filter) => (
          <div
            className="h-11 w-24 shrink-0 rounded-full bg-zinc-200"
            key={filter}
          />
        ))}
      </div>
    </div>
  </div>
);

const DesktopLoadingHeader = ({
  variant,
}: {
  variant: "discovery" | "results";
}) => {
  const isResults = variant === "results";

  return (
    <div className="hidden lg:block">
      <div className="border-border border-b bg-card">
        <div className="mx-auto grid h-24 max-w-[96rem] grid-cols-[1fr_auto_1fr] items-center gap-5 px-6 xl:px-10">
          <div className="flex items-center gap-2.5 font-semibold text-xl tracking-tight">
            <LeadSiteMark />
            {leadSite.name}
          </div>
          <div className="flex items-center gap-4">
            {loadingCards.slice(0, 3).map((item) => (
              <div
                className="h-20 w-28 animate-pulse rounded-lg bg-secondary motion-reduce:animate-none"
                key={item}
              />
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="h-10 w-24 animate-pulse rounded-full bg-secondary motion-reduce:animate-none" />
            <div className="size-10 animate-pulse rounded-full bg-secondary motion-reduce:animate-none" />
            <div className="size-10 animate-pulse rounded-full bg-secondary motion-reduce:animate-none" />
          </div>
        </div>
      </div>

      <div className="border-border border-b bg-card">
        <div
          className={isResults ? "px-5 py-3 xl:px-8" : "px-5 pt-3 pb-8 xl:px-8"}
        >
          <div
            className={`mx-auto max-w-[82rem] animate-pulse rounded-2xl bg-secondary motion-reduce:animate-none ${
              isResults ? "h-16" : "h-24"
            }`}
          />
          <div
            className={`mx-auto flex max-w-[82rem] gap-2 overflow-hidden ${
              isResults ? "mt-3" : "mt-8"
            }`}
          >
            {loadingFilters.map((filter) => (
              <div
                className="h-10 w-32 shrink-0 animate-pulse rounded-full bg-secondary motion-reduce:animate-none"
                key={filter}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const DesktopDiscoveryCards = () => (
  <div className="hidden grid-cols-3 gap-5 lg:grid xl:grid-cols-4 2xl:grid-cols-5">
    {loadingCards.map((card) => (
      <div
        className="flex overflow-hidden rounded-lg border border-border bg-card"
        key={card}
      >
        <div className="flex w-full flex-col">
          <div className="aspect-[4/3] bg-secondary" />
          <LoadingCardContent />
        </div>
      </div>
    ))}
  </div>
);

const DesktopResultRows = () => (
  <div className="hidden space-y-5 lg:block">
    {loadingCards.slice(0, 4).map((card) => (
      <div
        className="grid min-h-40 grid-cols-[13rem_minmax(0,1fr)] overflow-hidden rounded-lg border border-border bg-card xl:grid-cols-[15rem_minmax(0,1fr)]"
        key={card}
      >
        <div className="aspect-[3/2] bg-secondary" />
        <LoadingCardContent />
      </div>
    ))}
  </div>
);

export const PublicRouteLoading = ({
  variant = "discovery",
  mobileTone,
}: PublicRouteLoadingProps) => (
  <div aria-busy="true" className="min-h-screen bg-background text-foreground">
    <MobileLoadingHeader mobileTone={mobileTone} />
    <DesktopLoadingHeader variant={variant} />

    <div
      className="mx-auto max-w-[96rem] px-4 pb-3 lg:px-6 lg:pt-3 xl:px-10"
      data-slot="public-route-loading-content"
    >
      <output className="sr-only">Loading {leadSite.name}</output>
      <div className="mb-3 hidden h-10 animate-pulse items-center justify-between motion-reduce:animate-none lg:flex">
        <div className="h-4 w-32 rounded bg-secondary" />
        <div className="h-8 w-24 rounded-lg bg-secondary" />
      </div>

      <div className="animate-pulse space-y-2 motion-reduce:animate-none lg:hidden">
        {loadingCards.slice(0, 2).map((card) => (
          <div className="flex overflow-hidden rounded-xl bg-card" key={card}>
            <div className="h-[7.5rem] w-[7.5rem] shrink-0 bg-secondary" />
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 px-3 py-2.5">
              <div className="space-y-1">
                <div className="h-5 w-3/5 rounded bg-secondary" />
                <div className="h-3 w-4/5 rounded bg-secondary" />
                <div className="h-3 w-2/5 rounded bg-secondary" />
              </div>
              <div className="space-y-1">
                <div className="h-5 w-2/5 rounded bg-secondary" />
                <div className="h-3 w-1/3 rounded bg-secondary" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {variant === "results" ? (
        <DesktopResultRows />
      ) : (
        <DesktopDiscoveryCards />
      )}
    </div>
  </div>
);

const ListingDetailLoadingHeader = () => (
  <header className="hidden bg-card lg:block">
    <div className="mx-auto grid h-24 max-w-[96rem] grid-cols-[1fr_auto_1fr] items-center gap-5 px-6 xl:px-10">
      <div className="flex items-center gap-2.5">
        <LeadSiteMark />
        <span className="font-semibold text-xl tracking-tight">
          {leadSite.name}
        </span>
      </div>
      <div className="flex animate-pulse items-center gap-4 motion-reduce:animate-none">
        {loadingCards.slice(0, 3).map((item) => (
          <div className="h-20 w-28 rounded-lg bg-secondary" key={item} />
        ))}
      </div>
      <div className="ml-auto flex animate-pulse items-center gap-2 motion-reduce:animate-none">
        <div className="h-10 w-28 rounded-xl bg-secondary" />
        <div className="size-10 rounded-full bg-secondary" />
        <div className="size-10 rounded-full bg-secondary" />
      </div>
    </div>
  </header>
);

export const ListingDetailLoading = () => (
  <div
    aria-busy="true"
    className="min-h-screen bg-background pb-[calc(6rem+env(safe-area-inset-bottom))] text-foreground lg:pb-10"
  >
    <output className="sr-only">Loading vehicle listing</output>
    <ListingDetailLoadingHeader />
    <div
      className="mx-auto max-w-[86rem] lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6 lg:px-6 lg:py-4 xl:gap-8"
      data-slot="listing-detail-loading-content"
    >
      <div className="min-w-0">
        <div className="relative h-[min(75vw,360px)] animate-pulse bg-secondary motion-reduce:animate-none lg:aspect-[16/9] lg:h-auto lg:rounded-lg">
          <div className="absolute inset-x-4 top-4 flex justify-between lg:hidden">
            <div className="size-10 rounded-full bg-card/80" />
            <div className="flex gap-2">
              <div className="size-10 rounded-full bg-card/80" />
              <div className="size-10 rounded-full bg-card/80" />
            </div>
          </div>
        </div>
        <div className="animate-pulse space-y-6 px-4 py-5 motion-reduce:animate-none lg:px-0 lg:py-6">
          <div className="space-y-3 lg:hidden">
            <div className="h-7 w-2/5 rounded bg-secondary" />
            <div className="h-6 w-4/5 rounded bg-secondary" />
            <div className="h-4 w-1/2 rounded bg-secondary" />
          </div>
          <section className="space-y-4">
            <div className="h-5 w-44 rounded bg-secondary" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
              {loadingFilters.map((filter) => (
                <div className="space-y-2" key={filter}>
                  <div className="h-3 w-16 rounded bg-secondary" />
                  <div className="h-4 w-24 max-w-full rounded bg-secondary" />
                </div>
              ))}
            </div>
          </section>
          <section className="space-y-3 border-border lg:border-t lg:pt-8">
            <div className="h-5 w-28 rounded bg-secondary" />
            <div className="h-4 w-full max-w-3xl rounded bg-secondary" />
            <div className="h-4 w-5/6 max-w-3xl rounded bg-secondary" />
            <div className="h-4 w-3/5 max-w-3xl rounded bg-secondary" />
          </section>
        </div>
      </div>
      <aside className="hidden lg:block">
        <div className="sticky top-20 animate-pulse space-y-4 rounded-xl bg-card p-5 shadow-panel motion-reduce:animate-none">
          <div className="h-7 w-2/3 rounded bg-secondary" />
          <div className="h-5 w-full rounded bg-secondary" />
          <div className="h-4 w-1/2 rounded bg-secondary" />
          <div className="h-11 w-full rounded-lg bg-secondary" />
          <div className="border-border border-t pt-5">
            <div className="h-3 w-20 rounded bg-secondary" />
            <div className="mt-2 h-5 w-3/4 rounded bg-secondary" />
            <div className="mt-2 h-4 w-1/2 rounded bg-secondary" />
          </div>
        </div>
      </aside>
    </div>
  </div>
);

import { leadSite } from "@repo/marketplace";
import {
  DealerMobileBrandBar,
  LeadSiteMark,
  MobileDealerChrome,
  mobileDealerContentClassName,
} from "@repo/marketplace-ui";
import { MobileDealerServiceHero } from "./mobile-dealer-service-hero";
