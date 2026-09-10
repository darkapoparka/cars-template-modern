"use client";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@repo/design-system/components/ui/drawer";
import { DealerMobileHeaderIcon } from "@repo/marketplace-ui/components/dealer-mobile-header-icon";
import { DealerUiIcon } from "@repo/marketplace-ui/components/dealer-ui-icon";
import { mobileHeaderIconActionClassName } from "@repo/marketplace-ui/lib/mobile-header-icon-action";
import { Info } from "lucide-react";
import { type Ref, useRef, useState } from "react";

export function MobileServiceHelpButton({
  title,
  onClick,
  ref,
}: {
  title: string;
  onClick: () => void;
  ref?: Ref<HTMLButtonElement>;
}) {
  return (
    <button
      aria-haspopup="dialog"
      aria-label={title}
      className={mobileHeaderIconActionClassName}
      data-slot="mobile-service-help"
      onClick={onClick}
      ref={ref}
      title={title}
      type="button"
    >
      <DealerMobileHeaderIcon icon={Info} kind="info" />
    </button>
  );
}

export function MobileServiceHelp({
  title,
  faqs,
  locale,
}: {
  title: string;
  faqs: readonly { question: string; answer: string }[];
  locale: "bg" | "en";
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <MobileServiceHelpButton
        onClick={() => setOpen(true)}
        ref={triggerRef}
        title={title}
      />
      <Drawer onOpenChange={setOpen} open={open}>
        <DrawerContent
          className="mx-auto max-w-lg overflow-hidden border-0 bg-white data-[vaul-drawer-direction=bottom]:max-h-[85dvh] data-[vaul-drawer-direction=bottom]:rounded-t-2xl"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            triggerRef.current?.focus({ preventScroll: true });
          }}
        >
          <DrawerHeader className="shrink-0 px-4 pt-3 pb-4 text-left">
            <div className="flex items-center justify-between gap-3">
              <DrawerTitle className="text-[20px] leading-6">
                {title}
              </DrawerTitle>
              <button
                aria-label={
                  locale === "bg" ? "Затвори информацията" : "Close information"
                }
                className="grid size-11 shrink-0 place-items-center rounded-full bg-zinc-100 text-zinc-950"
                onClick={() => setOpen(false)}
                type="button"
              >
                <DealerUiIcon className="size-5" name="close" />
              </button>
            </div>
            <DrawerDescription className="sr-only">{title}</DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 overflow-y-auto overscroll-contain px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            <dl>
              {faqs.map((item) => (
                <div className="mb-5 last:mb-0" key={item.question}>
                  <dt className="font-semibold text-[15px] text-zinc-950">
                    {item.question}
                  </dt>
                  <dd className="mt-1.5 text-[14px] text-zinc-600 leading-6">
                    {item.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
