import {
  type FinancingRequest,
  financingRequestCopy,
  getFinancingDepositLabel,
  getFinancingTermLabel,
} from "./mobile-financing-policy";
import { PublicContactUnavailable } from "./public-contact-unavailable";

/** A phone handoff needs a useful summary, not an empty enquiry form. */
export function FinancingCallSummary({
  locale,
  request,
}: {
  readonly locale: "bg" | "en";
  readonly request: FinancingRequest;
}) {
  const copy = financingRequestCopy[locale];
  return (
    <div className="min-h-0 space-y-5 overflow-y-auto px-4 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="space-y-4 rounded-xl bg-secondary p-4">
        <div>
          <p className="text-meta text-muted-foreground">{copy.vehicle}</p>
          <p className="mt-1 font-semibold text-card-title">
            {request.vehicle}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-4 text-meta">
          <div>
            <dt className="text-muted-foreground">{copy.term}</dt>
            <dd className="mt-1 font-medium">
              {getFinancingTermLabel(request.term, locale)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{copy.deposit}</dt>
            <dd className="mt-1 font-medium">
              {getFinancingDepositLabel(request.deposit ?? "flexible", locale)}
            </dd>
          </div>
        </dl>
      </div>
      <p className="text-compact-control text-muted-foreground leading-6">
        {copy.callDescription}
      </p>
      <PublicContactUnavailable locale={locale} />
    </div>
  );
}
