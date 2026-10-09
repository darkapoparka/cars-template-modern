import { cn } from "@repo/design-system/lib/utils";
import type { Locale } from "@repo/internationalization/config";

export function LanguageFlag({
  locale,
  className,
}: {
  locale: Locale;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex h-3.5 w-5 shrink-0 overflow-hidden rounded-[2px] border border-black/15",
        className
      )}
      data-language-flag={locale}
    >
      <svg
        aria-hidden="true"
        className="block size-full"
        focusable="false"
        preserveAspectRatio="none"
        viewBox="0 0 60 40"
      >
        {locale === "bg" ? (
          <>
            <path d="M0 0h60v40H0z" fill="#fff" />
            <path d="M0 13.333h60v13.334H0z" fill="#00966e" />
            <path d="M0 26.667h60V40H0z" fill="#d62612" />
          </>
        ) : (
          <>
            <path d="M0 0h60v40H0z" fill="#012169" />
            <path d="m0 0 60 40m0-40L0 40" stroke="#fff" strokeWidth="8" />
            <path
              d="m0 0 30 20m0 0 30-20m-30 20L0 40m30-20 30 20"
              stroke="#c8102e"
              strokeWidth="3"
            />
            <path d="M30 0v40M0 20h60" stroke="#fff" strokeWidth="13" />
            <path d="M30 0v40M0 20h60" stroke="#c8102e" strokeWidth="7" />
          </>
        )}
      </svg>
    </span>
  );
}
