import { auth } from "@repo/auth/server";
import { database } from "@repo/database";
import { getMarketplaceAccountByClerkUserId } from "@repo/database/accounts";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@repo/design-system/components/ui/alert";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Label } from "@repo/design-system/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@repo/design-system/components/ui/radio-group";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { formatMoney } from "@repo/marketplace";
import { formatVehicleLocation } from "@repo/marketplace-ui";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  FlagIcon,
  SendIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "../../components/header";
import { getPublicWebBaseUrl } from "../../marketplace-url";
import { createModerationReportAction } from "./actions";
import { buyerReportOptions } from "./report-options";

export const metadata: Metadata = {
  title: "Сигнал за обява",
  description: "Подаване на сигнал за обява в пазара.",
  robots: {
    follow: false,
    index: false,
  },
};

interface ReportListingPageProps {
  readonly searchParams: Promise<{
    error?: string | string[];
    listing?: string | string[];
    submitted?: string | string[];
  }>;
}

type ReportListing = NonNullable<Awaited<ReturnType<typeof getReportListing>>>;

const categoryLabels: Record<ReportListing["category"], string> = {
  car: "Автомобил",
  lease: "Лизинг",
  motorbike: "Мотоциклет",
  truck: "Камион",
  van: "Бус",
};

const verificationLabels: Record<
  ReportListing["sellerVerificationStatus"],
  string
> = {
  pending: "В процес на проверка",
  rejected: "Отхвърлена проверка",
  unverified: "Непроверен",
  verified: "Проверен",
};

const firstSearchValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const hasSubmittedReportReceipt = async (
  listingId: string,
  reportId: string
) => {
  if (reportId.length < 6 || reportId.length > 128) {
    return false;
  }

  const session = await auth();

  if (!session.userId) {
    return false;
  }

  const account = await getMarketplaceAccountByClerkUserId(session.userId);

  if (!account) {
    return false;
  }

  const report = await database.moderationReport.findFirst({
    select: { id: true },
    where: {
      id: reportId,
      listingId,
      reporterAccountId: account.id,
    },
  });

  return Boolean(report);
};

const getReportListing = (listingId: string) =>
  database.marketplaceListing.findFirst({
    select: {
      category: true,
      id: true,
      locationCity: true,
      locationCountry: true,
      locationRegion: true,
      priceAmountMinor: true,
      priceCurrency: true,
      sellerDisplayName: true,
      sellerVerificationStatus: true,
      slug: true,
      title: true,
    },
    where: {
      deletedAt: null,
      id: listingId,
      status: "active",
    },
  });

const ListingSummary = ({ listing }: { listing: ReportListing }) => (
  <aside className="h-fit rounded-lg border border-border bg-card p-3 sm:p-4">
    <div className="mb-3 flex items-center justify-between gap-2">
      <Badge className="rounded-full" variant="secondary">
        {categoryLabels[listing.category]}
      </Badge>
      <span className="font-semibold text-sm">
        {formatMoney(
          {
            amount: Math.round(listing.priceAmountMinor / 100),
            currency: listing.priceCurrency,
          },
          "bg"
        )}
      </span>
    </div>
    <h2 className="font-semibold text-base">{listing.title}</h2>
    <p className="mt-1 text-muted-foreground text-sm">
      {formatVehicleLocation(
        {
          city: listing.locationCity,
          country: listing.locationCountry,
          region: listing.locationRegion ?? undefined,
        },
        "bg"
      )}{" "}
      · {listing.sellerDisplayName}
    </p>
    <div className="mt-4 rounded-lg bg-secondary p-3 text-sm">
      <p className="text-muted-foreground text-xs">Проверка на продавача</p>
      <p className="mt-1 font-medium">
        {verificationLabels[listing.sellerVerificationStatus]}
      </p>
    </div>
  </aside>
);

const ReportRouteMessage = ({
  kind,
  webBaseUrl,
}: {
  kind: "account-unavailable" | "rate-limited" | "submitted" | "unavailable";
  webBaseUrl: string;
}) => {
  const submitted = kind === "submitted";
  const title = {
    "account-unavailable": "Сигналът не може да бъде изпратен",
    "rate-limited": "Достигнахте временното ограничение",
    submitted: "Сигналът е приет",
    unavailable: "Обявата вече не приема сигнали",
  }[kind];
  const description = {
    "account-unavailable":
      "Профилът няма активен достъп за подаване на сигнали. Свържете се с поддръжката, ако смятате, че това е грешка.",
    "rate-limited":
      "Защитата срещу злоупотреба временно спря нови сигнали от този профил. Опитайте отново по-късно.",
    submitted:
      "Екипът по модерация ще прегледа сигнала. Не е необходимо да го изпращате отново.",
    unavailable:
      "Обявата е спряна, приключена или вече не е достъпна за преглед.",
  }[kind];

  return (
    <>
      <Header page="Сигнал за обява" pages={["AutoMarket", "Доверие"]} />
      <main className="flex flex-1 items-start justify-center p-3 sm:p-4 lg:p-8">
        <section className="w-full max-w-xl rounded-lg border border-border bg-card p-3 sm:p-4">
          <Alert
            className={submitted ? "border-success/40 bg-success-surface" : ""}
            variant={submitted ? "default" : "destructive"}
          >
            {submitted ? (
              <CheckCircle2Icon aria-hidden="true" />
            ) : (
              <AlertTriangleIcon aria-hidden="true" />
            )}
            <AlertTitle>
              <h1 className="font-semibold text-base">{title}</h1>
            </AlertTitle>
            <AlertDescription>
              {description}
              <Button asChild className="mt-4 min-h-10" variant="outline">
                <Link href={webBaseUrl}>Към пазара</Link>
              </Button>
            </AlertDescription>
          </Alert>
        </section>
      </main>
    </>
  );
};

const ReportListingPage = async ({ searchParams }: ReportListingPageProps) => {
  const currentSearchParams = await searchParams;
  const listingId = firstSearchValue(currentSearchParams.listing);
  const error = firstSearchValue(currentSearchParams.error);
  const submittedReportId = firstSearchValue(currentSearchParams.submitted);
  const webBaseUrl = getPublicWebBaseUrl();

  if (error === "listing-unavailable") {
    return <ReportRouteMessage kind="unavailable" webBaseUrl={webBaseUrl} />;
  }

  if (error === "account-unavailable" || error === "rate-limited") {
    return <ReportRouteMessage kind={error} webBaseUrl={webBaseUrl} />;
  }

  if (
    submittedReportId &&
    listingId &&
    (await hasSubmittedReportReceipt(listingId, submittedReportId))
  ) {
    return <ReportRouteMessage kind="submitted" webBaseUrl={webBaseUrl} />;
  }

  if (submittedReportId) {
    notFound();
  }

  if (!listingId) {
    notFound();
  }

  const listing = await getReportListing(listingId);

  if (!listing) {
    notFound();
  }

  return (
    <>
      <Header page="Сигнал за обява" pages={["AutoMarket", "Доверие"]} />
      <main className="grid flex-1 gap-3 p-3 sm:p-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="rounded-lg border border-border bg-card p-3 sm:p-4">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
              <FlagIcon aria-hidden="true" className="size-5" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">
                Кажете ни какво не изглежда наред
              </h1>
              <p className="mt-1 max-w-2xl text-muted-foreground text-sm">
                Сигналът се записва в опашката за модерация с контекст за
                обявата и продавача.
              </p>
            </div>
          </div>

          <form action={createModerationReportAction}>
            <input name="listingId" type="hidden" value={listing.id} />

            {error ? (
              <Alert className="mb-4" variant="destructive">
                <AlertTriangleIcon aria-hidden="true" />
                <AlertTitle>Сигналът не беше изпратен</AlertTitle>
                <AlertDescription>
                  Изберете причина и добавете поне 10 знака подробности.
                </AlertDescription>
              </Alert>
            ) : null}

            <fieldset>
              <legend className="font-medium text-sm">Причина</legend>
              <RadioGroup
                className="mt-2 grid gap-2 sm:grid-cols-2"
                name="reason"
                required
              >
                {buyerReportOptions.map((option) => (
                  <Label
                    className="min-h-12 cursor-pointer rounded-lg border border-border bg-secondary px-3 py-2.5 leading-5 transition-colors has-[[data-state=checked]]:border-foreground has-[[data-state=checked]]:bg-accent"
                    htmlFor={`report-reason-${option.value}`}
                    key={option.value}
                  >
                    <RadioGroupItem
                      id={`report-reason-${option.value}`}
                      value={option.value}
                    />
                    {option.label}
                  </Label>
                ))}
              </RadioGroup>
            </fieldset>

            <div className="mt-4">
              <Label htmlFor="report-details">Подробности</Label>
              <Textarea
                className="mt-2 min-h-32 rounded-lg"
                id="report-details"
                maxLength={2000}
                minLength={10}
                name="details"
                placeholder="Добавете информация, която ще помогне при прегледа на обявата."
                required
              />
            </div>

            <div className="mt-4 flex min-h-12 flex-col gap-2 rounded-lg bg-secondary p-3 text-muted-foreground text-sm sm:flex-row sm:items-center">
              <AlertTriangleIcon
                aria-hidden="true"
                className="size-4 shrink-0"
              />
              Неверните сигнали забавят прегледа. Добавяйте само данни, които
              смятате за точни.
            </div>

            <div className="mt-5 flex justify-end">
              <Button className="min-h-10 gap-2 rounded-lg" type="submit">
                <SendIcon aria-hidden="true" className="size-4" />
                Изпрати сигнала
              </Button>
            </div>
          </form>
        </section>

        <ListingSummary listing={listing} />
      </main>
    </>
  );
};

export default ReportListingPage;
