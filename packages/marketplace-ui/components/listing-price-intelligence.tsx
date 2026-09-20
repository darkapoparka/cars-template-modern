import { Badge } from "@repo/design-system/components/ui/badge";
import { getPublicMessages } from "@repo/internationalization/public-messages";
import {
  formatMoney,
  formatPriceType,
  type Money,
  type PriceType,
} from "@repo/marketplace";
import { BarChart3 } from "lucide-react";

interface AvailablePriceIntelligence {
  readonly assessedAt: string;
  readonly comparableCount: number;
  readonly confidence: "high" | "low" | "medium";
  readonly dealRating: "fair" | "good" | "great" | "high";
  readonly marketHigh: Money;
  readonly marketLow: Money;
  readonly methodLabel: string;
  readonly state: "available";
}

interface UnavailablePriceIntelligence {
  readonly reason: string;
  readonly state: "unavailable";
}

export type PriceIntelligenceEvidence =
  | AvailablePriceIntelligence
  | UnavailablePriceIntelligence;

interface ListingPriceIntelligenceProps {
  readonly evidence: PriceIntelligenceEvidence;
  readonly locale?: string;
  readonly monthlyEstimate?: Money;
  readonly price: Money;
  readonly priceType: PriceType;
}

export const ListingPriceIntelligence = ({
  evidence,
  locale,
  monthlyEstimate,
  price,
  priceType,
}: ListingPriceIntelligenceProps) => {
  const t = getPublicMessages(locale);
  return (
    <section aria-labelledby="price-intelligence-heading">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-micro text-muted-foreground uppercase tracking-label">
            {t.priceContext}
          </p>
          <h2
            className="mt-1 font-semibold text-card-title-lg tracking-heading"
            id="price-intelligence-heading"
          >
            {t.priceIntelligence}
          </h2>
        </div>
        <BarChart3
          aria-hidden="true"
          className="size-5 text-muted-foreground"
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-muted p-3">
          <p className="text-meta text-muted-foreground">{t.advertisedPrice}</p>
          <p className="mt-1 font-semibold text-card-title-lg tracking-heading">
            {formatMoney(price, locale)}
          </p>
          <p className="mt-1 text-meta text-muted-foreground">
            {formatPriceType(priceType, locale)}
          </p>
        </div>
        <div className="rounded-lg bg-muted p-3">
          <p className="text-meta text-muted-foreground">{t.monthlyFigure}</p>
          <p className="mt-1 font-semibold text-card-title-lg tracking-heading">
            {monthlyEstimate
              ? formatMoney(monthlyEstimate, locale)
              : t.notProvided}
          </p>
          <p className="mt-1 text-meta text-muted-foreground">
            {monthlyEstimate ? t.sellerFigure : t.noEstimate}
          </p>
        </div>
      </div>

      {evidence.state === "available" ? (
        <div className="mt-3 rounded-lg border border-border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium text-compact-control">
              {t.marketRange} {formatMoney(evidence.marketLow, locale)}–
              {formatMoney(evidence.marketHigh, locale)}
            </p>
            <Badge className="capitalize" variant="outline">
              {t[evidence.dealRating]} {t.price}
            </Badge>
          </div>
          <p className="mt-2 text-meta text-muted-foreground">
            {t.basedOn} {evidence.comparableCount} {t.comparableVehicles} ·{" "}
            {t[evidence.confidence]} {t.confidence} · {evidence.methodLabel} ·{" "}
            {t.assessed} {evidence.assessedAt}
          </p>
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-border p-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{t.notAvailable}</Badge>
            <p className="font-medium text-compact-control">{t.noComparison}</p>
          </div>
          <p className="mt-2 text-meta text-muted-foreground">
            {evidence.reason}
          </p>
        </div>
      )}
    </section>
  );
};
