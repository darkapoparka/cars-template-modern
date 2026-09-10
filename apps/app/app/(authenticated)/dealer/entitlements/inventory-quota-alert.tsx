import type { ActiveListingQuotaView } from "@repo/database/commerce";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@repo/design-system/components/ui/alert";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  getQuotaRecoveryCopy,
  type ListingQuotaDecisionCode,
} from "@repo/marketplace/commerce";
import { GaugeIcon } from "lucide-react";
import Link from "next/link";

interface InventoryQuotaAlertProps {
  readonly requestedCode?: string;
  readonly view: ActiveListingQuotaView;
}

const quotaDecisionCodes = new Set<ListingQuotaDecisionCode>([
  "allowed",
  "already_active",
  "entitlement_expired",
  "entitlement_grace",
  "entitlement_suspended",
  "plan_unavailable",
  "quota_reached",
]);

const getRequestedRecovery = (requestedCode?: string): string | null =>
  requestedCode &&
  quotaDecisionCodes.has(requestedCode as ListingQuotaDecisionCode)
    ? getQuotaRecoveryCopy(requestedCode as ListingQuotaDecisionCode, "bg")
    : null;

export const InventoryQuotaAlert = ({
  requestedCode,
  view,
}: InventoryQuotaAlertProps) => {
  const recovery =
    getRequestedRecovery(requestedCode) ??
    getQuotaRecoveryCopy(view.decision.code, "bg");
  const planLabel = view.entitlement.plan?.label.bg ?? "Непотвърден план";
  const blocked = !view.decision.allowed || Boolean(recovery);

  return (
    <Alert aria-label="Лимит за активни обяви">
      <GaugeIcon />
      <AlertTitle className="flex flex-wrap items-center gap-2">
        <span>Инвентар: {view.decision.usage} активни</span>
        <Badge variant={blocked ? "warning" : "secondary"}>
          лимит {view.decision.limit}
        </Badge>
        <Badge variant="outline">{planLabel}</Badge>
      </AlertTitle>
      <AlertDescription>
        <p>
          {recovery ??
            `Остават ${view.decision.remaining} места. Черновите и обявите на пауза не използват квотата.`}
        </p>
        {view.decision.overage > 0 ? (
          <p className="mt-1">
            Текущото превишение е {view.decision.overage}. Няма автоматично
            изтриване; паузирайте обяви, за да освободите капацитет.
          </p>
        ) : null}
        {blocked ? (
          <Button asChild className="mt-3" size="sm" variant="secondary">
            <Link href="/dealer/billing">Преглед на плановете</Link>
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
};
