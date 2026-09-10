"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { getLocaleSwitchTarget } from "../lib/public-path";

interface MarketplaceLocaleSwitchLinkProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly label: string;
  readonly locale?: string;
}

interface ResolvedLocaleSwitchLinkProps
  extends MarketplaceLocaleSwitchLinkProps {
  readonly targetLocale: "bg" | "en";
  readonly targetPath: string;
}

const ResolvedLocaleSwitchLink = ({
  children,
  className,
  label,
  targetLocale,
  targetPath,
}: ResolvedLocaleSwitchLinkProps) => {
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const href = query ? `${targetPath}?${query}` : targetPath;

  return (
    <a
      aria-label={label}
      className={className}
      href={href}
      hrefLang={targetLocale}
      title={label}
    >
      {children}
    </a>
  );
};

export const MarketplaceLocaleSwitchLink = ({
  children,
  className,
  label,
  locale,
}: MarketplaceLocaleSwitchLinkProps) => {
  const pathname = usePathname();
  const { locale: targetLocale, path: targetPath } = getLocaleSwitchTarget(
    locale,
    pathname
  );
  const fallback = (
    <a
      aria-label={label}
      className={className}
      href={targetPath}
      hrefLang={targetLocale}
      title={label}
    >
      {children}
    </a>
  );

  return (
    <Suspense fallback={fallback}>
      <ResolvedLocaleSwitchLink
        className={className}
        label={label}
        locale={locale}
        targetLocale={targetLocale}
        targetPath={targetPath}
      >
        {children}
      </ResolvedLocaleSwitchLink>
    </Suspense>
  );
};
