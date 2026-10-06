"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/design-system/components/ui/tooltip";
import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./boxcar-desktop-pages.module.css";

export function DesktopContactPhoneCard({
  locale,
  phoneDisplay,
  phoneHref,
}: {
  locale: "bg" | "en";
  phoneDisplay: string;
  phoneHref: string;
}) {
  const isBg = locale === "bg";
  const [copyState, setCopyState] = useState<"idle" | "copied" | "selected">(
    "idle"
  );
  const numberRef = useRef<HTMLParagraphElement>(null);
  const copyingRef = useRef(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyLabel = isBg ? "Копирайте номера" : "Copy phone number";
  const feedback = {
    idle: "",
    copied: isBg ? "Номерът е копиран" : "Phone number copied",
    selected: isBg ? "Копирайте избрания номер" : "Copy the selected number",
  }[copyState];

  useEffect(
    () => () => {
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
    },
    []
  );

  const copyNumber = async () => {
    if (copyingRef.current) {
      return;
    }
    copyingRef.current = true;
    if (resetTimer.current) {
      clearTimeout(resetTimer.current);
    }
    try {
      await navigator.clipboard.writeText(phoneDisplay);
      setCopyState("copied");
      resetTimer.current = setTimeout(() => setCopyState("idle"), 3000);
    } catch {
      if (numberRef.current) {
        const range = document.createRange();
        range.selectNodeContents(numberRef.current);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      setCopyState("selected");
    } finally {
      copyingRef.current = false;
    }
  };

  return (
    <div
      className={`${styles.contactCard} ${styles.phoneCard}`}
      data-slot="desktop-contact-phone-card"
    >
      <a className={styles.contactCardMain} href={phoneHref}>
        <div>
          <h3>{isBg ? "Телефон" : "Phone"}</h3>
          <p ref={numberRef}>{phoneDisplay}</p>
        </div>
      </a>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <button
            aria-label={feedback || copyLabel}
            className={styles.copyPhone}
            data-copy-state={copyState}
            onClick={copyNumber}
            type="button"
          >
            {copyState === "copied" ? (
              <Check aria-hidden size={18} />
            ) : (
              <Copy aria-hidden size={18} />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent
          data-slot="desktop-contact-copy-tooltip"
          side="top"
          sideOffset={6}
        >
          {feedback || copyLabel}
        </TooltipContent>
      </Tooltip>
      <output aria-live="polite" className="sr-only">
        {feedback}
      </output>
    </div>
  );
}
