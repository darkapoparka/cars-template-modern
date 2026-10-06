"use client";

import {
  DealerMobileBrandBar,
  getMobileQuickPillClassName,
  MobileDealerChrome,
} from "@repo/marketplace-ui";
import { DealerDesktopHero } from "@repo/marketplace-ui/components/dealer-desktop-hero";
import { MobilePillRail } from "@repo/marketplace-ui/components/mobile-pill-rail";
import { Search, X } from "lucide-react";
import {
  type FocusEvent,
  type ReactNode,
  useId,
  useRef,
  useState,
} from "react";
import styles from "./services.module.css";

const whitespace = /\s+/;

interface ServiceOption {
  card: ReactNode;
  description: string;
  href: string;
  label: string;
  title: string;
}

function ServiceSearch({
  bg,
  mobile = false,
  onClear,
  onQueryChange,
  query,
  selected,
}: {
  bg: boolean;
  mobile?: boolean;
  onClear: () => void;
  onQueryChange: (value: string) => void;
  query: string;
  selected: string | null;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const searchLabel = bg ? "Търсене на услуги" : "Search services";
  const desktopPlaceholder = bg ? "Как можем да помогнем?" : "How can we help?";
  return (
    <search
      aria-label={searchLabel}
      className={styles.search}
      data-slot="dealer-service-search"
    >
      <Search aria-hidden className={styles.searchIcon} size={22} />
      <label className="sr-only" htmlFor={inputId}>
        {searchLabel}
      </label>
      <input
        aria-controls="dealer-services"
        autoComplete="off"
        id={inputId}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={mobile ? searchLabel : desktopPlaceholder}
        ref={inputRef}
        type="search"
        value={query}
      />
      {(query || selected) && (
        <button
          aria-label={
            bg ? "Изчисти търсенето и филтрите" : "Clear search and filters"
          }
          className={styles.clearSearch}
          onClick={() => {
            onClear();
            inputRef.current?.focus();
          }}
          type="button"
        >
          <X aria-hidden size={20} />
        </button>
      )}
    </search>
  );
}

function ServicePills({
  bg,
  mobile = false,
  onSelect,
  selected,
  services,
}: {
  bg: boolean;
  mobile?: boolean;
  onSelect: (href: string | null) => void;
  selected: string | null;
  services: ServiceOption[];
}) {
  const revealPill = mobile
    ? (event: FocusEvent<HTMLButtonElement>) =>
        event.currentTarget.scrollIntoView({
          block: "nearest",
          inline: "nearest",
        })
    : undefined;
  const pills = (
    <>
      <button
        aria-pressed={selected === null}
        className={
          mobile ? getMobileQuickPillClassName(selected === null) : undefined
        }
        onClick={() => onSelect(null)}
        onFocus={revealPill}
        type="button"
      >
        {bg ? "Всички" : "All"}
      </button>
      {services.map((service) => (
        <button
          aria-pressed={selected === service.href}
          className={
            mobile
              ? getMobileQuickPillClassName(selected === service.href)
              : undefined
          }
          key={service.href}
          onClick={() =>
            onSelect(selected === service.href ? null : service.href)
          }
          onFocus={revealPill}
          type="button"
        >
          {service.label}
        </button>
      ))}
    </>
  );
  return mobile ? (
    <MobilePillRail
      className="items-center gap-2"
      data-slot="mobile-service-quick-rail"
      label={bg ? "Вид услуга" : "Service type"}
    >
      {pills}
    </MobilePillRail>
  ) : (
    <fieldset
      aria-label={bg ? "Вид услуга" : "Service type"}
      className={styles.pills}
    >
      {pills}
    </fieldset>
  );
}

export function ServiceCatalogue({
  artwork,
  locale,
  services,
  title,
}: {
  artwork?: string;
  locale: "bg" | "en";
  services: ServiceOption[];
  title: string;
}) {
  const bg = locale === "bg";
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const terms = query
    .trim()
    .toLocaleLowerCase(locale)
    .split(whitespace)
    .filter(Boolean);
  const matches = services.filter((service) => {
    const text =
      `${service.title} ${service.description} ${service.label}`.toLocaleLowerCase(
        locale
      );
    return (
      (!selected || service.href === selected) &&
      terms.every((term) => text.includes(term))
    );
  });
  const clear = () => {
    setQuery("");
    setSelected(null);
  };
  const searchProps = {
    bg,
    onClear: clear,
    onQueryChange: setQuery,
    query,
    selected,
  };
  const pillProps = { bg, onSelect: setSelected, selected, services };
  return (
    <>
      <DealerDesktopHero
        appearance="neutral"
        artwork={artwork}
        controls={
          <div className={styles.discovery}>
            <ServiceSearch {...searchProps} />
            <ServicePills {...pillProps} />
          </div>
        }
        locale={locale}
        title={title}
      />
      <header
        className={styles.mobileHeader}
        data-slot="mobile-services-header"
      >
        <MobileDealerChrome
          brandRow={
            <DealerMobileBrandBar isBg={bg} locale={locale} tone="dark" />
          }
          title={title}
        >
          <ServiceSearch {...searchProps} mobile />
        </MobileDealerChrome>
      </header>
      <main className={styles.page}>
        <div className={styles.mobileQuickFilters}>
          <ServicePills {...pillProps} mobile />
        </div>
        <output aria-live="polite" className="sr-only">
          {bg
            ? `Намерени услуги: ${matches.length}`
            : `${matches.length} services found`}
        </output>
        <section
          aria-label={title}
          className={styles.services}
          data-slot="dealer-services"
          id="dealer-services"
        >
          {matches.map((service) => (
            <div className={styles.result} key={service.href}>
              {service.card}
            </div>
          ))}
          {matches.length === 0 && (
            <div className={styles.empty}>
              <h2>{bg ? "Няма съвпадащи услуги" : "No matching services"}</h2>
              <p>
                {bg
                  ? "Опитайте с друга дума или изчистете филтрите."
                  : "Try another word or clear the filters."}
              </p>
              <button onClick={clear} type="button">
                {bg ? "Покажи всички услуги" : "Show all services"}
              </button>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
