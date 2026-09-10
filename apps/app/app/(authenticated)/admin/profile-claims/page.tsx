import { listOrganizationProfileClaimReviewQueue } from "@repo/database/organization-profile-claims";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Building2Icon, FileCheck2Icon, ListChecksIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "../../components/header";
import { requireDirectoryAdminAuthorization } from "./authorization";

export const metadata: Metadata = {
  title: "Заявки за публични профили",
  description: "Преглед на доказателства за собственост върху профил.",
};

const ProfileClaimsPage = async () => {
  const authorization = await requireDirectoryAdminAuthorization();
  const claims = await listOrganizationProfileClaimReviewQueue({
    authorization,
    limit: 100,
  });

  return (
    <>
      <Header
        page="Заявки за профили"
        pages={["AutoMarket", "Администрация"]}
      />
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <section className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                Собственост на профил
              </p>
              <h1 className="mt-1 font-semibold text-lg">Заявки за преглед</h1>
              <p className="mt-1 text-muted-foreground text-sm">
                Одобрението свързва профила с организация. То не променя KYB,
                фирмена проверка или представителство на марки.
              </p>
            </div>
            <Badge variant="secondary">
              <ListChecksIcon className="size-3.5" /> {claims.length}
            </Badge>
          </div>
        </section>

        {claims.length === 0 ? (
          <section className="rounded-lg border bg-card p-8 text-center">
            <FileCheck2Icon className="mx-auto size-8 text-muted-foreground" />
            <h2 className="mt-3 font-semibold">Няма чакащи заявки</h2>
          </section>
        ) : (
          <section className="grid gap-3">
            {claims.map((claim) => (
              <article className="rounded-lg border bg-card p-4" key={claim.id}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary">
                      <Building2Icon className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold">
                        {claim.directoryEntry.displayName}
                      </h2>
                      <p className="truncate text-muted-foreground text-sm">
                        {claim.claimantDealerOrg.displayName}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge
                          variant={
                            claim.status === "in_review" ? "info" : "warning"
                          }
                        >
                          {claim.status === "in_review" ? "В преглед" : "Чака"}
                        </Badge>
                        <Badge variant="outline">{claim.evidenceKind}</Badge>
                        <Badge variant="outline">
                          Фирмена проверка:{" "}
                          {claim.claimantDealerOrg.verificationStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/admin/profile-claims/${claim.id}`}>
                      Прегледай
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </>
  );
};

export default ProfileClaimsPage;
