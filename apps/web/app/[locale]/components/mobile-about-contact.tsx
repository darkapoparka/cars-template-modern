import { leadSite } from "@repo/marketplace";
import { DealerMobileHeaderIcon } from "@repo/marketplace-ui/components/dealer-mobile-header-icon";
import { DealerSocialLinks } from "@repo/marketplace-ui/components/dealer-social-links";
import { DealerUiIcon } from "@repo/marketplace-ui/components/dealer-ui-icon";
import { mobileHeaderIconActionClassName } from "@repo/marketplace-ui/lib/mobile-header-icon-action";
import { getLocalizedPath } from "@repo/seo/metadata";
import { type LucideIcon, MapPin } from "lucide-react";
import Link from "next/link";
import { MobileDealerServiceHero } from "./mobile-dealer-service-hero";

const cardClassName =
  "flex items-center gap-3 rounded-2xl bg-card p-4 transition-colors hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-zinc-950 focus-visible:outline-offset-2 active:bg-zinc-200";

export function MobileAboutContact({
  locale,
  services,
}: {
  locale: "bg" | "en";
  services: readonly { title: string; href: string; icon: LucideIcon }[];
}) {
  const isBg = locale === "bg";
  return (
    <div
      className="min-h-[calc(100dvh-4rem)] bg-background lg:hidden"
      data-slot="mobile-about-contact"
    >
      <MobileDealerServiceHero
        helpAction={
          <a
            aria-label={isBg ? "Отвори местоположението" : "Open location"}
            className={mobileHeaderIconActionClassName}
            href={leadSite.mapsUrl}
            rel="noreferrer"
            target="_blank"
          >
            <DealerMobileHeaderIcon icon={MapPin} kind="location" />
          </a>
        }
        imageSrc=""
        locale={locale}
        tone="contact"
      >
        <h1 className="flex h-full items-center justify-center px-1 text-center font-semibold text-[26px] text-white leading-8 tracking-tight">
          {isBg ? "За нас и контакти" : "About and contact"}
        </h1>
      </MobileDealerServiceHero>
      <div className="relative -mt-3 rounded-t-2xl bg-background px-4 pt-4 pb-6">
        <div className="grid gap-2">
          <a className={cardClassName} href={leadSite.phoneHref}>
            <DealerUiIcon
              className="size-[22px] shrink-0 text-zinc-600"
              name="phone"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] text-zinc-600 leading-5">
                {isBg ? "Обадете ни се" : "Call us"}
              </span>
              <span className="mt-1 block font-semibold text-[21px] text-zinc-950 tabular-nums leading-7">
                {leadSite.phoneDisplay}
              </span>
            </span>
            <DealerUiIcon
              className="size-5 shrink-0 text-zinc-600"
              name="external"
            />
          </a>
          <a
            className={cardClassName}
            href={leadSite.mapsUrl}
            rel="noreferrer"
            target="_blank"
          >
            <DealerUiIcon
              className="size-[22px] shrink-0 text-zinc-600"
              name="location"
            />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-[16px] leading-6">
                {isBg ? "Посетете шоурума" : "Visit the showroom"}
              </span>
              <span className="mt-1 block text-[14px] text-zinc-600 leading-5">
                {leadSite.address}, {leadSite.city}
              </span>
            </span>
            <DealerUiIcon
              className="size-5 shrink-0 text-zinc-600"
              name="external"
            />
          </a>
        </div>
        <section className="mt-5">
          <h2 className="mb-3 font-semibold text-[18px] leading-6">
            {isBg ? "С какво можем да помогнем" : "How we can help"}
          </h2>
          <div className="grid gap-2">
            {services.map((service) => {
              const serviceIcons = {
                "/imports": "import",
                "/sell": "sell",
                "/lease": "lease",
              } as const;
              const iconName =
                serviceIcons[service.href as keyof typeof serviceIcons] ??
                "car";
              return (
                <Link
                  className={cardClassName}
                  href={getLocalizedPath(locale, service.href)}
                  key={service.href}
                >
                  <DealerUiIcon
                    className="size-[22px] shrink-0 text-zinc-600"
                    name={iconName}
                  />
                  <span className="min-w-0 flex-1 font-medium text-[15px] leading-6">
                    {service.title}
                  </span>
                  <DealerUiIcon
                    className="size-5 shrink-0 text-zinc-600"
                    name="chevronRight"
                  />
                </Link>
              );
            })}
          </div>
        </section>
        <DealerSocialLinks isBg={isBg} links={leadSite.socialLinks} />
      </div>
    </div>
  );
}
