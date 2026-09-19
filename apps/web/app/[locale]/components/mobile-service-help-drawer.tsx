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
  mobileMarketplaceDrawerHeaderClassName,
  mobileMarketplaceDrawerIconActionClassName,
} from "@repo/marketplace-ui/components/mobile-marketplace-drawer";
import { X } from "lucide-react";
import type { ReactNode } from "react";

export interface MobileServiceHelpStep {
  readonly description: string;
  readonly title: string;
}

interface MobileServiceHelpDrawerProps {
  readonly description: string;
  readonly faqs?: readonly { question: string; answer: string }[];
  readonly footer?: ReactNode;
  readonly locale: "bg" | "en";
  readonly onAfterClose?: () => void;
  readonly onOpenChange: (open: boolean) => void;
  readonly onRestoreFocus: () => void;
  readonly open: boolean;
  readonly steps: readonly MobileServiceHelpStep[];
  readonly title: string;
}

export function MobileServiceHelpDrawer({
  title,
  description,
  locale,
  steps,
  faqs,
  footer,
  open,
  onOpenChange,
  onRestoreFocus,
  onAfterClose,
}: MobileServiceHelpDrawerProps) {
  return (
    <Drawer autoFocus onOpenChange={onOpenChange} open={open}>
      <DrawerContent
        className="mx-auto max-w-lg overflow-hidden border-0 bg-zinc-50 data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:max-h-[min(85dvh,44rem)] data-[vaul-drawer-direction=bottom]:rounded-t-[28px]"
        data-slot="mobile-service-help-drawer"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onRestoreFocus();
          onAfterClose?.();
        }}
      >
        <DrawerHeader className={mobileMarketplaceDrawerHeaderClassName}>
          <div className="grid min-h-12 grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2">
            <span aria-hidden="true" />
            <DrawerTitle className="text-center font-semibold text-card-title-lg text-zinc-950 tracking-heading">
              {title}
            </DrawerTitle>
            <DrawerClose asChild>
              <Button
                aria-label={
                  locale === "bg" ? "Затвори информацията" : "Close information"
                }
                className={mobileMarketplaceDrawerIconActionClassName}
                data-slot="mobile-service-help-close"
                size="icon"
                type="button"
                variant="ghost"
              >
                <X aria-hidden="true" className="size-[18px]" />
              </Button>
            </DrawerClose>
          </div>
          <DrawerDescription className="mx-auto max-w-sm px-2 text-center text-meta text-zinc-600">
            {description}
          </DrawerDescription>
        </DrawerHeader>
        <section
          aria-label={title}
          className="no-scrollbar min-h-0 overflow-y-auto overscroll-contain px-4 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))] focus-visible:outline-2 focus-visible:outline-zinc-500 focus-visible:outline-offset-[-2px]"
          data-slot="mobile-service-help-body"
          // biome-ignore lint/a11y/noNoninteractiveTabindex: This scrollable panel needs keyboard focus.
          tabIndex={0}
        >
          <ol className="grid gap-2" data-slot="mobile-service-help-steps">
            {steps.map((step, index) => (
              <li
                className="grid grid-cols-[2.25rem_minmax(0,1fr)] items-start gap-3 rounded-2xl bg-zinc-100 p-3.5"
                key={step.title}
              >
                <span
                  aria-hidden="true"
                  className="grid size-9 place-items-center rounded-full bg-brand font-semibold text-brand-foreground text-micro tabular-nums"
                >
                  {index + 1}
                </span>
                <div className="min-w-0 pt-0.5">
                  <h3 className="font-semibold text-compact-control text-zinc-950">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-meta text-zinc-600">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          {faqs?.length ? (
            <div className="mt-5" data-slot="mobile-service-help-faqs">
              <h3 className="mb-2 font-semibold text-compact-control text-zinc-950">
                {locale === "bg"
                  ? "Често задавани въпроси"
                  : "Frequently asked questions"}
              </h3>
              <dl className="grid gap-2">
                {faqs.map((item) => (
                  <div
                    className="rounded-2xl bg-zinc-100 p-3.5"
                    key={item.question}
                  >
                    <dt className="font-semibold text-compact-control text-zinc-950">
                      {item.question}
                    </dt>
                    <dd className="mt-1 text-meta text-zinc-600">
                      {item.answer}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
          {footer ? <div className="mt-3">{footer}</div> : null}
        </section>
      </DrawerContent>
    </Drawer>
  );
}
