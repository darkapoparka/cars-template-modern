import { getDealerStudioPublicProfile } from "@repo/database/organization-profile";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@repo/design-system/components/ui/alert";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { getDealerPublicProfileEditorPath } from "@repo/marketplace";
import { ArrowLeftIcon, SendIcon, ShieldAlertIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "../../../components/header";
import { requireDealerOrganizationActor } from "../../actor";
import { publishDealerPublicProfileAction } from "../actions";
import { PublicProfilePreview } from "../public-profile-preview";

export const metadata: Metadata = {
  title: "Преглед на публичен профил",
  description: "Частен преглед преди публикуване.",
};

const PreviewPage = async ({
  searchParams,
}: {
  readonly searchParams: Promise<{ state?: string }>;
}) => {
  const actor = await requireDealerOrganizationActor();
  const [data, query] = await Promise.all([
    getDealerStudioPublicProfile(actor),
    searchParams,
  ]);

  if (!data) {
    return (
      <main className="p-4">
        <Alert>
          <ShieldAlertIcon />
          <AlertTitle>Няма публичен профил</AlertTitle>
          <AlertDescription>Първо е нужна одобрена заявка.</AlertDescription>
        </Alert>
      </main>
    );
  }
  const profile = data.draft?.profile ?? data.publishedProfile;

  return (
    <>
      <Header page="Преглед на профила" pages={["AutoMarket", "Дилър"]}>
        <Button asChild size="sm" variant="secondary">
          <Link href={getDealerPublicProfileEditorPath()}>
            <ArrowLeftIcon className="size-4" /> Редактор
          </Link>
        </Button>
        {data.draft && data.canManage ? (
          <form action={publishDealerPublicProfileAction} className="mr-3">
            <input
              name="expectedDraftVersion"
              type="hidden"
              value={data.draft.version}
            />
            <Button size="sm" type="submit">
              <SendIcon className="size-4" /> Публикувай
            </Button>
          </form>
        ) : null}
      </Header>
      <main className="flex flex-1 flex-col gap-4 p-3 sm:p-4 lg:p-6">
        {query.state === "profile_conflict" ||
        query.state === "profile_publish_failed" ? (
          <Alert variant="destructive">
            <ShieldAlertIcon />
            <AlertTitle>Публикуването не успя</AlertTitle>
            <AlertDescription>
              Черновата или публичният профил са променени. Върнете се в
              редактора и прегледайте актуалната версия.
            </AlertDescription>
          </Alert>
        ) : null}
        <section className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-semibold">Частен публичен преглед</h1>
            <p className="mt-1 text-muted-foreground text-sm">
              Този екран е защитен от организацията. Публичният сайт се променя
              едва след публикуване.
            </p>
          </div>
          <Badge variant={data.draft ? "warning" : "secondary"}>
            {data.draft
              ? `Чернова v${data.draft.version}`
              : "Публикувана версия"}
          </Badge>
        </section>
        <PublicProfilePreview profile={profile} />
      </main>
    </>
  );
};

export default PreviewPage;
