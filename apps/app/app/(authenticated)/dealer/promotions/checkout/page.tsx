import { database } from "@repo/database";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@repo/design-system/components/ui/alert";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { evaluatePromotionEligibility, formatMoney } from "@repo/marketplace";
import { formatVehicleLocation } from "@repo/marketplace-ui";
import { CreditCardIcon, SparklesIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "../../../components/header";
import { requireDealerOrganizationActor } from "../../actor";
import {
  getPromotionCatalogProduct,
  getPromotionPlacementLabel,
} from "../promotion-presentation";

export const metadata: Metadata = {
  title: "Поръчка на промоция",
  description: "Обобщение на поръчката за промотиране.",
};

interface PromotionCheckoutPageProps {
  readonly searchParams: Promise<{
    listing?: string | string[];
    product?: string | string[];
  }>;
}

const getFirstSearchParamValue = (
  value: string | string[] | undefined
): string | undefined => (Array.isArray(value) ? value.at(0) : value);

const PromotionCheckoutPage = async ({
  searchParams,
}: PromotionCheckoutPageProps) => {
  const actor = await requireDealerOrganizationActor();
  const params = await searchParams;
  const listingId = getFirstSearchParamValue(params.listing);
  const productId = getFirstSearchParamValue(params.product);
  const product = getPromotionCatalogProduct(productId);
  const listing =
    listingId && product
      ? await database.marketplaceListing.findFirst({
          select: {
            dealerOrgId: true,
            deletedAt: true,
            id: true,
            locationCity: true,
            locationCountry: true,
            locationRegion: true,
            priceAmountMinor: true,
            priceCurrency: true,
            status: true,
            title: true,
          },
          where: {
            dealerOrgId: actor.dealerOrgId,
            deletedAt: null,
            id: listingId,
            status: "active",
          },
        })
      : null;
  const activePromotionCount =
    listing && product
      ? await database.listingPromotion.count({
          where: {
            dealerOrgId: actor.dealerOrgId,
            endsAt: { gt: new Date() },
            listingId: listing.id,
            paymentStatus: { in: ["included_credit", "paid"] },
            status: { in: ["active", "scheduled"] },
          },
        })
      : 0;
  const eligibility =
    listing && productId
      ? evaluatePromotionEligibility({
          activePromotionCount,
          actorDealerOrgId: actor.dealerOrgId,
          listing,
          productId,
        })
      : null;
  const canReviewRequest = Boolean(product && listing && eligibility?.allowed);

  return (
    <>
      <Header page="Поръчка" pages={["AutoMarket", "Дилър", "Промотиране"]} />
      <main className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
        <section aria-labelledby="promotion-checkout-title">
          <h1 className="font-semibold text-xl" id="promotion-checkout-title">
            Поръчка на промоция
          </h1>
          <p className="mt-1 max-w-2xl text-muted-foreground text-sm">
            Проверка на избрана промоция за активна обява на организацията.
          </p>
        </section>

        <Alert id="payment-provider-note">
          <CreditCardIcon />
          <AlertTitle>Плащането не е налично</AlertTitle>
          <AlertDescription>
            Тази страница не създава поръчка и не приема плащане. Необходима е
            проверена provider сесия, идемпотентен callback и записано плащане
            или включен кредит, преди промоцията да бъде активирана.
          </AlertDescription>
        </Alert>

        {canReviewRequest && product && listing ? (
          <section className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="min-w-0 rounded-lg border border-border bg-card p-3 sm:p-4">
              <div className="mb-5 flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <SparklesIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="break-words font-semibold text-lg">
                    {product.label}
                  </h2>
                  <p className="mt-1 text-muted-foreground text-sm">
                    {product.description}
                  </p>
                </div>
              </div>

              <dl className="grid gap-3 min-[360px]:grid-cols-2">
                <div className="min-w-0 rounded-lg bg-secondary p-3">
                  <dt className="text-muted-foreground text-xs">
                    Позициониране
                  </dt>
                  <dd className="mt-1 break-words font-medium">
                    {getPromotionPlacementLabel(product.placement)}
                  </dd>
                </div>
                <div className="min-w-0 rounded-lg bg-secondary p-3">
                  <dt className="text-muted-foreground text-xs">
                    Продължителност
                  </dt>
                  <dd className="mt-1 font-medium">
                    {product.durationDays} дни
                  </dd>
                </div>
              </dl>

              <article className="mt-4 min-w-0 rounded-lg border border-border p-3">
                <div className="flex min-w-0 flex-col gap-3 min-[360px]:flex-row min-[360px]:items-start min-[360px]:justify-between">
                  <div className="min-w-0">
                    <h3 className="break-words font-medium">{listing.title}</h3>
                    <p className="mt-1 break-words text-muted-foreground text-sm">
                      {formatVehicleLocation(
                        {
                          city: listing.locationCity,
                          country: listing.locationCountry,
                          region: listing.locationRegion ?? undefined,
                        },
                        "bg"
                      )}{" "}
                      ·{" "}
                      {formatMoney(
                        {
                          amount: listing.priceAmountMinor / 100,
                          currency: listing.priceCurrency,
                        },
                        "bg"
                      )}
                    </p>
                  </div>
                  <Badge className="w-fit max-w-full whitespace-normal rounded-full">
                    Активна обява
                  </Badge>
                </div>
              </article>

              <Button
                aria-describedby="payment-provider-note"
                className="mt-5 h-10 w-full gap-2 rounded-lg min-[360px]:w-auto"
                disabled
                type="button"
              >
                <CreditCardIcon className="h-4 w-4" />
                Плащането не е налично
              </Button>
            </div>

            <aside className="min-w-0 rounded-lg border border-border bg-card p-3 sm:p-4">
              <h2 className="font-semibold text-base">Преглед на заявката</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex flex-col gap-1 min-[360px]:flex-row min-[360px]:justify-between min-[360px]:gap-3">
                  <dt className="text-muted-foreground">Промоция</dt>
                  <dd className="break-words font-medium min-[360px]:text-right">
                    {product.label}
                  </dd>
                </div>
                <div className="flex flex-col gap-1 min-[360px]:flex-row min-[360px]:justify-between min-[360px]:gap-3">
                  <dt className="text-muted-foreground">Обява</dt>
                  <dd className="break-words font-medium min-[360px]:text-right">
                    {listing.title}
                  </dd>
                </div>
                <div className="border-border border-t pt-3">
                  <dt className="text-muted-foreground">Цена</dt>
                  <dd className="mt-1 font-medium">
                    Не е публикувана. Няма създадена поръчка и не е начислена
                    сума.
                  </dd>
                </div>
                <div className="border-border border-t pt-3">
                  <dt className="text-muted-foreground">Публичен етикет</dt>
                  <dd className="mt-1 font-medium">
                    {product.disclosureLabel}
                  </dd>
                </div>
              </dl>
            </aside>
          </section>
        ) : (
          <section className="rounded-lg border border-dashed bg-card p-4 sm:p-6">
            <h2 className="font-semibold text-base">
              Заявката не може да бъде прегледана
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground text-sm">
              Липсва поддържан продукт или активна обява, собственост на тази
              организация, или вече има текуща промоция. Не е създадена поръчка
              и не е изпратена информация към доставчик.
            </p>
            <Button
              asChild
              className="mt-4 h-10 w-full rounded-lg min-[360px]:w-auto"
              variant="outline"
            >
              <Link href="/dealer/promotions">Назад към промоциите</Link>
            </Button>
          </section>
        )}
      </main>
    </>
  );
};

export default PromotionCheckoutPage;
