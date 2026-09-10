import type { ImporterWorkspaceOverview } from "@repo/database/inventory-health";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  BadgeCheckIcon,
  Building2Icon,
  CircleGaugeIcon,
  Clock3Icon,
  GitCompareArrowsIcon,
  Globe2Icon,
  KeyRoundIcon,
  type LucideIcon,
  PlugZapIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
} from "lucide-react";
import Link from "next/link";
import {
  getImporterAuthorizationView,
  getInventorySourceHealthSummary,
  type ImporterAuthorizationGateKey,
  type ImporterStatusView,
} from "../importer-view-state";

export type ImporterWorkspaceView = "inventory" | "runs" | "sources";

interface ImporterWorkspaceChromeProps {
  readonly activeView: ImporterWorkspaceView;
  readonly heading: string;
  readonly now: Date;
  readonly overview: ImporterWorkspaceOverview;
}

const workspaceTabs: readonly {
  href: string;
  label: string;
  view: ImporterWorkspaceView;
}[] = [
  { href: "/dealer/inventory", label: "Инвентар", view: "inventory" },
  {
    href: "/dealer/inventory/sources",
    label: "Източници",
    view: "sources",
  },
  {
    href: "/dealer/inventory/runs",
    label: "Импортирания",
    view: "runs",
  },
];

const authorizationIcons: Record<ImporterAuthorizationGateKey, LucideIcon> = {
  capabilities: KeyRoundIcon,
  kyb: ShieldCheckIcon,
  markets: Globe2Icon,
  registration: Building2Icon,
  trust: BadgeCheckIcon,
};

const healthDimensions: readonly {
  icon: LucideIcon;
  key: "connection" | "freshness" | "latestRun" | "quality" | "reconciliation";
  label: string;
}[] = [
  { icon: PlugZapIcon, key: "connection", label: "Връзка" },
  { icon: RefreshCwIcon, key: "latestRun", label: "Последно изпълнение" },
  { icon: Clock3Icon, key: "freshness", label: "Актуалност" },
  { icon: TriangleAlertIcon, key: "quality", label: "Качество / проблеми" },
  {
    icon: GitCompareArrowsIcon,
    key: "reconciliation",
    label: "Съгласуване",
  },
];

const HealthDimension = ({
  icon: Icon,
  label,
  status,
}: {
  readonly icon: LucideIcon;
  readonly label: string;
  readonly status: ImporterStatusView;
}) => (
  <div className="flex min-h-20 min-w-0 flex-col justify-center bg-card p-3 md:last:col-span-1 last:min-[360px]:col-span-2">
    <dt className="flex items-start gap-2 text-[11px] text-muted-foreground leading-3">
      <Icon className="mt-px size-3.5 shrink-0" />
      {label}
    </dt>
    <dd className="mt-1 min-w-0">
      <Badge
        className="max-w-full whitespace-normal text-left leading-4"
        variant={status.tone}
      >
        {status.label}
      </Badge>
      <p className="mt-1 break-words text-[10px] text-muted-foreground leading-3">
        {status.detail}
      </p>
    </dd>
  </div>
);

export const ImporterWorkspaceChrome = ({
  activeView,
  heading,
  now,
  overview,
}: ImporterWorkspaceChromeProps) => {
  const authorization = getImporterAuthorizationView(overview, now);
  const sourceHealth = getInventorySourceHealthSummary(overview.sources);

  return (
    <section
      aria-labelledby="importer-workspace-heading"
      className="overflow-hidden rounded-lg border bg-card"
    >
      <h1 className="sr-only" id="importer-workspace-heading">
        {heading}
      </h1>
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
            Достъп за доставка
          </p>
          <h2
            className="mt-1 font-semibold text-base"
            id="organization-access-heading"
          >
            {overview.organization.displayName}
          </h2>
          <p className="mt-1 max-w-3xl text-muted-foreground text-sm">
            {authorization.readiness.detail}
          </p>
        </div>
        <Badge className="mt-0.5" variant={authorization.readiness.tone}>
          <CircleGaugeIcon />
          {authorization.readiness.label}
        </Badge>
      </div>

      <section
        aria-label="Условия за достъп на организацията"
        className="border-t"
      >
        <dl className="grid grid-cols-1 gap-px bg-border p-px md:grid-cols-3 xl:grid-cols-5 min-[360px]:grid-cols-2">
          {authorization.gates.map((gate) => {
            const Icon = authorizationIcons[gate.key];

            return (
              <div
                className="flex min-h-24 min-w-0 flex-col justify-center bg-card p-3 md:last:col-span-1 last:min-[360px]:col-span-2"
                key={gate.key}
              >
                <dt className="flex items-start gap-1.5 text-muted-foreground text-xs">
                  <Icon className="mt-px size-3.5 shrink-0" />
                  {gate.name}
                </dt>
                <dd className="mt-1.5 min-w-0">
                  <Badge
                    className="max-w-full whitespace-normal text-left leading-4"
                    variant={gate.tone}
                  >
                    {gate.label}
                  </Badge>
                  <p className="mt-1 break-words text-muted-foreground text-xs leading-4">
                    {gate.detail}
                  </p>
                </dd>
              </div>
            );
          })}
        </dl>
      </section>

      <nav
        aria-label="Раздели на работното пространство за инвентар"
        className="flex w-full gap-1 overflow-x-auto border-t bg-control p-1.5"
      >
        {workspaceTabs.map((tab) => {
          const active = tab.view === activeView;

          return (
            <Button
              asChild
              className="min-w-fit flex-1 px-4"
              key={tab.view}
              size="lg"
              variant={active ? "default" : "ghost"}
            >
              <Link aria-current={active ? "page" : undefined} href={tab.href}>
                {tab.label}
              </Link>
            </Button>
          );
        })}
      </nav>

      <div className="border-t">
        <h2 className="sr-only" id="source-health-heading">
          Обобщение на състоянието на източниците
        </h2>
        <section aria-labelledby="source-health-heading">
          <dl className="grid grid-cols-1 gap-px bg-border p-px md:grid-cols-3 xl:grid-cols-5 min-[360px]:grid-cols-2">
            {healthDimensions.map((dimension) => (
              <HealthDimension
                icon={dimension.icon}
                key={dimension.key}
                label={dimension.label}
                status={sourceHealth[dimension.key]}
              />
            ))}
          </dl>
        </section>
      </div>
    </section>
  );
};
