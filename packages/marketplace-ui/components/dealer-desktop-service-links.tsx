import {
  isPublicSitePathEnabled,
  publicSite,
} from "@repo/marketplace/site-config";
import { CarFront, HandCoins, Headphones, Tag } from "lucide-react";
import Link from "next/link";
import { getLocalizedPublicPath } from "../lib/public-path";
import styles from "./dealer-desktop-discovery.module.css";

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
            title: text("Всички автомобили", "Browse inventory"),
            detail: text("Цени и характеристики", "Prices and specifications"),
          },
          {
            path: "/sell",
            icon: Tag,
            title: text("Продай или замени", "Sell or trade"),
            detail: text("Свържете се с екипа", "Talk to the team"),
          },
          {
            path: "/lease",
            icon: HandCoins,
            title: text("Финансиране", "Financing options"),
            detail: text("Възможности за лизинг", "Explore vehicle leasing"),
          },
          {
            path: "/contact",
            icon: Headphones,
            title: text("Връзка с нас", "Here to help"),
            detail: publicSite.contact.phoneDisplay,
          },
        ];
  const enabled = items.filter((item) =>
    isPublicSitePathEnabled(item.path, publicSite)
  );
  return (
    <div className={styles.serviceLinks} data-placement={placement}>
      {enabled.map(({ path, icon: Icon, title, detail }) => (
        <Link href={getLocalizedPublicPath(locale, path)} key={path}>
          <Icon aria-hidden="true" size={27} strokeWidth={1.5} />
          <span>
            <strong>{title}</strong>
            <small>{detail}</small>
          </span>
        </Link>
      ))}
    </div>
  );
}
