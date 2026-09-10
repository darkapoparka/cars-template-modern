import { Badge } from "@repo/design-system/components/ui/badge";
import { leadSite } from "@repo/marketplace";
import { CircleHelp, FileCheck2, ShieldCheck } from "lucide-react";

type EvidenceKind =
  | "damage"
  | "history"
  | "inspection"
  | "odometer"
  | "service"
  | "vin"
  | "warranty";

interface EvidenceBase {
  readonly id: string;
  readonly kind: EvidenceKind;
  readonly label: string;
}

interface VerifiedEvidence extends EvidenceBase {
  readonly policyLabel: string;
  readonly reviewedAt: string;
  readonly sourceLabel: string;
  readonly state: "verified";
  readonly summary: string;
}

interface SellerDeclaredEvidence extends EvidenceBase {
  readonly state: "seller_declared";
  readonly summary: string;
}

interface UnavailableEvidence extends EvidenceBase {
  readonly reason: string;
  readonly state: "unavailable";
}

export type ListingTrustEvidence =
  | SellerDeclaredEvidence
  | UnavailableEvidence
  | VerifiedEvidence;

interface ListingTrustPanelProps {
  readonly evidence: readonly ListingTrustEvidence[];
}

const formatReviewDate = (value: string) =>
  new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const getEvidenceStateLabel = (evidence: ListingTrustEvidence): string => {
  if (evidence.state === "verified") {
    return "Checked";
  }

  if (evidence.state === "seller_declared") {
    return "Seller statement";
  }

  return "Not available";
};

export const ListingTrustPanel = ({ evidence }: ListingTrustPanelProps) => (
  <section aria-labelledby="trust-heading">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Evidence, not badges
        </p>
        <h2 className="mt-1 font-semibold text-lg" id="trust-heading">
          Vehicle history and trust
        </h2>
      </div>
      <ShieldCheck
        aria-hidden="true"
        className="size-5 text-muted-foreground"
      />
    </div>
    <p className="mt-2 max-w-2xl text-muted-foreground text-sm leading-6">
      {leadSite.name} only presents a checked claim when its source, review
      date, and policy are available. Seller statements are labelled separately.
    </p>
    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
      {evidence.map((item) => (
        <li className="rounded-lg bg-muted p-3" key={item.id}>
          <div className="flex items-start gap-3">
            {item.state === "verified" ? (
              <FileCheck2
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
              />
            ) : (
              <CircleHelp
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              />
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-sm">{item.label}</p>
                <Badge className="rounded-md" variant="outline">
                  {getEvidenceStateLabel(item)}
                </Badge>
              </div>
              <p className="mt-1 text-muted-foreground text-xs leading-5">
                {item.state === "unavailable" ? item.reason : item.summary}
              </p>
              {item.state === "verified" && (
                <p className="mt-2 text-muted-foreground text-xs">
                  {item.sourceLabel} · reviewed{" "}
                  {formatReviewDate(item.reviewedAt)}
                  {" · "}
                  {item.policyLabel}
                </p>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  </section>
);
