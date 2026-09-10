import {
  database,
  type ListingStatus,
  type ModerationReason,
  type ModerationSeverity,
  type ModerationStatus,
  type Prisma,
} from "@repo/database";
import {
  getCurrentPublicMarketplaceListingWhere,
  getCurrentTrustedSupplierOrgIds,
} from "@repo/database/marketplace";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@repo/design-system/components/ui/alert";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { getListingHref } from "@repo/marketplace";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
  ExternalLinkIcon,
  EyeOffIcon,
  InboxIcon,
  ShieldAlertIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "../../components/header";
import { getPublicWebBaseUrl } from "../../marketplace-url";
import { requireModerationAdminAuthorization } from "./authorization";
import { canLinkPublicModerationListing } from "./moderation-listing-visibility";
import {
  getCanonicalModerationPage,
  getModerationSeveritySlices,
} from "./moderation-pagination";
import { ModerationTransitionControls } from "./moderation-transition-controls";
import { getModerationResolutionLabel } from "./moderation-transition-options";

export const metadata: Metadata = {
  title: "Модерация",
  description: "Административна опашка за модерация на обяви.",
  robots: {
    follow: false,
    index: false,
  },
};

interface ModerationPageProperties {
  readonly searchParams: Promise<{
    page?: string | string[];
    state?: string | string[];
  }>;
}

const moderationReportInclude = {
  listing: {
    select: {
      deletedAt: true,
      id: true,
      inventoryOfferId: true,
      slug: true,
      status: true,
    },
  },
  reporterAccount: {
    select: { sellerProfile: { select: { displayName: true } } },
  },
} satisfies Prisma.ModerationReportInclude;

const reasonLabels: Record<ModerationReason, string> = {
  duplicate: "Дублирана обява",
  fraud_risk: "Риск от измама",
  incorrect_details: "Неверни данни",
  other: "Друга причина",
  prohibited_content: "Забранено съдържание",
  seller_behavior: "Поведение на продавача",
};

const severityLabels: Record<ModerationSeverity, string> = {
  high: "Висок риск",
  low: "Нисък риск",
  medium: "Среден риск",
};

const severityTone: Record<ModerationSeverity, string> = {
  high: "border-destructive/30 bg-destructive/10 text-destructive",
  low: "border-border bg-secondary text-muted-foreground",
  medium: "border-warning/40 bg-warning-surface text-warning-foreground",
};

const statusLabels: Record<ModerationStatus, string> = {
  dismissed: "Отхвърлен",
  new: "Нов",
  resolved: "Решен",
  reviewing: "В преглед",
};

const statusTone: Record<ModerationStatus, string> = {
  dismissed: "border-border bg-secondary text-muted-foreground",
  new: "border-warning/40 bg-warning-surface text-warning-foreground",
  resolved: "border-success/40 bg-success-surface text-success-foreground",
  reviewing: "border-info/40 bg-info-surface text-info-foreground",
};

const listingStatusLabels: Record<ListingStatus, string> = {
  active: "Активна",
  archived: "Архивирана",
  draft: "Чернова",
  expired: "Изтекла",
  paused: "На пауза",
  pending_review: "Чака преглед",
  rejected: "Отхвърлена",
  sold: "Продадена",
};

const auditActionLabels: Readonly<Record<string, string>> = {
  "moderation.report.created": "Подаден сигнал",
  "moderation.report.dismissed": "Сигналът е отхвърлен",
  "moderation.report.resolved": "Сигналът е решен",
  "moderation.report.reviewing": "Започнат е преглед",
};

const formatDate = (value: Date) =>
  new Intl.DateTimeFormat("bg-BG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);

const firstSearchValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const parsePage = (value: string | string[] | undefined) => {
  const parsed = Number(firstSearchValue(value));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

const listOpenReports = (
  severity: ModerationSeverity,
  slice: { readonly skip: number; readonly take: number }
) =>
  slice.take > 0
    ? database.moderationReport.findMany({
        include: moderationReportInclude,
        orderBy: { createdAt: "desc" },
        skip: slice.skip,
        take: slice.take,
        where: { severity, status: { in: ["new", "reviewing"] } },
      })
    : Promise.resolve([]);

const getStateDetail = (state: "conflict" | "invalid_request") => {
  if (state === "conflict") {
    return "Друг администратор вече е променил този сигнал.";
  }

  return "Заявката за промяна е невалидна.";
};

const getModerationErrorState = (state?: string) =>
  state === "conflict" || state === "invalid_request" ? state : null;

const StatCard = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof AlertTriangleIcon;
  label: string;
  value: number;
}) => (
  <article className="rounded-lg border border-border bg-card p-3 sm:p-4">
    <div className="mb-3 flex items-center justify-between gap-2">
      <span className="text-muted-foreground text-sm">{label}</span>
      <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
    </div>
    <p className="font-semibold text-2xl tabular-nums">{value}</p>
  </article>
);

const ModerationPage = async ({ searchParams }: ModerationPageProperties) => {
  await requireModerationAdminAuthorization();
  const currentSearchParams = await searchParams;
  const state = getModerationErrorState(
    firstSearchValue(currentSearchParams.state)
  );
  const requestedPage = parsePage(currentSearchParams.page);
  const openStatuses: ModerationStatus[] = ["new", "reviewing"];
  const [
    highRiskCount,
    mediumRiskCount,
    lowRiskCount,
    closedCount,
    auditCount,
  ] = await Promise.all([
    database.moderationReport.count({
      where: { severity: "high", status: { in: openStatuses } },
    }),
    database.moderationReport.count({
      where: { severity: "medium", status: { in: openStatuses } },
    }),
    database.moderationReport.count({
      where: { severity: "low", status: { in: openStatuses } },
    }),
    database.moderationReport.count({
      where: { status: { in: ["dismissed", "resolved"] } },
    }),
    database.auditLog.count({
      where: { entityType: "moderation_report" },
    }),
  ]);
  const openCount = highRiskCount + mediumRiskCount + lowRiskCount;
  const { currentPage, pageCount } = getCanonicalModerationPage(
    requestedPage,
    openCount
  );

  if (requestedPage !== currentPage) {
    redirect(
      currentPage === 1
        ? "/admin/moderation"
        : `/admin/moderation?page=${currentPage}`
    );
  }

  const slices = getModerationSeveritySlices(
    { high: highRiskCount, low: lowRiskCount, medium: mediumRiskCount },
    currentPage
  );
  const [
    highRiskReports,
    mediumRiskReports,
    lowRiskReports,
    auditEntries,
    recentClosedReports,
  ] = await Promise.all([
    listOpenReports("high", slices.high),
    listOpenReports("medium", slices.medium),
    listOpenReports("low", slices.low),
    database.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      where: { entityType: "moderation_report" },
    }),
    database.moderationReport.findMany({
      orderBy: { resolvedAt: "desc" },
      select: {
        id: true,
        listingTitleSnapshot: true,
        resolutionCode: true,
        resolvedAt: true,
        status: true,
      },
      take: 10,
      where: { status: { in: ["dismissed", "resolved"] } },
    }),
  ]);
  const openReports = [
    ...highRiskReports,
    ...mediumRiskReports,
    ...lowRiskReports,
  ];
  const candidateListings = openReports.flatMap((report) =>
    report.listing ? [report.listing] : []
  );
  const publicListingIds = new Set<string>();

  if (candidateListings.length > 0) {
    const now = new Date();
    const hasImportedListings = candidateListings.some(
      (listing) => listing.inventoryOfferId !== null
    );
    const trustedSupplierOrgIds = hasImportedListings
      ? await getCurrentTrustedSupplierOrgIds(now)
      : [];
    const publicListings = await database.marketplaceListing.findMany({
      select: { id: true },
      where: {
        AND: [
          getCurrentPublicMarketplaceListingWhere(
            now,
            undefined,
            trustedSupplierOrgIds
          ),
          { id: { in: candidateListings.map((listing) => listing.id) } },
        ],
      },
    });

    for (const listing of publicListings) {
      publicListingIds.add(listing.id);
    }
  }
  const webBaseUrl = getPublicWebBaseUrl();

  return (
    <>
      <Header page="Модерация" pages={["AutoMarket", "Администрация"]} />
      <main className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
        <section aria-labelledby="moderation-title">
          <h1 className="font-semibold text-xl" id="moderation-title">
            Модерация
          </h1>
          <p className="mt-1 max-w-2xl text-muted-foreground text-sm">
            Сигнали за обяви, подредени първо по риск, с проследими действия на
            администраторите.
          </p>
        </section>

        {state ? (
          <Alert variant="destructive">
            <AlertTriangleIcon aria-hidden="true" />
            <AlertTitle>Промяната не беше приложена</AlertTitle>
            <AlertDescription>{getStateDetail(state)}</AlertDescription>
          </Alert>
        ) : null}

        <section
          aria-label="Обобщение на модерацията"
          className="grid grid-cols-1 gap-2 md:grid-cols-4 md:gap-3 min-[360px]:grid-cols-2"
        >
          <StatCard
            icon={InboxIcon}
            label="Отворени сигнали"
            value={openCount}
          />
          <StatCard
            icon={ShieldAlertIcon}
            label="Висок риск"
            value={highRiskCount}
          />
          <StatCard
            icon={CheckCircle2Icon}
            label="Приключени"
            value={closedCount}
          />
          <StatCard
            icon={ClockIcon}
            label="Одитни събития"
            value={auditCount}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="grid min-w-0 gap-3">
            {openReports.length > 0 ? (
              openReports.map((report) => {
                const reporter =
                  report.reporterAccount?.sellerProfile?.displayName ??
                  "Регистриран потребител";
                const isPublicListing = canLinkPublicModerationListing(
                  report.listing,
                  publicListingIds
                );

                return (
                  <article
                    className="min-w-0 rounded-lg border border-border bg-card p-3 sm:p-4"
                    key={report.id}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Badge
                            className={`rounded-full border ${statusTone[report.status]}`}
                            variant="secondary"
                          >
                            {statusLabels[report.status]}
                          </Badge>
                          <Badge
                            className={`rounded-full border ${severityTone[report.severity]}`}
                            variant="secondary"
                          >
                            {severityLabels[report.severity]}
                          </Badge>
                          <Badge className="rounded-full" variant="secondary">
                            {reasonLabels[report.reason]}
                          </Badge>
                        </div>
                        <h2 className="break-words font-semibold text-base">
                          {report.listingTitleSnapshot}
                        </h2>
                        <p className="mt-1 text-muted-foreground text-sm">
                          {reporter} · {formatDate(report.createdAt)}
                        </p>
                        <p className="mt-3 max-w-3xl whitespace-pre-wrap break-words text-sm">
                          {report.details}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 lg:max-w-72 lg:justify-end">
                        {report.listing && isPublicListing ? (
                          <Button
                            asChild
                            className="min-h-10 gap-2 rounded-lg"
                            variant="outline"
                          >
                            <Link
                              href={getListingHref(report.listing, webBaseUrl)}
                            >
                              <ExternalLinkIcon
                                aria-hidden="true"
                                className="size-4"
                              />
                              Публична обява
                            </Link>
                          </Button>
                        ) : (
                          <span className="flex min-h-10 items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-muted-foreground text-sm">
                            <EyeOffIcon aria-hidden="true" className="size-4" />
                            {report.listing
                              ? `Няма публичен достъп · вътрешен статус: ${listingStatusLabels[report.listing.status]}`
                              : "Обявата вече не е налична"}
                          </span>
                        )}
                        <ModerationTransitionControls
                          reportId={report.id}
                          status={report.status}
                        />
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <section className="rounded-lg border border-dashed bg-card p-8 text-center">
                <InboxIcon
                  aria-hidden="true"
                  className="mx-auto size-6 text-muted-foreground"
                />
                <h2 className="mt-2 font-medium">Няма отворени сигнали</h2>
                <p className="mt-1 text-muted-foreground text-sm">
                  Новите сигнали ще се появят тук, подредени по риск.
                </p>
              </section>
            )}
            {pageCount > 1 ? (
              <nav
                aria-label="Страници на опашката за модерация"
                className="flex flex-col items-center justify-between gap-3 rounded-lg border bg-card p-3 min-[360px]:flex-row"
              >
                <div className="w-full min-[360px]:w-auto">
                  {currentPage > 1 ? (
                    <Button
                      asChild
                      className="min-h-10 w-full min-[360px]:w-auto"
                      variant="outline"
                    >
                      <Link href={`/admin/moderation?page=${currentPage - 1}`}>
                        Предишна
                      </Link>
                    </Button>
                  ) : null}
                </div>
                <span className="text-muted-foreground text-sm tabular-nums">
                  Страница {currentPage} от {pageCount}
                </span>
                <div className="w-full min-[360px]:w-auto">
                  {currentPage < pageCount ? (
                    <Button
                      asChild
                      className="min-h-10 w-full min-[360px]:w-auto"
                      variant="outline"
                    >
                      <Link href={`/admin/moderation?page=${currentPage + 1}`}>
                        Следваща
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </nav>
            ) : null}
          </div>

          <aside className="grid h-fit gap-4">
            <section
              aria-labelledby="recent-closed-title"
              className="rounded-lg border border-border bg-card p-3 sm:p-4"
            >
              <div className="mb-3">
                <h2
                  className="font-semibold text-base"
                  id="recent-closed-title"
                >
                  Последно приключени
                </h2>
                <p className="text-muted-foreground text-sm">
                  История извън активната опашка.
                </p>
              </div>
              {recentClosedReports.length > 0 ? (
                <div className="divide-y divide-border">
                  {recentClosedReports.map((report) => (
                    <article className="py-3" key={report.id}>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          className={`rounded-full border ${statusTone[report.status]}`}
                          variant="secondary"
                        >
                          {statusLabels[report.status]}
                        </Badge>
                      </div>
                      <h3 className="mt-2 break-words font-medium text-sm">
                        {report.listingTitleSnapshot}
                      </h3>
                      <p className="mt-1 text-muted-foreground text-xs">
                        {getModerationResolutionLabel(report.resolutionCode)}
                      </p>
                      {report.resolvedAt ? (
                        <p className="mt-1 text-muted-foreground text-xs">
                          {formatDate(report.resolvedAt)}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="rounded-md bg-secondary p-3 text-muted-foreground text-sm">
                  Все още няма приключени сигнали.
                </p>
              )}
            </section>

            <section
              aria-labelledby="audit-log-title"
              className="rounded-lg border border-border bg-card p-3 sm:p-4"
            >
              <div className="mb-3">
                <h2 className="font-semibold text-base" id="audit-log-title">
                  Одитен журнал
                </h2>
                <p className="text-muted-foreground text-sm">
                  Последни действия по сигнали.
                </p>
              </div>
              {auditEntries.length > 0 ? (
                <div className="divide-y divide-border">
                  {auditEntries.map((entry) => (
                    <div className="py-3" key={entry.id}>
                      <p className="font-medium text-sm">
                        {auditActionLabels[entry.action] ?? "Промяна по сигнал"}
                      </p>
                      <p className="mt-1 text-muted-foreground text-xs">
                        {formatDate(entry.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-md bg-secondary p-3 text-muted-foreground text-sm">
                  Все още няма одитни събития.
                </p>
              )}
            </section>
          </aside>
        </section>
      </main>
    </>
  );
};

export default ModerationPage;
