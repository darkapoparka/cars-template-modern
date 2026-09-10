import { Badge } from "@repo/design-system/components/ui/badge";
import { Card } from "@repo/design-system/components/ui/card";
import type { OrganizationDirectoryProfileInput } from "@repo/marketplace";
import {
  ArrowRightIcon,
  Building2Icon,
  GlobeIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  ShipIcon,
} from "lucide-react";
import Image from "next/image";

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

interface PublicProfilePreviewProps {
  readonly profile: OrganizationDirectoryProfileInput;
}

export const PublicProfilePreview = ({
  profile,
}: PublicProfilePreviewProps) => {
  const location = [
    profile.headquarters.city,
    profile.headquarters.region,
    profile.headquarters.countryCode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="grid lg:grid-cols-[15rem_minmax(0,1fr)]">
          <div className="relative min-h-40 overflow-hidden bg-control lg:min-h-full">
            {profile.profileImageUrl ? (
              <Image
                alt={profile.displayName}
                className="object-cover"
                fill
                sizes="(min-width: 1024px) 240px, 100vw"
                src={profile.profileImageUrl}
                unoptimized
              />
            ) : (
              <div className="grid h-full min-h-40 place-items-center text-muted-foreground">
                <Building2Icon className="size-10" />
              </div>
            )}
            <div className="absolute bottom-4 left-4 grid size-14 place-items-center overflow-hidden rounded-xl bg-card shadow-md ring-1 ring-black/5">
              {profile.logoUrl ? (
                <Image
                  alt={`${profile.displayName} – лого`}
                  className="object-contain p-1.5"
                  fill
                  sizes="56px"
                  src={profile.logoUrl}
                  unoptimized
                />
              ) : (
                <Building2Icon className="size-6 text-muted-foreground" />
              )}
            </div>
          </div>
          <div className="min-w-0 p-5 sm:p-6">
            <Badge variant="outline">Публичен преглед</Badge>
            <h1 className="mt-3 break-words font-semibold text-2xl tracking-tight sm:text-3xl">
              {profile.displayName}
            </h1>
            {profile.headline ? (
              <p className="mt-1 text-foreground/80 text-sm">
                {profile.headline}
              </p>
            ) : null}
            {location ? (
              <p className="mt-2 flex items-center gap-2 text-muted-foreground text-sm">
                <MapPinIcon className="size-4" />
                {location}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              {profile.contact.phone ? (
                <Badge variant="secondary">
                  <PhoneIcon className="size-3.5" /> {profile.contact.phone}
                </Badge>
              ) : null}
              {profile.contact.email ? (
                <Badge variant="secondary">
                  <MailIcon className="size-3.5" /> {profile.contact.email}
                </Badge>
              ) : null}
              {profile.contact.websiteUrl ? (
                <Badge variant="secondary">
                  <GlobeIcon className="size-3.5" /> Уебсайт
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,.6fr)]">
        <div className="space-y-4">
          {profile.description ? (
            <Card className="gap-2 p-5">
              <h2 className="font-semibold">За организацията</h2>
              <p className="whitespace-pre-line text-muted-foreground text-sm leading-6">
                {profile.description}
              </p>
            </Card>
          ) : null}
          {profile.tradeLanes.length > 0 ? (
            <Card className="gap-3 p-5">
              <h2 className="flex items-center gap-2 font-semibold">
                <ShipIcon className="size-4" /> Маршрути за внос
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {profile.tradeLanes.map((lane) => (
                  <div
                    className="rounded-lg bg-secondary p-3 text-sm"
                    key={`${lane.originCountryCode}-${lane.destinationCountryCode}`}
                  >
                    <p className="flex items-center gap-2 font-medium">
                      {lane.originCountryCode}
                      <ArrowRightIcon className="size-4 text-muted-foreground" />
                      {lane.destinationCountryCode}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
        <aside className="space-y-4">
          {profile.brandNames.length > 0 ? (
            <Card className="gap-3 p-5">
              <h2 className="font-semibold">Марки</h2>
              <div className="flex flex-wrap gap-2">
                {profile.brandNames.map((brand) => (
                  <Badge key={brand} variant="secondary">
                    {brand}
                  </Badge>
                ))}
              </div>
              <p className="text-muted-foreground text-xs">
                Декларирано покритие; не означава потвърдено официално
                представителство.
              </p>
            </Card>
          ) : null}
          {profile.services.length > 0 ? (
            <Card className="gap-3 p-5">
              <h2 className="font-semibold">Услуги</h2>
              <div className="flex flex-wrap gap-2">
                {profile.services.map((service) => (
                  <Badge key={service} variant="secondary">
                    {serviceLabels[service]}
                  </Badge>
                ))}
              </div>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
};
