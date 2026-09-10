import { cn } from "@repo/design-system/lib/utils";
import { leadSite } from "@repo/marketplace";
import { DealerMobileBrandBar, MobileDealerChrome } from "@repo/marketplace-ui";
import { DealerMobileHeaderIcon } from "@repo/marketplace-ui/components/dealer-mobile-header-icon";
import { mobileHeaderIconActionClassName } from "@repo/marketplace-ui/lib/mobile-header-icon-action";
import { Phone } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

const serviceWordmarkTones = {
  leasing: "light",
  import: "dark",
  sell: "dark",
  contact: "original",
} as const;
const serviceBackgrounds = {
  leasing: "#bd001b",
  import: "#f5c542",
  sell: "#dce8ee",
  contact: "#09090b",
} as const;

/** Shared brand alignment with route-specific service artwork. */
export function MobileDealerServiceHero({
  children,
  className,
  imageClassName,
  imageSrc,
  locale,
  tone,
  helpAction,
}: {
  children: ReactNode;
  className?: string;
  imageClassName?: string;
  imageSrc: string;
  locale: "bg" | "en";
  tone?: "leasing" | "import" | "sell" | "contact";
  helpAction?: ReactNode;
}) {
  return (
    <section
      className={cn(
        "relative isolate flex flex-col overflow-hidden bg-zinc-200 text-zinc-950 lg:hidden",
        tone === "leasing" && "[--mobile-header-action-fill:20%]",
        className
      )}
      data-slot="mobile-service-hero"
      style={tone ? { backgroundColor: serviceBackgrounds[tone] } : undefined}
    >
      {tone ? null : (
        <Image
          alt=""
          className={cn(
            "pointer-events-none -z-10 object-cover",
            imageClassName
          )}
          fill
          priority
          sizes="(max-width: 1023px) 100vw, 1px"
          src={imageSrc}
        />
      )}
      {tone === "import" && !helpAction ? (
        <Image
          alt=""
          className="pointer-events-none absolute top-0 right-0 -z-10 h-[68px] w-28 object-cover object-right [mask-image:linear-gradient(to_right,transparent,black_35%)]"
          height={1024}
          sizes="112px"
          src={imageSrc}
          width={1536}
        />
      ) : null}
      <MobileDealerChrome
        brandRow={
          <div
            className={cn(
              "grid h-11 grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-3",
              tone === "leasing" || tone === "contact"
                ? "text-white"
                : "text-zinc-950"
            )}
          >
            <div>{helpAction}</div>
            <DealerMobileBrandBar
              isBg={locale === "bg"}
              locale={locale}
              tone="clean"
              wordmarkTone={tone ? serviceWordmarkTones[tone] : "original"}
            />
            <a
              aria-label={`${locale === "bg" ? "Обадете се на" : "Call"} ${leadSite.phoneDisplay}`}
              className={mobileHeaderIconActionClassName}
              data-slot="mobile-service-call"
              href={leadSite.phoneHref}
            >
              <DealerMobileHeaderIcon icon={Phone} kind="phone" />
            </a>
          </div>
        }
      >
        {children}
      </MobileDealerChrome>
    </section>
  );
}
