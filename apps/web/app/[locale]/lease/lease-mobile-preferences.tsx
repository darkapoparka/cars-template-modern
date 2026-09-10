"use client";
import { getMobileQuickPillClassName } from "@repo/marketplace-ui";
import { DealerUiIcon } from "@repo/marketplace-ui/components/dealer-ui-icon";
import {
  MobileMarketplaceOverlay,
  MobileMarketplaceOverlayCloseAction,
} from "@repo/marketplace-ui/components/mobile-marketplace-overlay";
import { getMobileChoiceClassName } from "@repo/marketplace-ui/lib/mobile-form-control";
import { useRef, useState } from "react";
import { leaseSelectorCopy } from "./lease-finance-policy";

export interface LeasePreferenceProps {
  deposit: string;
  onDepositChange: (value: string) => void;
  onTermChange: (value: string) => void;
  term: string;
}
export function LeaseMobilePreferences({
  locale,
  term,
  deposit,
  onTermChange,
  onDepositChange,
}: LeasePreferenceProps & { locale: "bg" | "en" }) {
  const [kind, setKind] = useState<"term" | "deposit" | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const copy = leaseSelectorCopy[locale];
  const options = kind === "term" ? copy.termOptions : copy.depositOptions;
  const value = kind === "term" ? term : deposit;
  return (
    <>
      {(["term", "deposit"] as const).map((key) => {
        const selected = key === "term" ? term : deposit;
        const label =
          key === "term" ? copy.termShortLabel : copy.depositShortLabel;
        const choices = key === "term" ? copy.termOptions : copy.depositOptions;
        const summary = choices.find(
          (option) => option.value === selected
        )?.label;
        return (
          <button
            aria-haspopup="dialog"
            className={getMobileQuickPillClassName(selected !== "flexible")}
            key={key}
            onClick={(event) => {
              trigger.current = event.currentTarget;
              setKind(key);
            }}
            type="button"
          >
            {selected === "flexible" ? label : `${label}: ${summary}`}
            <DealerUiIcon className="size-3.5" name="chevronDown" />
          </button>
        );
      })}
      <MobileMarketplaceOverlay
        contentDataSlot="lease-preference-picker"
        description={
          locale === "bg"
            ? "Предпочитание за заявката. Условията се потвърждават индивидуално."
            : "A request preference. Terms are confirmed individually."
        }
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          trigger.current?.focus({ preventScroll: true });
        }}
        onOpenChange={(open) => {
          if (!open) {
            setKind(null);
          }
        }}
        open={kind !== null}
        rightAction={
          <MobileMarketplaceOverlayCloseAction
            ariaLabel={locale === "bg" ? "Затвори" : "Close"}
          />
        }
        title={kind === "term" ? copy.termLabel : copy.depositLabel}
      >
        <div className="grid gap-2 px-3 pb-4">
          {options.map((option) => (
            <button
              aria-pressed={value === option.value}
              className={getMobileChoiceClassName(value === option.value)}
              key={option.value}
              onClick={() => {
                if (kind === "term") {
                  onTermChange(option.value);
                } else {
                  onDepositChange(option.value);
                }
                setKind(null);
              }}
              type="button"
            >
              <span className="flex-1">{option.label}</span>
              {value === option.value ? (
                <DealerUiIcon className="size-5" name="check" />
              ) : null}
            </button>
          ))}
          <p className="px-1 pt-2 text-sm text-zinc-600">
            {locale === "bg"
              ? "Предпочитание за заявката. Условията се потвърждават индивидуално."
              : "A request preference. Terms are confirmed individually."}
          </p>
        </div>
      </MobileMarketplaceOverlay>
    </>
  );
}
