import { getOrganizationProfileClaimForReview } from "@repo/database/organization-profile-claims";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@repo/design-system/components/ui/alert";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Label } from "@repo/design-system/components/ui/label";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  Clock3Icon,
  ShieldAlertIcon,
  XCircleIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "../../../components/header";
import { reviewProfileClaimAction } from "../actions";
import { requireDirectoryAdminAuthorization } from "../authorization";

export const metadata: Metadata = { title: "Преглед на заявка" };

const notices: Readonly<Record<string, { detail: string; title: string }>> = {
  claim_approved: {
    detail:
      "Профилът е свързан с организацията. Нито един verification статус не е променен.",
    title: "Собствеността е одобрена",
  },
  claim_rejected: {
    detail:
      "Заявката е отказана и публичният профил отново може да бъде заявен.",
    title: "Заявката е отказана",
  },
  invalid_review: {
    detail: "Изберете причина и проверете заявката.",
    title: "Невалидно решение",
  },
  review_conflict: {
    detail: "Друг рецензент или процес е променил заявката.",
    title: "Конфликт на версията",
  },
  review_failed: {
    detail: "Решението не беше записано.",
    title: "Прегледът не успя",
  },
  review_started: {
    detail: "Заявката е маркирана като активно разглеждана.",
    title: "Прегледът започна",
  },
};

const ClaimReviewPage = async ({
  params,
  searchParams,
}: {
  readonly params: Promise<{ claimId: string }>;
  readonly searchParams: Promise<{ state?: string }>;
}) => {
  const authorization = await requireDirectoryAdminAuthorization();
  const [{ claimId }, query] = await Promise.all([params, searchParams]);
  const claim = await getOrganizationProfileClaimForReview({
    authorization,
    claimId,
  });
  if (!claim) {
    notFound();
  }
  const notice = query.state ? notices[query.state] : undefined;
  const reviewable = claim.status === "pending" || claim.status === "in_review";

  return (
    <>
      <Header
        page="Преглед на заявка за профил"
        pages={["AutoMarket", "Администрация"]}
      >
        <Button asChild className="mr-3" size="sm" variant="secondary">
          <Link href="/admin/profile-claims">
            <ArrowLeftIcon className="size-4" /> Опашка
          </Link>
        </Button>
      </Header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        {notice ? (
          <Alert
            variant={
              query.state?.includes("failed") ||
              query.state?.includes("invalid") ||
              query.state?.includes("conflict")
                ? "destructive"
                : "default"
            }
          >
            <AlertTitle>{notice.title}</AlertTitle>
            <AlertDescription>{notice.detail}</AlertDescription>
          </Alert>
        ) : null}

        <section className="rounded-lg border bg-card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide">
                Публичен профил
              </p>
              <h1 className="mt-1 font-semibold text-xl">
                {claim.directoryEntry.displayName}
              </h1>
              <p className="mt-1 text-muted-foreground text-sm">
                Заявител: {claim.claimantDealerOrg.displayName}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{claim.status}</Badge>
              <Badge variant="outline">
                KYB: {claim.claimantDealerOrg.kybStatus}
              </Badge>
              <Badge variant="outline">
                Verification: {claim.claimantDealerOrg.verificationStatus}
              </Badge>
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,.8fr)]">
          <section className="rounded-lg border bg-card">
            <div className="border-b p-4">
              <h2 className="font-semibold">Предоставени доказателства</h2>
            </div>
            <dl className="grid gap-4 p-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground text-xs">Тип</dt>
                <dd className="mt-1 font-medium">{claim.evidenceKind}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Роля</dt>
                <dd className="mt-1 font-medium">{claim.authorityRole}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">
                  Служебен имейл
                </dt>
                <dd className="mt-1 break-all">
                  {claim.businessEmail ?? "Не е предоставен"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Публичен линк</dt>
                <dd className="mt-1 break-all">
                  {claim.evidenceUrl ?? "Не е предоставен"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground text-xs">Обяснение</dt>
                <dd className="mt-1 whitespace-pre-line leading-6">
                  {claim.evidenceSummary}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border bg-card">
            <div className="border-b p-4">
              <h2 className="font-semibold">Решение за собственост</h2>
              <p className="mt-1 text-muted-foreground text-xs">
                Това решение не е фирмена или бранд верификация.
              </p>
            </div>
            <div className="space-y-4 p-4">
              {claim.status === "pending" ? (
                <form action={reviewProfileClaimAction}>
                  <input name="action" type="hidden" value="start_review" />
                  <input name="claimId" type="hidden" value={claim.id} />
                  <input
                    name="expectedVersion"
                    type="hidden"
                    value={claim.version}
                  />
                  <Button className="w-full" type="submit" variant="secondary">
                    <Clock3Icon className="size-4" /> Започни преглед
                  </Button>
                </form>
              ) : null}

              {reviewable ? (
                <form action={reviewProfileClaimAction} className="space-y-3">
                  <input name="claimId" type="hidden" value={claim.id} />
                  <input
                    name="expectedVersion"
                    type="hidden"
                    value={claim.version}
                  />
                  <div className="space-y-2">
                    <Label htmlFor="reviewReasonCode">Причина</Label>
                    <select
                      className="h-9 w-full rounded-md border bg-control px-3 text-sm"
                      id="reviewReasonCode"
                      name="reviewReasonCode"
                      required
                    >
                      <option value="ownership_evidence_confirmed">
                        Собствеността е потвърдена
                      </option>
                      <option value="insufficient_evidence">
                        Недостатъчни доказателства
                      </option>
                      <option value="identity_mismatch">
                        Несъответствие на самоличност
                      </option>
                      <option value="organization_inactive">
                        Неактивна организация
                      </option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reviewNote">Бележка</Label>
                    <Textarea id="reviewNote" name="reviewNote" rows={4} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      name="action"
                      type="submit"
                      value="reject"
                      variant="destructive"
                    >
                      <XCircleIcon className="size-4" /> Откажи
                    </Button>
                    <Button name="action" type="submit" value="approve">
                      <CheckCircle2Icon className="size-4" /> Одобри
                    </Button>
                  </div>
                </form>
              ) : (
                <Alert>
                  <ShieldAlertIcon />
                  <AlertTitle>Решението е записано</AlertTitle>
                  <AlertDescription>
                    Тази версия не може да бъде преглеждана повторно.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
};

export default ClaimReviewPage;
