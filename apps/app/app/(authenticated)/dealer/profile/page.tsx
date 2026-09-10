import { getDealerStudioPublicProfile } from "@repo/database/organization-profile";
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
import {
  getDealerPublicProfilePreviewPath,
  organizationImportServiceKinds,
} from "@repo/marketplace";
import { EyeIcon, ImageIcon, SaveIcon, ShieldAlertIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "../../components/header";
import { requireDealerOrganizationActor } from "../actor";
import { saveDealerPublicProfileDraftAction } from "./actions";
import { ProfileImageFields } from "./profile-image-fields";

export const metadata: Metadata = {
  title: "Публичен профил",
  description: "Редакция и публикуване на дилърския профил.",
};

const serviceLabels = {
  customs: "Митническо обслужване",
  export_documents: "Експортни документи",
  finance: "Финансиране",
  inspection: "Инспекция",
  registration: "Регистрация",
  transport: "Транспорт",
  vehicle_sourcing: "Намиране на автомобил",
  warranty: "Гаранция",
} as const;

const notices: Readonly<Record<string, { detail: string; title: string }>> = {
  draft_saved: {
    detail:
      "Промените са записани като частна чернова. Публичният профил още не е променен.",
    title: "Черновата е записана",
  },
  invalid_profile: {
    detail: "Проверете полетата, HTTPS адресите и маршрутите във формат DE>BG.",
    title: "Невалидни данни",
  },
  profile_conflict: {
    detail:
      "Черновата е променена в друга сесия. Презаредете страницата преди нов запис.",
    title: "Конфликт на версията",
  },
  profile_published: {
    detail:
      "Публичният профил е обновен. Статусите за собственост и фирмена проверка не са променени.",
    title: "Профилът е публикуван",
  },
  profile_save_failed: {
    detail: "Черновата не беше записана. Публичният профил не е променен.",
    title: "Записът не успя",
  },
};

const ProfilePage = async ({
  searchParams,
}: {
  readonly searchParams: Promise<{ state?: string }>;
}) => {
  const actor = await requireDealerOrganizationActor();
  const [data, query] = await Promise.all([
    getDealerStudioPublicProfile(actor),
    searchParams,
  ]);
  const notice = query.state ? notices[query.state] : undefined;

  if (!data) {
    return (
      <>
        <Header page="Публичен профил" pages={["AutoMarket", "Дилър"]} />
        <main className="p-4 md:p-6">
          <Alert>
            <ShieldAlertIcon />
            <AlertTitle>Няма свързан публичен профил</AlertTitle>
            <AlertDescription>
              Редакторът се активира след одобрена заявка за съществуващ профил.
            </AlertDescription>
          </Alert>
        </main>
      </>
    );
  }

  const profile = data.draft?.profile ?? data.publishedProfile;
  const routes = profile.tradeLanes
    .map(
      ({ destinationCountryCode, originCountryCode }) =>
        `${originCountryCode}>${destinationCountryCode}`
    )
    .join("\n");

  return (
    <>
      <Header page="Публичен профил" pages={["AutoMarket", "Дилър"]}>
        <Button asChild className="mr-3" size="sm" variant="secondary">
          <Link href={getDealerPublicProfilePreviewPath()}>
            <EyeIcon className="size-4" /> Преглед
          </Link>
        </Button>
      </Header>
      <main className="flex flex-1 flex-col gap-4 p-3 sm:p-4 lg:p-6">
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
              <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                Публична проекция
              </p>
              <h1 className="mt-1 font-semibold text-lg">
                {profile.displayName}
              </h1>
              <p className="mt-1 text-muted-foreground text-sm">
                Записът създава частна чернова. Само „Публикувай“ заменя видимия
                профил.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{data.publicStatus}</Badge>
              <Badge variant={data.draft ? "warning" : "secondary"}>
                {data.draft ? `Чернова v${data.draft.version}` : "Няма чернова"}
              </Badge>
            </div>
          </div>
        </section>

        <form
          action={saveDealerPublicProfileDraftAction}
          className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,.75fr)]"
        >
          {data.draft ? (
            <input
              name="expectedVersion"
              type="hidden"
              value={data.draft.version}
            />
          ) : null}
          <div className="space-y-4">
            <section className="rounded-lg border bg-card">
              <div className="border-b p-4">
                <h2 className="font-semibold">Основна информация</h2>
              </div>
              <div className="grid gap-4 p-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="displayName">Име за показване</Label>
                  <Input
                    defaultValue={profile.displayName}
                    disabled={!data.canManage}
                    id="displayName"
                    name="displayName"
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="headline">Кратко заглавие</Label>
                  <Input
                    defaultValue={profile.headline}
                    disabled={!data.canManage}
                    id="headline"
                    name="headline"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    defaultValue={profile.description}
                    disabled={!data.canManage}
                    id="description"
                    name="description"
                    rows={7}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-lg border bg-card">
              <div className="border-b p-4">
                <h2 className="font-semibold">Контакти и централа</h2>
              </div>
              <div className="grid gap-4 p-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон</Label>
                  <Input
                    defaultValue={profile.contact.phone}
                    disabled={!data.canManage}
                    id="phone"
                    name="phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Имейл</Label>
                  <Input
                    defaultValue={profile.contact.email}
                    disabled={!data.canManage}
                    id="email"
                    name="email"
                    type="email"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="websiteUrl">Уебсайт</Label>
                  <Input
                    defaultValue={profile.contact.websiteUrl}
                    disabled={!data.canManage}
                    id="websiteUrl"
                    name="websiteUrl"
                    placeholder="https://"
                    type="url"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="countryCode">Държава (ISO-2)</Label>
                  <Input
                    defaultValue={profile.headquarters.countryCode}
                    disabled={!data.canManage}
                    id="countryCode"
                    maxLength={2}
                    name="countryCode"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Град</Label>
                  <Input
                    defaultValue={profile.headquarters.city}
                    disabled={!data.canManage}
                    id="city"
                    name="city"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="region">Регион</Label>
                  <Input
                    defaultValue={profile.headquarters.region}
                    disabled={!data.canManage}
                    id="region"
                    name="region"
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <section className="rounded-lg border bg-card">
              <div className="border-b p-4">
                <h2 className="flex items-center gap-2 font-semibold">
                  <ImageIcon className="size-4" /> Изображения
                </h2>
                <p className="mt-1 text-muted-foreground text-xs">
                  Качете файл през публичното хранилище или използвайте HTTPS
                  адрес. Новото изображение влиза в частната чернова.
                </p>
              </div>
              <ProfileImageFields
                canManage={data.canManage}
                defaultLogoUrl={profile.logoUrl}
                defaultProfileImageUrl={profile.profileImageUrl}
                directorySlug={data.slug}
                storageConfigured={Boolean(
                  process.env.BLOB_READ_WRITE_TOKEN?.trim()
                )}
              />
            </section>

            <section className="rounded-lg border bg-card">
              <div className="border-b p-4">
                <h2 className="font-semibold">Марки и услуги</h2>
              </div>
              <div className="space-y-4 p-4">
                <div className="space-y-2">
                  <Label htmlFor="brandNames">Марки</Label>
                  <Textarea
                    defaultValue={profile.brandNames.join(", ")}
                    disabled={!data.canManage}
                    id="brandNames"
                    name="brandNames"
                    placeholder="BMW, Audi, Volvo"
                    rows={3}
                  />
                  <p className="text-muted-foreground text-xs">
                    Маркира се като декларирано покритие, не като официално
                    представителство.
                  </p>
                </div>
                <fieldset className="space-y-2" disabled={!data.canManage}>
                  <legend className="font-medium text-sm">Услуги</legend>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                    {organizationImportServiceKinds.map((service) => (
                      <label
                        className="flex items-center gap-2 rounded-md bg-control px-3 py-2 text-sm"
                        key={service}
                      >
                        <input
                          defaultChecked={profile.services.includes(service)}
                          name="services"
                          type="checkbox"
                          value={service}
                        />
                        {serviceLabels[service]}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="space-y-2">
                  <Label htmlFor="tradeLanes">Маршрути за внос</Label>
                  <Textarea
                    defaultValue={routes}
                    disabled={!data.canManage}
                    id="tradeLanes"
                    name="tradeLanes"
                    placeholder={"DE>BG\nIT>BG"}
                    rows={4}
                  />
                  <p className="text-muted-foreground text-xs">
                    Един маршрут на ред във формат DE&gt;BG. Избраните услуги се
                    прилагат към маршрутите.
                  </p>
                </div>
              </div>
            </section>

            <Button className="w-full" disabled={!data.canManage} type="submit">
              <SaveIcon className="size-4" /> Запази чернова
            </Button>
          </div>
        </form>
      </main>
    </>
  );
};

export default ProfilePage;
