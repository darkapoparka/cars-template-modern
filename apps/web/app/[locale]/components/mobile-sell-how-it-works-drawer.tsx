"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@repo/design-system/components/ui/drawer";
import {
  mobileMarketplaceDrawerContentClassName,
  mobileMarketplaceDrawerHeaderClassName,
  mobileMarketplaceDrawerIconActionClassName,
} from "@repo/marketplace-ui/components/mobile-marketplace-drawer";
import { ChevronRight, X } from "lucide-react";
import { useRef } from "react";
import { mobileSellVehicleCopy } from "./mobile-sell-vehicle-policy";

export const MobileSellHowItWorksDrawer = ({
  locale,
  onOpenChange,
  onStart,
  open,
  onAfterClose,
}: {
  locale: "bg" | "en";
  onOpenChange: (open: boolean) => void;
  onStart: () => void;
  open: boolean;
  onAfterClose: () => void;
}) => {
  const content = mobileSellVehicleCopy[locale];
  const triggerRef = useRef<HTMLElement | null>(null);

  return (
    <Drawer autoFocus={false} onOpenChange={onOpenChange} open={open}>
      <DrawerContent
        className={mobileMarketplaceDrawerContentClassName}
        data-slot="mobile-sell-how-it-works-drawer"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          triggerRef.current?.focus({ preventScroll: true });
          onAfterClose();
        }}
        onOpenAutoFocus={() => {
          triggerRef.current =
            document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null;
        }}
      >
        <DrawerHeader className={mobileMarketplaceDrawerHeaderClassName}>
          <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2">
            <span aria-hidden="true" />
            <DrawerTitle className="text-center font-semibold text-[18px] leading-6">
              {content.howTitle}
            </DrawerTitle>
            <DrawerClose asChild>
              <Button
                aria-label={content.close}
                className={mobileMarketplaceDrawerIconActionClassName}
                size="icon"
                type="button"
                variant="ghost"
              >
                <X aria-hidden="true" className="size-[18px]" />
              </Button>
            </DrawerClose>
          </div>
          <DrawerDescription className="mx-auto max-w-sm px-5 text-center text-[13px] text-zinc-500 leading-5">
            {content.howDescription}
          </DrawerDescription>
        </DrawerHeader>

        <div className="no-scrollbar overflow-y-auto overscroll-contain px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="grid gap-2 pt-1">
            {content.howSteps.map((step, index) => (
              <div
                className="grid min-h-[76px] grid-cols-[2.25rem_minmax(0,1fr)] gap-3 rounded-2xl bg-zinc-100 px-3.5 py-3.5"
                key={step.title}
              >
                <span className="grid size-9 place-items-center rounded-full bg-[var(--lead-site-accent)] font-semibold text-[14px] text-white tabular-nums">
                  {index + 1}
                </span>
                <span className="min-w-0 pt-0.5">
                  <span className="block font-semibold text-[15px] text-zinc-950 leading-5">
                    {step.title}
                  </span>
                  <span className="mt-1 block text-[13px] text-zinc-600 leading-[18px]">
                    {step.description}
                  </span>
                </span>
              </div>
            ))}
          </div>

          <Button
            className="mt-3 h-12 w-full rounded-xl bg-[var(--lead-site-accent)] font-semibold text-[15px] text-white shadow-none hover:bg-[var(--lead-site-accent-hover)] active:bg-[var(--lead-site-accent-hover)]"
            onClick={onStart}
            type="button"
          >
            {content.howStart}
            <ChevronRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
