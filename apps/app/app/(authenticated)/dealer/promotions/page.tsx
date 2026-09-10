import { database } from "@repo/database";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@repo/design-system/components/ui/alert";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { formatMoney } from "@repo/marketplace";
import {
  ArrowUpRightIcon,
  CalendarClockIcon,
  HistoryIcon,
  SparklesIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "../../components/header";
import { requireDealerOrganizationActor } from "../actor";
import {
  getEffectivePromotionStatus,
  getPromotionProductLabel,
  getPromotionStatusLabel,
  promotionProductCatalog,
} from "./promotion-presentation";

export const metadata: Metadata = {
  title: "Промотиране на обяви",
  description: "Платено позициониране и промотиране на обяви.",
};

const formatDate = (value: Date) =>
  new Intl.DateTimeFormat("bg-BG", {
    dateStyle: "medium",
  }).format(value);

const PromotionMetric = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof SparklesIcon;
  label: string;
  value: string;
}) => (
  <div className="min-w-0 rounded-lg border border-border bg-card p-3 sm:p-4 md:last:col-span-1 last:min-[360px]:col-span-2">
    <div className="mb-3 flex items-start justify-between gap-3">
      <span className="min-w-0 text-muted-foreground text-sm">{label}</span>
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
    </div>
    <p className="break-words font-semibold text-2xl">{value}</p>
  </div>
);

const DealerPromotionsPage = async () => {
  const actor = await requireDealerOrganizationActor();
  const now = new Date();
  const [promotions, activeCount, scheduledCount, totalCount] =
    await Promise.all([
      database.listingPromotion.findMany({
        orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
        select: {
          amountMinor: true,
          currency: true,
          endsAt: true,
          id: true,
          listingTitleSnapshot: true,
          paymentStatus: true,
          placement: true,
          productKey: true,
          startsAt: true,
          status: true,
        },
        take: 50,
        where: { dealerOrgId: actor.dealerOrgId },
      }),
      database.listingPromotion.count({
        where: {
          dealerOrgId: actor.dealerOrgId,
          endsAt: { gt: now },
          startsAt: { lte: now },
          status: "active",
          paymentStatus: { in: ["included_credit", "paid"] },
        },
      }),
      database.listingPromotion.count({
        where: {
          dealerOrgId: actor.dealerOrgId,
          endsAt: { gt: now },
          OR: [
            {
              status: "scheduled",
              paymentStatus: { in: ["included_credit", "paid"] },
            },
            {
              startsAt: { gt: now },
              status: "active",
              paymentStatus: { in: ["included_credit", "paid"] },
            },
          ],
        },
      }),
      database.listingPromotion.count({
        where: { dealerOrgId: actor.dealerOrgId },
      }),
    ]);
  const presentedPromotions = promotions.map((promotion) => ({
    ...promotion,
    presentationStatus: getEffectivePromotionStatus(
      promotion.status,
      promotion.paymentStatus,
      promotion.startsAt,
      promotion.endsAt,
      now
    ),
  }));

  return (
    <>
      <Header page="Промотиране" pages={["AutoMarket", "Дилър"]} />
      <main className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
        <section
          aria-labelledby="promotions-title"
          className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="min-w-0">
            <h1 className="font-semibold text-xl" id="promotions-title">
              Промотиране
            </h1>
            <p className="mt-1 max-w-2xl text-muted-foreground text-sm">
              Реални записи за платено позициониране на обявите на тази
              организация.
            </p>
          </div>
          <Button
            asChild
            className="h-10 w-full rounded-lg sm:w-auto"
            variant="secondary"
          >
            <Link href="/dealer/billing">План и плащания</Link>
          </Button>
        </section>

        <section
          aria-label="Обобщение за промоциите"
          className="grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-3 min-[360px]:grid-cols-2"
        >
          <PromotionMetric
            icon={SparklesIcon}
            label="Активни промоции"
            value={String(activeCount)}
          />
          <PromotionMetric
            icon={CalendarClockIcon}
            label="Предстоящи промоции"
            value={String(scheduledCount)}
          />
          <PromotionMetric
            icon={HistoryIcon}
            label="Всички записи"
            value={String(totalCount)}
          />
        </section>

        <Alert id="promotion-order-note">
          <SparklesIcon />
          <AlertTitle>Поръчването още не е достъпно</AlertTitle>
          <AlertDescription>
            Нови промоции не могат да бъдат закупени, докато няма свързан
            платежен доставчик, проверена сесия и избрана активна обява на
            организацията. Не създаваме фиктивна поръчка, плащане или boost.
          </AlertDescription>
        </Alert>

        <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0 rounded-lg border border-border bg-card p-3 sm:p-4">
            <h2 className="font-semibold text-base">Последни промоции</h2>
            {totalCount > presentedPromotions.length ? (
              <p className="mt-1 text-muted-foreground text-xs">
                Показани са последните {presentedPromotions.length} от{" "}
                {totalCount} записа.
              </p>
            ) : null}
            {presentedPromotions.length ? (
              <div className="mt-3 grid gap-3">
                {presentedPromotions.map((promotion) => (
                  <article
                    className="min-w-0 rounded-lg border border-border bg-secondary/40 p-3"
                    key={promotion.id}
                  >
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Badge
                            className="rounded-full"
                            variant={
                              promotion.presentationStatus === "active"
                                ? "default"
                                : "outline"
                            }
                          >
                            {promotion.presentationStatus === "active"
                              ? "Спонсорирана"
                              : "Запис за промоция"}
                          </Badge>
                          <Badge className="rounded-full" variant="secondary">
                            {getPromotionStatusLabel(
                              promotion.presentationStatus
                            )}
                          </Badge>
                          <Badge className="rounded-full" variant="outline">
                            {getPromotionProductLabel(
                              promotion.productKey,
                              promotion.placement
                            )}
                          </Badge>
                        </div>
                        <h3 className="break-words font-semibold text-base">
                          {promotion.listingTitleSnapshot}
                        </h3>
                        <p className="mt-1 break-words text-muted-foreground text-sm">
                          {formatDate(promotion.startsAt)} –{" "}
                          {formatDate(promotion.endsAt)} · записана сума{" "}
                          {formatMoney(
                            {
                              amount: promotion.amountMinor / 100,
                              currency: promotion.currency,
                            },
                            "bg"
                          )}
                        </p>
                      </div>
                      <Button
                        asChild
                        className="h-10 w-full gap-2 rounded-lg sm:w-auto"
                        variant="outline"
                      >
                        <Link href="/dealer/inventory">
                          <ArrowUpRightIcon className="h-4 w-4" />
                          Инвентар
                        </Link>
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-lg border border-dashed p-4 text-muted-foreground text-sm">
                За тази организация няма записани промоции.
              </p>
            )}
          </div>

          <aside className="min-w-0 rounded-lg border border-border bg-card p-3 sm:p-4">
            <h2 className="font-semibold text-base">Информационен каталог</h2>
            <p className="mt-1 text-muted-foreground text-xs">
              Каноничните 7/14/30-дневни опции са експеримент. Няма публикувани
              цени и не може да се направи поръчка.
            </p>
            <div className="mt-3 space-y-3">
              {promotionProductCatalog.map((product) => (
                <div className="border-border border-t pt-3" key={product.id}>
                  <p className="font-medium text-sm">{product.label}</p>
                  <p className="mt-1 text-muted-foreground text-xs">
                    {product.description} Продължителност:{" "}
                    {product.durationDays} дни.
                  </p>
                  <p className="mt-1 text-muted-foreground text-xs">
                    Етикет „{product.disclosureLabel}“ · само при органично
                    съвпадение · отделен спонсориран слот.
                  </p>
                  <Button
                    aria-describedby="promotion-order-note"
                    className="mt-3 h-10 w-full rounded-lg"
                    disabled
                    type="button"
                    variant="outline"
                  >
                    Поръчването не е налично
                  </Button>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <Alert>
          <HistoryIcon />
          <AlertTitle>Метриките са ограничени до измерени събития</AlertTitle>
          <AlertDescription>
            Не показваме примерни импресии, кликове, запитвания или ROI. Такива
            стойности ще се появят само след отделен, одитиран event pipeline с
            ясна атрибуция и frequency cap.
          </AlertDescription>
        </Alert>
      </main>
    </>
  );
};

export default DealerPromotionsPage;
