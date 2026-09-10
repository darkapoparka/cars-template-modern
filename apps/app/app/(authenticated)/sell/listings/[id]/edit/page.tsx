import { randomUUID } from "node:crypto";
import { database } from "@repo/database";
import { getOwnedListing } from "@repo/database/listings";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@repo/design-system/components/ui/alert";
import { Button } from "@repo/design-system/components/ui/button";
import {
  getQuotaRecoveryCopy,
  isSourceManagedListing,
  type ListingQuotaDecisionCode,
} from "@repo/marketplace";
import { ArrowLeftIcon, GaugeIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "../../../../components/header";
import { transitionListingAction, updateListingAction } from "../../../actions";
import { requireListingActor } from "../../../actor";
import { ListingAiSuggestions } from "../../../components/listing-ai-suggestions";
import { SellerListingForm } from "../../../components/listing-form";
import { MediaUploader } from "../../../components/media-uploader";
import { SellFunnelSteps } from "../../../components/sell-funnel-steps";
import { runDeterministicFactoryAction } from "../../../factory-actions";
import {
  type ListingReturnContext,
  parseListingReturnContext,
} from "../../../listing-return-context";

interface EditListingPageProps {
  readonly params: Promise<{
    id: string;
  }>;
  readonly searchParams: Promise<{
    quota?: string | string[];
    returnContext?: string | string[];
  }>;
}

interface ListingReturnContextInputProps {
  readonly returnContext?: ListingReturnContext;
}

const ListingReturnContextInput = ({
  returnContext,
}: ListingReturnContextInputProps) =>
  returnContext ? (
    <input name="returnContext" type="hidden" value={returnContext} />
  ) : null;

const listingQuotaDecisionCodes = new Set<ListingQuotaDecisionCode>([
  "allowed",
  "already_active",
  "entitlement_expired",
  "entitlement_grace",
  "entitlement_suspended",
  "plan_unavailable",
  "quota_reached",
]);

const getQuotaMessage = (value: string | string[] | undefined) => {
  const firstValue = Array.isArray(value) ? value.at(0) : value;
  return firstValue &&
    listingQuotaDecisionCodes.has(firstValue as ListingQuotaDecisionCode)
    ? getQuotaRecoveryCopy(firstValue as ListingQuotaDecisionCode, "bg")
    : null;
};

export const metadata: Metadata = {
  title: "Редактиране на обява",
  description: "Редактирайте обява за продажба в AutoMarket.",
};

const EditListingPage = async ({
  params,
  searchParams,
}: EditListingPageProps) => {
  const [{ id }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const actor = await requireListingActor();
  const listing = await getOwnedListing(id, actor);

  if (!listing) {
    notFound();
  }

  const sourceManaged = isSourceManagedListing(listing);
  const returnContext = actor.clerkOrgId
    ? parseListingReturnContext(resolvedSearchParams.returnContext)
    : undefined;
  const dealerWorkspace = sourceManaged || returnContext === "dealer-inventory";
  const quotaMessage = getQuotaMessage(resolvedSearchParams.quota);
  const workspaceHref = dealerWorkspace
    ? "/dealer/inventory"
    : "/sell/listings";
  const latestGeneration =
    !sourceManaged && actor.clerkOrgId && listing.dealerOrgId
      ? await database.listingGeneration.findFirst({
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          select: {
            errorMessage: true,
            generatedDescriptionBg: true,
            generatedDescriptionEn: true,
            generatedTitle: true,
            id: true,
            metadata: true,
            model: true,
            promptVersion: true,
            provider: true,
          },
          where: {
            dealerOrgId: listing.dealerOrgId,
            listingId: listing.id,
            status: "done",
          },
        })
      : null;
  const currentStep = listing.images.length > 0 ? 3 : 2;

  return (
    <>
      <Header
        page={sourceManaged ? "Обява от източник" : "Редактиране на обява"}
        pages={["AutoMarket", dealerWorkspace ? "Дилър" : "Продавач"]}
      >
        <Button
          asChild
          className="mr-3 h-9 gap-2 rounded-lg sm:mr-4"
          variant="secondary"
        >
          <Link href={workspaceHref}>
            <ArrowLeftIcon className="h-4 w-4" />
            {dealerWorkspace ? "Инвентар" : "Обяви"}
          </Link>
        </Button>
      </Header>
      <main className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
        {quotaMessage ? (
          <Alert>
            <GaugeIcon />
            <AlertTitle>Обявата не е активирана</AlertTitle>
            <AlertDescription>{quotaMessage}</AlertDescription>
          </Alert>
        ) : null}
        {sourceManaged ? (
          <section className="rounded-lg border bg-card p-4 sm:p-5">
            <h2 className="font-semibold">
              Управлява се от източник на инвентар
            </h2>
            <p className="mt-1 max-w-2xl text-muted-foreground text-sm">
              Данните, снимките и състоянието на публикуване се синхронизират от
              оторизирания източник. Проверете състоянието му или коригирайте
              първичния запис, вместо да редактирате публичното копие.
            </p>
            <Button asChild className="mt-4" variant="secondary">
              <Link href="/dealer/inventory/sources">
                Преглед на източниците
              </Link>
            </Button>
          </section>
        ) : (
          <>
            <SellFunnelSteps currentStep={currentStep} />
            <section className="rounded-lg border bg-card p-4" id="photos">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="font-semibold">Добавете снимките рано</h1>
                  <p className="mt-1 max-w-2xl text-muted-foreground text-sm">
                    Черновата вече е запазена. Качете екстериор, интериор,
                    километраж и важни детайли, за да подобрите следващите
                    предложения.
                  </p>
                </div>
                <Button asChild variant="ghost">
                  <a href="#details">Пропусни засега</a>
                </Button>
              </div>
              <p className="mt-3 mb-3 text-muted-foreground text-sm">
                JPEG, PNG или WebP; до 15 MB на файл, 24 снимки и общо 200 MB за
                обява.
              </p>
              <MediaUploader listingId={listing.id} />
              {listing.images.length > 0 && (
                <p className="mt-3 text-muted-foreground text-sm">
                  {listing.images.length} запазени снимки.
                </p>
              )}
            </section>
            {latestGeneration ? (
              <ListingAiSuggestions
                generation={latestGeneration}
                listingId={listing.id}
              />
            ) : null}
            {actor.clerkOrgId && (
              <form
                action={runDeterministicFactoryAction}
                className="grid gap-3 rounded-lg border bg-card p-3 sm:p-4"
              >
                <input name="listingId" type="hidden" value={listing.id} />
                <input name="requestId" type="hidden" value={randomUUID()} />
                <div>
                  <h2 className="font-semibold">AI помощник за черновата</h2>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Създава проверими предложения от въведените факти, VIN,
                    снимките и бележките. Не променя обявата без ваш избор.
                  </p>
                </div>
                <label className="grid gap-2 text-sm" htmlFor="notes">
                  Бележки за състояние и оборудване
                  <textarea
                    className="min-h-24 rounded-lg border bg-background p-3"
                    id="notes"
                    maxLength={2000}
                    name="notes"
                  />
                </label>
                <Button className="w-fit" type="submit">
                  Създай предложения за потвърждение
                </Button>
              </form>
            )}
            <div className="scroll-mt-28" id="details">
              <SellerListingForm
                action={updateListingAction}
                cancelHref={workspaceHref}
                listing={listing}
                mode="edit"
                returnContext={returnContext}
              />
            </div>
            <section className="flex flex-wrap gap-2 rounded-lg border bg-card p-3 sm:p-4">
              {listing.status === "draft" && (
                <form action={transitionListingAction}>
                  <input name="listingId" type="hidden" value={listing.id} />
                  <ListingReturnContextInput returnContext={returnContext} />
                  <input name="toStatus" type="hidden" value="pending_review" />
                  <Button type="submit">Изпрати за преглед</Button>
                </form>
              )}
              {listing.status === "pending_review" && (
                <p className="text-muted-foreground text-sm">
                  Обявата чака преглед от екипа на AutoMarket.
                </p>
              )}
              {listing.status === "active" && (
                <>
                  <form action={transitionListingAction}>
                    <input name="listingId" type="hidden" value={listing.id} />
                    <ListingReturnContextInput returnContext={returnContext} />
                    <input name="toStatus" type="hidden" value="paused" />
                    <Button type="submit" variant="secondary">
                      Пауза
                    </Button>
                  </form>
                  <form action={transitionListingAction}>
                    <input name="listingId" type="hidden" value={listing.id} />
                    <ListingReturnContextInput returnContext={returnContext} />
                    <input name="toStatus" type="hidden" value="sold" />
                    <Button type="submit">Маркирай като продадена</Button>
                  </form>
                </>
              )}
              {listing.status === "paused" && (
                <form action={transitionListingAction}>
                  <input name="listingId" type="hidden" value={listing.id} />
                  <ListingReturnContextInput returnContext={returnContext} />
                  <input name="toStatus" type="hidden" value="active" />
                  <Button type="submit">Възобнови обявата</Button>
                </form>
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
};

export default EditListingPage;
