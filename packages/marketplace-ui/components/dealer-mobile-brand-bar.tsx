import { cn } from "@repo/design-system/lib/utils";
import { leadSite } from "@repo/marketplace";
import { MapPin, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { mobileHeaderIconActionClassName } from "../lib/mobile-header-icon-action";
import { getLocalizedPublicPath } from "../lib/public-path";
import { DealerMobileHeaderIcon } from "./dealer-mobile-header-icon";

export const DealerMobileBrandBar = ({
  isBg,
  locale,
  tone = "dark",
  wordmarkTone = "original",
  onNavigate,
}: {
  readonly isBg: boolean;
  readonly locale?: string;
  readonly tone?: "clean" | "dark" | "light";
  readonly wordmarkTone?: "original" | "light" | "dark";
  readonly onNavigate?: () => void;
}) => {
  const light = tone === "light";
  const clean = tone === "clean";
  const logoWidthClassName = "w-[144px] max-w-[48vw]";

  return (
    <div
      className={cn(
        "items-center",
        !clean && (light ? "text-zinc-950" : "text-white"),
        clean
          ? "flex h-11 justify-center"
          : "grid h-[54px] grid-cols-[44px_minmax(0,1fr)_44px]"
      )}
    >
      {clean ? null : (
        <a
          aria-label={isBg ? "Отвори местоположението" : "Open location"}
          className={mobileHeaderIconActionClassName}
          href={leadSite.mapsUrl}
          rel="noreferrer"
          target="_blank"
        >
          <DealerMobileHeaderIcon icon={MapPin} kind="location" />
        </a>
      )}

      <Link
        aria-label={isBg ? "Начало" : "Home"}
        className={cn(
          "mx-auto flex min-h-11 min-w-0 items-center rounded-lg focus-visible:outline-2 focus-visible:outline-[var(--lead-site-accent-bright)] focus-visible:outline-offset-2",
          light && "h-10 bg-black px-2.5"
        )}
        href={getLocalizedPublicPath(locale, "/")}
        onClick={onNavigate}
      >
        <span
          className={cn("relative block aspect-[1780/512]", logoWidthClassName)}
        >
          <Image
            alt={leadSite.name}
            className="h-full w-full object-contain"
            height={512}
            priority
            sizes="(max-width: 1023px) 144px, 0px"
            src={leadSite.logoPath}
            style={
              wordmarkTone === "original"
                ? undefined
                : { clipPath: "inset(0 68% 0 0)" }
            }
            width={1780}
          />
          {wordmarkTone === "original" ? null : (
            <Image
              alt=""
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-0 h-full w-full object-contain [clip-path:inset(0_0_0_32%)]",
                wordmarkTone === "light"
                  ? "brightness-0 invert"
                  : "brightness-0"
              )}
              fill
              priority
              sizes="(max-width: 1023px) 144px, 0px"
              src={leadSite.logoPath}
            />
          )}
        </span>
      </Link>

      {clean ? null : (
        <a
          aria-label={`${isBg ? "Обадете се на" : "Call"} ${leadSite.phoneDisplay}`}
          className={mobileHeaderIconActionClassName}
          href={leadSite.phoneHref}
        >
          <DealerMobileHeaderIcon icon={Phone} kind="phone" />
        </a>
      )}
    </div>
  );
};
