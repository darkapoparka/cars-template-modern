import { OrganizationSwitcher } from "@repo/auth/client";
import { auth, currentUser } from "@repo/auth/server";
import {
  getOrganizationProfileClaimContext,
  listClaimantOrganizations,
} from "@repo/database/organization-profile-claims";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@repo/design-system/components/ui/alert";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { getDealerPublicProfileEditorPath } from "@repo/marketplace";
import {
  Building2Icon,
  CheckCircle2Icon,
  Clock3Icon,
  FileCheck2Icon,
  ShieldAlertIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "../../../../components/header";
import {
  onboardOrganizationAndClaimAction,
  submitExistingOrganizationClaimAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Заявяване на дилърски профил",
  description: "Заявете управление на публичен профил в AutoMarket.",
};

interface PageProps {
  readonly params: Promise<{ slug: string }>;
  readonly searchParams: Promise<{ state?: string }>;
}

const notices: Readonly<Record<string, { detail: string; title: string }>> = {
  claim_conflict: {
    detail:
      "Профилът или заявката са променени. Прегледайте актуалното състояние и опитайте отново.",
    title: "Заявката не е записана",
  },
  claim_failed: {
    detail:
      "Не успяхме да потвърдим правата ви в избраната организация. Няма записана заявка.",
    title: "Няма достъп до организацията",
  },
  claim_submitted: {
    detail:
      "Получихме доказателствата. Екипът на AutoMarket ще прегледа собствеността; това все още не е фирмена верификация.",
    title: "Заявката е изпратена",
  },
  invalid_claim: {
    detail: "Проверете организацията и доказателствата. Няма записана заявка.",
    title: "Непълни данни",
  },
  invalid_onboarding: {
    detail: "Проверете данните за организацията и доказателствата.",
    title: "Непълна регистрация",
  },
  onboarding_failed: {
    detail:
      "Организацията не беше създадена докрай. Можете безопасно да опитате отново със същия профил.",
    title: "Регистрацията не завърши",
  },
};

const statusContent = {
  approved: {
    detail:
      "Собствеността върху профила е одобрена. Активирайте организацията си в Clerk, за да отворите редактора в Dealer Studio. Фирмената проверка остава отделен процес.",
    title: "Профилът е свързан",
  },
  in_review: {
    detail:
      "Рецензент разглежда предоставените доказателства. До решение публичният профил не показва потвърдена собственост.",
    title: "Заявката се разглежда",
  },
  pending: {
    detail:
      "Заявката чака преглед. Това състояние не означава одобрение или фирмена верификация.",
    title: "Заявката е получена",
  },
  rejected: {
    detail:
      "Предоставените доказателства не бяха достатъчни. Можете да изпратите нова заявка с актуални данни.",
    title: "Заявката не е одобрена",
  },
  withdrawn: {
    detail: "Заявката е оттеглена. Можете да започнете отново.",
    title: "Заявката е оттеглена",
  },
} as const;

const EvidenceFields = ({
  defaultEmail,
  idPrefix,
}: {
  readonly defaultEmail?: string;
  readonly idPrefix: string;
}) => (
  <>
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-authorityRole`}>Вашата роля</Label>
        <Input
          id={`${idPrefix}-authorityRole`}
          name="authorityRole"
          placeholder="Собственик, управител, маркетинг директор"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-businessEmail`}>Служебен имейл</Label>
        <Input
          defaultValue={defaultEmail}
          id={`${idPrefix}-businessEmail`}
          name="businessEmail"
          placeholder="name@company.bg"
          type="email"
        />
      </div>
    </div>
    <div className="space-y-2">
      <Label htmlFor={`${idPrefix}-evidenceKind`}>Основно доказателство</Label>
      <select
        className="h-9 w-full rounded-md border bg-control px-3 text-sm"
        defaultValue="business_email"
        id={`${idPrefix}-evidenceKind`}
        name="evidenceKind"
      >
        <option value="business_email">Служебен имейл и роля</option>
        <option value="registry_record">Фирмен или търговски регистър</option>
        <option value="website_control">Управление на официалния сайт</option>
        <option value="other">Друго проверимо доказателство</option>
      </select>
    </div>
    <div className="space-y-2">
      <Label htmlFor={`${idPrefix}-evidenceUrl`}>
        Линк към публично доказателство
      </Label>
      <Input
        id={`${idPrefix}-evidenceUrl`}
        name="evidenceUrl"
        placeholder="https://..."
        type="url"
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor={`${idPrefix}-evidenceSummary`}>
        Как можем да проверим собствеността?
      </Label>
      <Textarea
        id={`${idPrefix}-evidenceSummary`}
        name="evidenceSummary"
        placeholder="Опишете връзката си с фирмата, регистрационни данни или кой може да потвърди заявката."
        required
        rows={5}
      />
      <p className="text-muted-foreground text-xs">
        Не качвайте лични документи тук. Данните са частни и се виждат само от
        оторизирани рецензенти.
      </p>
    </div>
  </>
);

type ClaimContext = NonNullable<
  Awaited<ReturnType<typeof getOrganizationProfileClaimContext>>
>;
type ClaimOrganizations = Awaited<ReturnType<typeof listClaimantOrganizations>>;
type ClaimStatusContent = (typeof statusContent)[keyof typeof statusContent];

const ClaimStatusPanel = ({
  context,
  content,
}: {
  readonly context: ClaimContext;
  readonly content: ClaimStatusContent;
}) => (
  <section className="rounded-lg border bg-card p-5">
    <div className="flex items-start gap-3">
      {context.claim?.status === "approved" ? (
        <CheckCircle2Icon className="mt-0.5 size-5" />
      ) : (
        <Clock3Icon className="mt-0.5 size-5" />
      )}
      <div>
        <h2 className="font-semibold">{content.title}</h2>
        <p className="mt-1 text-muted-foreground text-sm leading-6">
          {content.detail}
        </p>
        <p className="mt-3 text-xs">
          Организация: {context.claim?.claimantDealerOrg.displayName}
        </p>
      </div>
    </div>
    {context.claim?.status === "approved" ? (
      <div className="mt-5 rounded-lg bg-secondary p-4">
        <p className="mb-3 font-medium text-sm">Активна организация</p>
        <OrganizationSwitcher
          afterSelectOrganizationUrl={getDealerPublicProfileEditorPath()}
          hidePersonal
        />
      </div>
    ) : null}
  </section>
);

const ClaimForms = ({
  context,
  defaultEmail,
  organizations,
  requestSuffix,
  slug,
}: {
  readonly context: ClaimContext;
  readonly defaultEmail?: string;
  readonly organizations: ClaimOrganizations;
  readonly requestSuffix: string;
  readonly slug: string;
}) => (
  <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,.8fr)]">
    {organizations.length > 0 ? (
      <section className="rounded-lg border bg-card">
        <div className="border-b p-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <FileCheck2Icon className="size-4" />
            Заявка от съществуваща организация
          </h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Изберете Clerk организация, в която сте активен собственик или
            управител.
          </p>
        </div>
        <form
          action={submitExistingOrganizationClaimAction}
          className="space-y-4 p-4"
        >
          <input name="directorySlug" type="hidden" value={slug} />
          <input
            name="requestKey"
            type="hidden"
            value={`claim:${slug}:${requestSuffix}`}
          />
          <div className="space-y-2">
            <Label htmlFor="dealerOrgId">Организация</Label>
            <select
              className="h-9 w-full rounded-md border bg-control px-3 text-sm"
              id="dealerOrgId"
              name="dealerOrgId"
              required
            >
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.displayName} · {organization.role}
                </option>
              ))}
            </select>
          </div>
          <EvidenceFields defaultEmail={defaultEmail} idPrefix="existing" />
          <div className="flex justify-end">
            <Button type="submit">Изпрати за преглед</Button>
          </div>
        </form>
      </section>
    ) : null}

    <section className="rounded-lg border bg-card">
      <div className="border-b p-4">
        <h2 className="font-semibold">
          {organizations.length > 0
            ? "Нова организация"
            : "Създайте Dealer Studio организация"}
        </h2>
        <p className="mt-1 text-muted-foreground text-sm">
          Създаваме Clerk Organization и отделен постоянен DealerOrg запис.
          Организацията започва непроверена.
        </p>
      </div>
      <form
        action={onboardOrganizationAndClaimAction}
        className="space-y-4 p-4"
      >
        <input name="directorySlug" type="hidden" value={slug} />
        <input name="requestKey" type="hidden" value={`onboard:${slug}`} />
        <div className="space-y-2">
          <Label htmlFor="dealerDisplayName">Име на организацията</Label>
          <Input
            defaultValue={context.entry.displayName}
            id="dealerDisplayName"
            name="dealerDisplayName"
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="space-y-2">
            <Label htmlFor="orgType">Тип</Label>
            <select
              className="h-9 w-full rounded-md border bg-control px-3 text-sm"
              defaultValue={context.entry.orgType}
              id="orgType"
              name="orgType"
            >
              <option value="dealer">Дилър</option>
              <option value="importer">Вносител</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="countryCode">Държава (ISO-2)</Label>
            <Input
              defaultValue="BG"
              id="countryCode"
              maxLength={2}
              name="countryCode"
              required
            />
          </div>
        </div>
        <EvidenceFields defaultEmail={defaultEmail} idPrefix="new" />
        <div className="flex justify-end">
          <Button type="submit">Създай и изпрати заявка</Button>
        </div>
      </form>
    </section>
  </div>
);

const ClaimPage = async ({ params, searchParams }: PageProps) => {
  const session = await auth();
  if (!session.userId) {
    return session.redirectToSignIn();
  }
  const [{ slug }, query, user] = await Promise.all([
    params,
    searchParams,
    currentUser(),
  ]);
  const [context, organizations] = await Promise.all([
    getOrganizationProfileClaimContext({
      clerkUserId: session.userId,
      directorySlug: slug,
    }),
    listClaimantOrganizations(session.userId),
  ]);
  if (!context) {
    notFound();
  }

  const notice = query.state ? notices[query.state] : undefined;
  const claimState = context.claim ? statusContent[context.claim.status] : null;
  const canRetry =
    !context.claim ||
    context.claim.status === "rejected" ||
    context.claim.status === "withdrawn";
  const requestSuffix = context.claim?.id ?? "initial";
  const defaultEmail = user?.primaryEmailAddress?.emailAddress;

  return (
    <>
      <Header
        page="Заявяване на профил"
        pages={["AutoMarket", "Dealer Studio"]}
      />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-3 sm:p-4 lg:p-6">
        <section className="rounded-lg border bg-card p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary">
              <Building2Icon className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="break-words font-semibold text-xl">
                  {context.entry.displayName}
                </h1>
                <Badge variant="outline">{context.entry.orgType}</Badge>
              </div>
              <p className="mt-1 text-muted-foreground text-sm leading-6">
                Заявете право да управлявате този публичен профил. Одобрението
                потвърждава само връзката с профила — не KYB, официално
                представителство или статут на доверен доставчик.
              </p>
            </div>
          </div>
        </section>

        {notice ? (
          <Alert
            variant={
              query.state === "claim_submitted" ? "default" : "destructive"
            }
          >
            {query.state === "claim_submitted" ? (
              <CheckCircle2Icon />
            ) : (
              <ShieldAlertIcon />
            )}
            <AlertTitle>{notice.title}</AlertTitle>
            <AlertDescription>{notice.detail}</AlertDescription>
          </Alert>
        ) : null}

        {claimState && !canRetry ? (
          <ClaimStatusPanel content={claimState} context={context} />
        ) : null}
        {(!claimState || canRetry) &&
        context.entry.claimStatus !== "unclaimed" ? (
          <Alert>
            <Clock3Icon />
            <AlertTitle>Профилът вече се разглежда</AlertTitle>
            <AlertDescription>
              Има активна заявка за този профил. Нова заявка не може да бъде
              подадена преди решение.
            </AlertDescription>
          </Alert>
        ) : null}
        {(!claimState || canRetry) &&
        context.entry.claimStatus === "unclaimed" ? (
          <ClaimForms
            context={context}
            defaultEmail={defaultEmail}
            organizations={organizations}
            requestSuffix={requestSuffix}
            slug={slug}
          />
        ) : null}
      </main>
    </>
  );
};

export default ClaimPage;
