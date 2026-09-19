import { cn } from "@repo/design-system/lib/utils";
import { leadSite } from "@repo/marketplace";
import { marketplaceDiscoveryFrameClassName } from "@repo/marketplace-ui";
import { getLocalizedPath } from "@repo/seo/metadata";
import { ChevronRight, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  type SellVehicleDraft,
  sellCategoryLabels,
  serializeSellVehicleDraft,
} from "@/lib/sell-vehicle-draft";
import { PublicEnquiryForm } from "../components/public-enquiry-form";
import { PublicMarketplaceFrame } from "../components/public-marketplace-frame";
import { pageCopy } from "./copy";

const sellCategoryAssets = leadSite.sellCategoryAssets;

const getSellCategoryLabel = (locale: "bg" | "en", category: string) =>
  sellCategoryLabels[locale][
    category as keyof (typeof sellCategoryLabels)["bg"]
  ] ?? category;

export function SellContactHandoff({
  locale,
  draft,
  submissionAvailable,
}: {
  locale: "bg" | "en";
  draft: SellVehicleDraft;
  submissionAvailable: boolean;
}) {
  const copy = pageCopy[locale];
  const localize = (route: string) => getLocalizedPath(locale, route);
  const sellVehicleName = [draft.make, draft.model].filter(Boolean).join(" ");
  const selectedVehicleAsset =
    sellCategoryAssets[draft.category as keyof typeof sellCategoryAssets] ??
    sellCategoryAssets.car;
  const sellEditHref = `${localize("/sell")}?${serializeSellVehicleDraft(draft)}`;
  return (
    <PublicMarketplaceFrame activeMode="sell" locale={locale}>
      <main className="lg:min-h-[38rem]">
        <div
          className={cn(
            marketplaceDiscoveryFrameClassName,
            "py-5 sm:py-7 lg:py-9"
          )}
        >
          <section
            className="relative isolate overflow-hidden rounded-2xl bg-card lg:min-h-[26rem] lg:rounded-xl lg:border lg:border-border lg:shadow-panel"
            data-slot="sell-contact-handoff"
          >
            <Image
              alt=""
              className="hidden object-cover object-center lg:block"
              fill
              priority
              sizes="(min-width: 1792px) calc(100vw - 96px), (min-width: 1440px) 1360px, calc(100vw - 48px)"
              src="/images/sell/day-night-sell-centered-hero-v2.webp"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 hidden bg-black/10 lg:block"
            />

            <div className="relative z-10 flex items-center justify-center lg:min-h-[26rem] lg:p-6">
              <div className="w-full max-w-2xl rounded-2xl bg-card p-5 sm:p-6 lg:rounded-xl lg:border lg:border-border/80 lg:p-7 lg:shadow-2xl lg:shadow-black/20">
                <h1 className="text-balance text-center font-semibold text-page-title tracking-tight sm:text-page-title-lg">
                  {copy.sellHandoffTitle}
                </h1>
                <p className="mx-auto mt-2 max-w-lg text-center text-body text-muted-foreground">
                  {copy.sellHandoffDescription}
                </p>

                <div className="mt-6 grid gap-1.5">
                  <span className="text-meta text-muted-foreground">
                    {copy.sellVehicleLabel}
                  </span>
                  <Link
                    aria-label={copy.sellHandoffEditAction}
                    className="group grid min-h-20 w-full grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-3 overflow-hidden rounded-lg border border-border/60 bg-card p-2 text-left outline-none transition-colors hover:bg-control-hover focus-visible:ring-[3px] focus-visible:ring-ring/40 sm:grid-cols-[5.25rem_minmax(0,1fr)_auto] sm:gap-3"
                    data-slot="sell-selected-vehicle"
                    href={sellEditHref}
                  >
                    <span className="relative h-14 overflow-hidden rounded-md sm:h-16">
                      <Image
                        alt=""
                        aria-hidden="true"
                        className="object-contain"
                        fill
                        sizes="80px"
                        src={selectedVehicleAsset}
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block break-words font-semibold text-body">
                        {sellVehicleName ||
                          (draft.vin
                            ? `VIN ${draft.vin}`
                            : copy.sellVehicleLabel)}
                      </span>
                      <span className="mt-1 block text-meta text-muted-foreground">
                        {getSellCategoryLabel(locale, draft.category)}
                        {draft.year ? ` · ${draft.year}` : ""}
                        {draft.mileage
                          ? ` · ${new Intl.NumberFormat(locale).format(Number(draft.mileage))} ${locale === "bg" ? "км" : "km"}`
                          : ""}
                      </span>
                    </span>
                    <span className="flex items-center gap-1 pr-1 font-semibold text-meta">
                      <span className="hidden sm:inline">
                        {copy.sellHandoffEditAction}
                      </span>
                      <ChevronRight
                        aria-hidden="true"
                        className="size-4 transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                  </Link>
                </div>

                {draft.vin && sellVehicleName ? (
                  <p
                    className="mt-3 break-all text-muted-foreground text-sm"
                    data-slot="sell-vin-summary"
                  >
                    VIN {draft.vin}
                  </p>
                ) : null}
                {draft.notes ? (
                  <div className="mt-5 border-border border-t pt-4">
                    <p className="text-meta text-muted-foreground">
                      {copy.sellDetailsLabel}
                    </p>
                    <p className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap break-words text-sm leading-6">
                      {draft.notes}
                    </p>
                  </div>
                ) : null}

                {submissionAvailable && (
                  <div className="mt-6">
                    <PublicEnquiryForm
                      initialMessage={[
                        locale === "bg"
                          ? "Запитване за изкупуване или бартер на автомобил."
                          : "Vehicle sale or trade-in enquiry.",
                        sellVehicleName,
                        draft.vin ? `VIN: ${draft.vin}` : "",
                        draft.year,
                        draft.mileage ? `${draft.mileage} km` : "",
                        draft.notes,
                      ]
                        .filter(Boolean)
                        .join("\n")}
                      intent="trade_in"
                      locale={locale}
                    />
                  </div>
                )}
                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <a
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand px-5 font-semibold text-brand-foreground text-sm transition-colors hover:bg-[var(--lead-site-accent-hover)] hover:text-[var(--brand-hover-foreground)] focus-visible:outline-2 focus-visible:outline-[var(--lead-site-accent)] focus-visible:outline-offset-3"
                    href={leadSite.phoneHref}
                  >
                    <Phone aria-hidden="true" className="size-4" />
                    {copy.sellHandoffAction}
                  </a>
                </div>

                <a
                  className="mx-auto mt-5 block w-fit text-center text-muted-foreground text-sm underline-offset-4 hover:text-foreground hover:underline"
                  href={leadSite.mapsUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {copy.sellLocationLabel} · {leadSite.address}
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>
    </PublicMarketplaceFrame>
  );
}
