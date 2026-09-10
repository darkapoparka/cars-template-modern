import { randomUUID } from "node:crypto";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import {
  isoCountryCodeSchema,
  parseMarketplaceSearchParams,
} from "@repo/marketplace";
import { log } from "@repo/observability/log";
import { getLocalizedPath, normalizeSeoLocale } from "@repo/seo/metadata";
import { ArrowLeftIcon, MessageSquareText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, unstable_rethrow } from "next/navigation";
import {
  hasRoutablePublicListingLeadDestination,
  isPublicListingLeadSubmissionAvailable,
} from "@/lib/public-listing-contact";
import type { PublicListingLeadSubmissionStatus } from "@/lib/public-listing-lead-submission";
import {
  getPublicDemoMarketplaceListing,
  getPublicMarketplaceListing,
} from "@/lib/public-marketplace-data";
import { createPublicLocalizedMetadata } from "@/lib/public-metadata";
import { getPublicWebBaseUrl } from "@/lib/public-url";
import { InventoryUnavailable } from "../../../components/inventory-states";
import { PublicMarketplaceFrame } from "../../../components/public-marketplace-frame";
import { createListingLeadAction } from "./actions";
import { ListingContactHoneypot } from "./contact-honeypot";
import { ContactSubmitButton } from "./contact-submit-button";

interface ContactListingPageProps {
  readonly params: Promise<{ locale: string; slug: string }>;
  readonly searchParams: Promise<{
    deliverTo?: string | string[];
    error?: string | string[];
    sent?: string | string[];
  }>;
}

const getContactCopy = (locale: string) => {
  if (locale === "bg") {
    return {
      availability: "Наличност",
      back: "Назад към обявата",
      defaultMessage: (title: string) =>
        `Здравейте, интересувам се от ${title}.`,
      email: "Имейл",
      errorInvalid:
        "Проверете името, данните за връзка и съобщението и опитайте отново.",
      errorListingUnavailable:
        "Обявата вече не приема запитвания за избраната дестинация.",
      errorRateLimited:
        "Изпратихте твърде много запитвания. Опитайте отново по-късно.",
      errorTitle: "Запитването не беше изпратено",
      errorUnavailable:
        "Услугата за запитвания временно не е достъпна. Опитайте отново по-късно.",
      finance: "Финансиране",
      general: "Общ въпрос",
      interestedIn: "Интересувам се от",
      message: "Съобщение",
      name: "Име",
      phone: "Телефон",
      privacyBefore: "Посочете поне имейл или телефон. С изпращането приемате ",
      privacyLabel: "политиката за поверителност",
      sentDetail: "Продавачът получи данните за връзка и съобщението ви.",
      sentTitle: "Запитването е изпратено.",
      submit: "Изпрати запитване",
      submitting: "Изпращане…",
      testDrive: "Тест драйв",
      title: "Свържете се с продавача",
      tradeIn: "Замяна",
      unavailableDetail:
        "Каналът за запитвания още не е активен. Не събираме данни за контакт, докато защитата и доставката на съобщения не са готови.",
      unavailableTitle: "Контактът временно не е достъпен",
    };
  }

  return {
    availability: "Availability",
    back: "Back to listing",
    defaultMessage: (title: string) => `Hello, I am interested in ${title}.`,
    email: "Email",
    errorInvalid:
      "Check your name, contact details, and message, then try again.",
    errorListingUnavailable:
      "This listing no longer accepts enquiries for the selected destination.",
    errorRateLimited:
      "You have sent too many enquiries. Please try again later.",
    errorTitle: "Your enquiry was not sent",
    errorUnavailable:
      "Enquiries are temporarily unavailable. Please try again later.",
    finance: "Finance",
    general: "General question",
    interestedIn: "I am interested in",
    message: "Message",
    name: "Name",
    phone: "Phone",
    privacyBefore:
      "Provide at least an email or phone number. By sending, you acknowledge the ",
    privacyLabel: "privacy notice",
    sentDetail: "The seller received your contact details and message.",
    sentTitle: "Your enquiry was sent.",
    submit: "Send enquiry",
    submitting: "Sending…",
    testDrive: "Test drive",
    title: "Contact the seller",
    tradeIn: "Trade-in",
    unavailableDetail:
      "The enquiry channel is not active yet. We do not collect contact details until message delivery and abuse protection are ready.",
    unavailableTitle: "Contact is temporarily unavailable",
  };
};

type ContactCopy = ReturnType<typeof getContactCopy>;
type PublicListingLeadSubmissionError = Exclude<
  PublicListingLeadSubmissionStatus,
  "success"
>;

export const generateMetadata = async ({
  params,
}: ContactListingPageProps): Promise<Metadata> => {
  const { locale, slug } = await params;
  const normalizedLocale = normalizeSeoLocale(locale);
  const isBg = normalizedLocale === "bg";

  return createPublicLocalizedMetadata({
    baseUrl: getPublicWebBaseUrl(),
    description: isBg
      ? "Изпратете запитване за конкретна обява директно до продавача."
      : "Send an enquiry about a specific listing directly to the seller.",
    locale: normalizedLocale,
    path: `/listing/${slug}/contact`,
    robots: {
      follow: false,
      index: false,
    },
    title: isBg ? "Запитване към продавача" : "Contact the seller",
  });
};

const ContactSuccess = ({ copy }: { copy: ContactCopy }) => (
  <output
    aria-live="polite"
    className="mt-7 block rounded-xl bg-success-surface p-4 text-sm text-success-foreground"
  >
    <span className="block font-medium">{copy.sentTitle}</span>
    <span className="mt-1 block opacity-85">{copy.sentDetail}</span>
  </output>
);

const ContactUnavailable = ({ copy }: { copy: ContactCopy }) => (
  <output
    aria-live="polite"
    className="mt-7 block rounded-xl bg-control p-5 text-sm"
  >
    <span className="block font-semibold text-foreground">
      {copy.unavailableTitle}
    </span>
    <span className="mt-2 block text-muted-foreground leading-6">
      {copy.unavailableDetail}
    </span>
  </output>
);

const submissionErrorStatuses = new Set<PublicListingLeadSubmissionError>([
  "invalid",
  "listing-unavailable",
  "rate-limited",
  "unavailable",
]);

const getSubmissionError = (
  value: string | string[] | undefined
): PublicListingLeadSubmissionError | undefined => {
  const status = Array.isArray(value) ? value[0] : value;
  return status &&
    submissionErrorStatuses.has(status as PublicListingLeadSubmissionError)
    ? (status as PublicListingLeadSubmissionError)
    : undefined;
};

const ContactError = ({
  copy,
  status,
}: {
  copy: ContactCopy;
  status: PublicListingLeadSubmissionError;
}) => {
  const detail = {
    invalid: copy.errorInvalid,
    "listing-unavailable": copy.errorListingUnavailable,
    "rate-limited": copy.errorRateLimited,
    unavailable: copy.errorUnavailable,
  }[status];

  return (
    <div
      className="mt-7 rounded-xl bg-destructive/10 p-4 text-destructive text-sm"
      role="alert"
    >
      <p className="font-medium">{copy.errorTitle}</p>
      <p className="mt-1 opacity-85">{detail}</p>
    </div>
  );
};

const ContactSellerForm = ({
  copy,
  deliverTo,
  listingTitle,
  locale,
  slug,
}: {
  copy: ContactCopy;
  deliverTo?: string;
  listingTitle: string;
  locale: "bg" | "en";
  slug: string;
}) => (
  <form action={createListingLeadAction} className="mt-7 grid gap-5">
    <input name="buyerLocale" type="hidden" value={locale} />
    {deliverTo ? (
      <input name="buyerCountryCode" type="hidden" value={deliverTo} />
    ) : null}
    <input name="locale" type="hidden" value={locale} />
    <input name="inquiryDedupeKey" type="hidden" value={randomUUID()} />
    <input name="slug" type="hidden" value={slug} />
    <ListingContactHoneypot />
    <div className="grid gap-2">
      <Label htmlFor="buyerName">{copy.name}</Label>
      <Input id="buyerName" maxLength={120} name="buyerName" required />
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-2">
        <Label htmlFor="email">{copy.email}</Label>
        <Input id="email" name="email" type="email" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="phone">{copy.phone}</Label>
        <Input id="phone" name="phone" type="tel" />
      </div>
    </div>
    <div className="grid gap-2">
      <Label htmlFor="intent">{copy.interestedIn}</Label>
      <Select defaultValue="availability" name="intent">
        <SelectTrigger className="w-full bg-control" id="intent">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="availability">{copy.availability}</SelectItem>
          <SelectItem value="test_drive">{copy.testDrive}</SelectItem>
          <SelectItem value="finance">{copy.finance}</SelectItem>
          <SelectItem value="trade_in">{copy.tradeIn}</SelectItem>
          <SelectItem value="general">{copy.general}</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div className="grid gap-2">
      <Label htmlFor="message">{copy.message}</Label>
      <Textarea
        className="min-h-32"
        defaultValue={copy.defaultMessage(listingTitle)}
        id="message"
        maxLength={3000}
        minLength={5}
        name="message"
        required
      />
    </div>
    <p
      className="text-muted-foreground text-xs leading-5"
      id="contact-privacy-context"
    >
      {copy.privacyBefore}
      <Link
        className="font-medium text-foreground underline underline-offset-2"
        href={getLocalizedPath(locale, "/legal/privacy")}
      >
        {copy.privacyLabel}
      </Link>
      .
    </p>
    <ContactSubmitButton
      describedBy="contact-privacy-context"
      idleLabel={copy.submit}
      pendingLabel={copy.submitting}
    />
  </form>
);

const ContactListingPage = async ({
  params,
  searchParams,
}: ContactListingPageProps) => {
  const { locale, slug } = await params;
  const normalizedLocale = normalizeSeoLocale(locale);
  const currentSearchParams = await searchParams;
  const submissionError = getSubmissionError(currentSearchParams.error);
  const { deliverTo: requestedDestination } =
    parseMarketplaceSearchParams(currentSearchParams);
  const parsedDestination = isoCountryCodeSchema
    .optional()
    .safeParse(requestedDestination);
  const deliverTo = parsedDestination.success
    ? parsedDestination.data
    : undefined;
  const copy = getContactCopy(normalizedLocale);
  let listing: Awaited<ReturnType<typeof getPublicMarketplaceListing>>;

  try {
    listing =
      process.env.AUTOMARKET_PUBLIC_E2E === "true"
        ? getPublicDemoMarketplaceListing(slug, {
            destinationCountryCode: deliverTo,
          })
        : await getPublicMarketplaceListing(slug, {
            destinationCountryCode: deliverTo,
          });
  } catch (error) {
    unstable_rethrow(error);
    log.error("Public listing contact page is unavailable.", { error });
    return (
      <PublicMarketplaceFrame activeMode="buy" locale={normalizedLocale}>
        <InventoryUnavailable locale={normalizedLocale} />
      </PublicMarketplaceFrame>
    );
  }

  if (!listing && process.env.NODE_ENV !== "production") {
    listing = getPublicDemoMarketplaceListing(slug, {
      destinationCountryCode: deliverTo,
    });
  }

  if (!listing) {
    notFound();
  }
  if (listing.supply && !deliverTo) {
    notFound();
  }
  const submissionAvailable =
    isPublicListingLeadSubmissionAvailable() &&
    hasRoutablePublicListingLeadDestination(listing);
  const destinationQuery = deliverTo
    ? `?deliverTo=${encodeURIComponent(deliverTo)}`
    : "";
  const listingHref = `${getLocalizedPath(
    normalizedLocale,
    `/listing/${slug}`
  )}${destinationQuery}`;

  return (
    <PublicMarketplaceFrame activeMode="buy" locale={normalizedLocale}>
      <main className="min-h-[calc(100vh-12rem)] bg-background px-4 py-8 lg:py-12">
        <div className="mx-auto max-w-2xl">
          <Button
            asChild
            className="mb-5 min-h-11 gap-2 rounded-lg lg:min-h-0"
            variant="secondary"
          >
            <Link href={listingHref}>
              <ArrowLeftIcon aria-hidden="true" className="size-4" />
              {copy.back}
            </Link>
          </Button>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-panel sm:p-8">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-control text-foreground">
                <MessageSquareText aria-hidden="true" className="size-5" />
              </span>
              <div className="min-w-0">
                <h1 className="font-semibold text-section-title tracking-tight">
                  {copy.title}
                </h1>
                <p className="mt-1 truncate text-muted-foreground text-sm">
                  {listing.title}
                </p>
              </div>
            </div>

            {submissionAvailable && currentSearchParams.sent === "1" ? (
              <ContactSuccess copy={copy} />
            ) : (
              <>
                {submissionError ? (
                  <ContactError copy={copy} status={submissionError} />
                ) : null}
                {submissionAvailable && (
                  <ContactSellerForm
                    copy={copy}
                    deliverTo={deliverTo}
                    listingTitle={listing.title}
                    locale={normalizedLocale}
                    slug={slug}
                  />
                )}
                {!(submissionAvailable || submissionError) && (
                  <ContactUnavailable copy={copy} />
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </PublicMarketplaceFrame>
  );
};

export default ContactListingPage;
