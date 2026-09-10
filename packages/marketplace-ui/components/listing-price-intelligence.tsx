import { Badge } from "@repo/design-system/components/ui/badge";
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
  readonly monthlyEstimate?: Money;
  readonly price: Money;
  readonly priceType: PriceType;
}

export const ListingPriceIntelligence = ({
  evidence,
  monthlyEstimate,
  price,
  priceType,
}: ListingPriceIntelligenceProps) => (
  <section aria-labelledby="price-intelligence-heading">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Price context
        </p>
        <h2
          className="mt-1 font-semibold text-lg"
          id="price-intelligence-heading"
        >
          Price intelligence
        </h2>
      </div>
      <BarChart3 aria-hidden="true" className="size-5 text-muted-foreground" />
    </div>

    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg bg-muted p-3">
        <p className="text-muted-foreground text-xs">Advertised price</p>
        <p className="mt-1 font-semibold text-lg">{formatMoney(price)}</p>
        <p className="mt-1 text-muted-foreground text-xs">
          {formatPriceType(priceType)}
        </p>
      </div>
      <div className="rounded-lg bg-muted p-3">
        <p className="text-muted-foreground text-xs">Monthly figure</p>
        <p className="mt-1 font-semibold text-lg">
          {monthlyEstimate ? formatMoney(monthlyEstimate) : "Not provided"}
        </p>
        <p className="mt-1 text-muted-foreground text-xs">
          {monthlyEstimate
            ? "Seller-supplied figure; terms and assumptions are not available."
            : "No finance or lease estimate is attached to this listing."}
        </p>
      </div>
    </div>

    {evidence.state === "available" ? (
      <div className="mt-3 rounded-lg border border-border p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-medium text-sm">
            Market range {formatMoney(evidence.marketLow)}–
            {formatMoney(evidence.marketHigh)}
          </p>
          <Badge className="capitalize" variant="outline">
            {evidence.dealRating} price
          </Badge>
        </div>
        <p className="mt-2 text-muted-foreground text-xs leading-5">
          Based on {evidence.comparableCount} comparable vehicles ·{" "}
          {evidence.confidence} confidence · {evidence.methodLabel} · assessed{" "}
          {evidence.assessedAt}
        </p>
      </div>
    ) : (
      <div className="mt-3 rounded-lg border border-border p-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Not available</Badge>
          <p className="font-medium text-sm">No market comparison</p>
        </div>
        <p className="mt-2 text-muted-foreground text-xs leading-5">
          {evidence.reason}
        </p>
      </div>
    )}
  </section>
);
