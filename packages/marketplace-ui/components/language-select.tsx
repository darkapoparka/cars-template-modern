import { cn } from "@repo/design-system/lib/utils";
import type { ComponentProps } from "react";
import { LanguageFlag } from "./language-flag";

/** Keep the native picker and its selected flag usable without JavaScript. */
export function LanguageSelect({
  className,
  ...props
}: ComponentProps<"select">) {
  return (
    <span className="group/language relative block min-w-0">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
      >
        <LanguageFlag
          className="hidden group-has-[option[value=bg]:checked]/language:inline-flex"
          locale="bg"
        />
        <LanguageFlag
          className="hidden group-has-[option[value=en]:checked]/language:inline-flex"
          locale="en"
        />
      </span>
      <select className={cn(className, "pl-11")} {...props} />
    </span>
  );
}
