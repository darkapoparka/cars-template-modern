import {
  isPublicSitePathEnabled,
  publicSite,
} from "@repo/marketplace/site-config";
import { ArrowUpRight, CarFront, HandCoins, Ship, Tag } from "lucide-react";
import Link from "next/link";
import { getLocalizedPublicPath } from "../lib/public-path";
import styles from "./dealer-desktop-discovery.module.css";
import Image from "./public-image";

const serviceArtwork: Record<string, string> = {
  "/cars?sort=newest":
    publicSite.artwork.desktopServices?.browse ??
    publicSite.artwork.financePromotion,
  "/sell":
    publicSite.artwork.desktopServices?.sell ?? publicSite.artwork.sellHero,
  "/lease":
    publicSite.artwork.desktopServices?.finance ??
    publicSite.artwork.financePromotion,
  "/imports":
    publicSite.artwork.desktopServices?.imports ??
    publicSite.artwork.importHero,
};
const serviceActions: Record<string, { bg: string; en: string }> = {
  "/cars?sort=newest": { bg: "Виж автомобилите", en: "Explore cars" },
  "/sell": { bg: "Свържете се с нас", en: "Get in touch" },
  "/lease": { bg: "Изчисли вноската", en: "Calculate payments" },
  "/imports": { bg: "Разгледай вноса", en: "Explore imports" },
};

/** Capability links, not invented certification, pricing or review claims. */
export function DealerDesktopServiceLinks({
  locale,
  placement,
}: {
  locale?: string;
  placement: "hero" | "inventory";
}) {
  const isBg = locale?.startsWith("bg") ?? false;
  const text = (bg: string, en: string) => (isBg ? bg : en);
  const items =
    placement === "hero"
      ? [
          {
            path: "/cars?sort=newest",
            icon: CarFront,
            title: text("Налични автомобили", "Available vehicles"),
            detail: text("Цени и характеристики", "Prices and specifications"),
          },
          {
            path: "/lease",
            icon: HandCoins,
            title: text("Финансиране", "Vehicle financing"),
            detail: text("Разгледайте възможностите", "Explore the options"),
          },
          {
            path: "/sell",
            icon: Tag,
            title: text("Продайте автомобил", "Sell or trade in"),
            detail: text("Изпратете запитване", "Request a valuation"),
          },
        ]
      : [
          {
            path: "/cars?sort=newest",
            icon: CarFront,
            title: text("Разгледайте автомобили", "Browse Cars"),
            detail: text(
              "Открийте автомобил за вашия бюджет и начин на живот.",
              "Find the car that fits your lifestyle and budget."
            ),
          },
          {
            path: "/sell",
            icon: Tag,
            title: text("Продайте автомобила си", "Sell Your Car"),
            detail: text(
              "Обсъдете продажба или замяна с нашия екип.",
              "Talk to our team about selling or part exchange."
            ),
          },
          {
            path: "/imports",
            icon: Ship,
            title: text("Внос на автомобил", "Import a Car"),
            detail: text(
              "Намерете и внесете автомобил по ваш избор.",
              "Explore the options for importing your next car."
            ),
          },
          {
            path: "/lease",
            icon: HandCoins,
            title: text("Планирайте бюджета си", "Plan Your Budget"),
            detail: text(
              "Изчислете ориентировъчна месечна вноска.",
              "Estimate a monthly payment before your next step."
            ),
          },
        ];
  const enabled = items.filter((item) =>
    isPublicSitePathEnabled(item.path, publicSite)
  );
  return (
    <div className={styles.serviceLinks} data-placement={placement}>
      {enabled.map(({ path, icon: Icon, title, detail }, index) => (
        <Link
          data-tone={index % 2 === 1 ? "quiet" : "default"}
          href={getLocalizedPublicPath(locale, path)}
          key={path}
        >
          {placement === "hero" && (
            <Icon
              aria-hidden="true"
              className="size-[var(--desktop-service-icon-size)] [stroke-width:var(--desktop-service-icon-stroke)]"
            />
          )}
          <span>
            <strong>{title}</strong>
            <small>{detail}</small>
          </span>
          {placement === "inventory" && (
            <>
              <Image
                alt=""
                className={styles.serviceArt}
                height={180}
                loading="lazy"
                sizes="260px"
                src={
                  serviceArtwork[path] ?? publicSite.artwork.financePromotion
                }
                width={360}
              />
              <span className={styles.serviceArrow}>
                {text(
                  serviceActions[path]?.bg ?? title,
                  serviceActions[path]?.en ?? title
                )}
                <ArrowUpRight aria-hidden size={18} />
              </span>
            </>
          )}
        </Link>
      ))}
    </div>
  );
}
