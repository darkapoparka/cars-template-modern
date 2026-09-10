"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { useRef, useState } from "react";

type DesktopListingTabId =
  | "overview"
  | "information"
  | "specifications"
  | "equipment";
type MobileListingTabId = "overview" | "details";

interface ListingDetailsTabsProps {
  readonly equipment: ReactNode;
  readonly information: ReactNode;
  readonly locale?: string;
  readonly mobileDetails: ReactNode;
  readonly overview: ReactNode;
  readonly specifications: ReactNode;
}

const getTabCopy = (locale?: string) => {
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;

  return {
    ariaLabel: isBg
      ? "Раздели с информация за обявата"
      : "Listing information sections",
    details: isBg ? "Детайли" : "Details",
    equipment: isBg ? "Екстри" : "Extras",
    information: isBg ? "Информация" : "Information",
    overview: isBg ? "Обзор" : "Overview",
    specifications: isBg ? "Характеристики" : "Specifications",
  };
};

export const ListingDetailsTabs = ({
  equipment,
  information,
  locale,
  mobileDetails,
  overview,
  specifications,
}: ListingDetailsTabsProps) => {
  const copy = getTabCopy(locale);
  const mobileTabs: readonly { id: MobileListingTabId; label: string }[] = [
    { id: "overview", label: copy.overview },
    { id: "details", label: copy.details },
  ];
  const desktopTabs: readonly { id: DesktopListingTabId; label: string }[] = [
    { id: "overview", label: copy.overview },
    { id: "information", label: copy.information },
    { id: "specifications", label: copy.specifications },
    { id: "equipment", label: copy.equipment },
  ];
  const mobilePanels: Record<MobileListingTabId, ReactNode> = {
    details: (
      <div className="space-y-6">
        {mobileDetails}
        {equipment}
      </div>
    ),
    overview,
  };
  const desktopPanels: Record<DesktopListingTabId, ReactNode> = {
    equipment,
    information,
    overview,
    specifications,
  };
  const [mobileActiveTab, setMobileActiveTab] =
    useState<MobileListingTabId>("overview");
  const [desktopActiveTab, setDesktopActiveTab] =
    useState<DesktopListingTabId>("overview");
  const mobileTabRefs = useRef<
    Partial<Record<MobileListingTabId, HTMLButtonElement | null>>
  >({});
  const desktopTabRefs = useRef<
    Partial<Record<DesktopListingTabId, HTMLButtonElement | null>>
  >({});

  const handleMobileKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    tabId: MobileListingTabId
  ) => {
    const currentIndex = mobileTabs.findIndex((tab) => tab.id === tabId);
    let nextIndex: number | undefined;

    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % mobileTabs.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + mobileTabs.length) % mobileTabs.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = mobileTabs.length - 1;
    }

    if (nextIndex === undefined) {
      return;
    }

    event.preventDefault();
    const nextTab = mobileTabs[nextIndex].id;
    setMobileActiveTab(nextTab);
    requestAnimationFrame(() => mobileTabRefs.current[nextTab]?.focus());
  };

  const handleDesktopKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    tabId: DesktopListingTabId
  ) => {
    const currentIndex = desktopTabs.findIndex((tab) => tab.id === tabId);
    let nextIndex: number | undefined;

    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % desktopTabs.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + desktopTabs.length) % desktopTabs.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = desktopTabs.length - 1;
    }

    if (nextIndex === undefined) {
      return;
    }

    event.preventDefault();
    const nextTab = desktopTabs[nextIndex].id;
    setDesktopActiveTab(nextTab);
    requestAnimationFrame(() => desktopTabRefs.current[nextTab]?.focus());
  };

  return (
    <>
      <div className="mb-5 lg:hidden" data-slot="listing-details-tabs-mobile">
        <div
          aria-label={copy.ariaLabel}
          className="grid grid-cols-2 border-zinc-200 border-b"
          role="tablist"
        >
          {mobileTabs.map((tab) => {
            const isActive = mobileActiveTab === tab.id;

            return (
              <button
                aria-controls={`listing-mobile-panel-${tab.id}`}
                aria-selected={isActive}
                className={`relative inline-flex h-12 items-center justify-center px-3 text-[15px] transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${
                  isActive
                    ? "font-semibold text-zinc-950 after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-[var(--lead-site-accent)] after:content-['']"
                    : "font-medium text-zinc-500 active:bg-zinc-100 active:text-zinc-800"
                }`}
                id={`listing-mobile-tab-${tab.id}`}
                key={tab.id}
                onClick={() => setMobileActiveTab(tab.id)}
                onKeyDown={(event) => handleMobileKeyDown(event, tab.id)}
                ref={(element) => {
                  mobileTabRefs.current[tab.id] = element;
                }}
                role="tab"
                tabIndex={isActive ? 0 : -1}
                type="button"
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {mobileTabs.map((tab) => (
          <div
            aria-labelledby={`listing-mobile-tab-${tab.id}`}
            className="pt-4 pb-1"
            hidden={mobileActiveTab !== tab.id}
            id={`listing-mobile-panel-${tab.id}`}
            key={tab.id}
            role="tabpanel"
          >
            {mobilePanels[tab.id]}
          </div>
        ))}
      </div>

      <div
        className="hidden overflow-hidden rounded-xl border border-border bg-card lg:block"
        data-slot="listing-details-tabs-desktop"
      >
        <div
          aria-label={copy.ariaLabel}
          className="flex max-w-full items-center gap-2 overflow-x-auto px-4 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
        >
          {desktopTabs.map((tab) => {
            const isActive = desktopActiveTab === tab.id;

            return (
              <button
                aria-controls={`listing-desktop-panel-${tab.id}`}
                aria-selected={isActive}
                className={`inline-flex h-9 shrink-0 items-center rounded-full border px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${
                  isActive
                    ? "border-border bg-control font-semibold text-foreground shadow-sm"
                    : "border-border bg-background font-medium text-muted-foreground hover:bg-control/70 hover:text-foreground"
                }`}
                id={`listing-desktop-tab-${tab.id}`}
                key={tab.id}
                onClick={() => setDesktopActiveTab(tab.id)}
                onKeyDown={(event) => handleDesktopKeyDown(event, tab.id)}
                ref={(element) => {
                  desktopTabRefs.current[tab.id] = element;
                }}
                role="tab"
                tabIndex={isActive ? 0 : -1}
                type="button"
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {desktopTabs.map((tab) => (
          <div
            aria-labelledby={`listing-desktop-tab-${tab.id}`}
            className="px-4 pt-4 pb-4"
            hidden={desktopActiveTab !== tab.id}
            id={`listing-desktop-panel-${tab.id}`}
            key={tab.id}
            role="tabpanel"
          >
            {desktopPanels[tab.id]}
          </div>
        ))}
      </div>
    </>
  );
};
