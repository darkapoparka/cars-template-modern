"use client";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@repo/design-system/components/ui/drawer";
import { CarFront, Phone, SlidersHorizontal, X } from "lucide-react";
import { useRef, useState } from "react";
import { MobileServiceHelpButton } from "../components/mobile-service-help";

const stepIcons = [CarFront, SlidersHorizontal, Phone];

export function LeaseInformationDrawer({
  faqs,
  locale,
}: {
  faqs: readonly { question: string; answer: string }[];
  locale: "bg" | "en";
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const title = locale === "bg" ? "Как работи лизингът" : "How financing works";
  const steps =
    locale === "bg"
      ? [
          ["Изберете автомобил", "Разгледайте наличните модели."],
          ["Задайте срок и вноска", "Посочете предпочитанията си в заявката."],
          ["Обсъдете офертата", "Ще уточним възможностите и условията."],
        ]
      : [
          ["Choose a car", "Browse the available models."],
          [
            "Set your term and deposit",
            "Share your preferences in the request.",
          ],
          [
            "Discuss your offer",
            "We’ll discuss financing availability and terms.",
          ],
        ];

  return (
    <>
      <MobileServiceHelpButton
        onClick={() => setOpen(true)}
        ref={triggerRef}
        title={title}
      />
      <Drawer modal onOpenChange={setOpen} open={open}>
        <DrawerContent
          className="mx-auto max-w-lg overflow-hidden border-0 bg-white data-[vaul-drawer-direction=bottom]:max-h-[85dvh] data-[vaul-drawer-direction=bottom]:rounded-t-2xl"
          data-slot="lease-information-drawer"
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
                className="grid size-11 shrink-0 place-items-center rounded-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-ring"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>
            <DrawerDescription className="sr-only">
              {locale === "bg"
                ? "Заявка, условия и необходими документи."
                : "Requests, terms and required documents."}
            </DrawerDescription>
          </DrawerHeader>
          <section
            aria-label={title}
            className="no-scrollbar min-h-0 overflow-y-auto overscroll-contain px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] focus-visible:outline-2 focus-visible:outline-zinc-500 focus-visible:outline-offset-[-2px]"
            // biome-ignore lint/a11y/noNoninteractiveTabindex: This scrollable panel needs keyboard focus.
            tabIndex={0}
          >
            <ol className="mb-6 space-y-4">
              {steps.map(([heading, description], index) => {
                const StepIcon = stepIcons[index] ?? CarFront;
                return (
                  <li
                    className="grid grid-cols-[24px_minmax(0,1fr)] items-start gap-x-3"
                    key={heading}
                  >
                    <span
                      aria-hidden="true"
                      className="grid size-6 place-items-center text-zinc-600"
                    >
                      <StepIcon className="size-5" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-[15px] text-zinc-950 leading-6">
                        {heading}
                      </h3>
                      <p className="mt-0.5 text-[14px] text-zinc-600 leading-5">
                        {description}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
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
          </section>
        </DrawerContent>
      </Drawer>
    </>
  );
}
