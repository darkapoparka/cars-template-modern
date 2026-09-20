"use client";
import { normalizeLocale } from "@repo/internationalization/config";
import { localizedPath, withBasePath } from "@repo/internationalization/paths";
import { usePathname, useSearchParams } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { useLocalePreferences } from "./locale-preferences";

interface Props {
  readonly children: ReactNode;
  readonly className?: string;
  readonly label: string;
  readonly locale?: string;
}
function ResolvedPreferenceLink({ children, className, label, locale }: Props) {
  const preferences = useLocalePreferences();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const current = withBasePath(pathname) + (search ? `?${search}` : "");
  const href =
    withBasePath(localizedPath(locale, "/locale-settings")) +
    "?returnTo=" +
    encodeURIComponent(current);
  return (
    <a
      aria-label={label}
      className={className}
      data-locale-trigger
      href={withBasePath(href)}
      onClick={(event) => {
        if (
          preferences &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey &&
          event.button === 0
        ) {
          event.preventDefault();
          preferences.open();
        }
      }}
    >
      {children}
    </a>
  );
}
export function MarketplaceLocaleSwitchLink(props: Props) {
  const fallback = (
    <a
      aria-label={props.label}
      className={props.className}
      data-locale-trigger
      href={withBasePath(
        localizedPath(normalizeLocale(props.locale), "/locale-settings")
      )}
    >
      {props.children}
    </a>
  );
  return (
    <Suspense fallback={fallback}>
      <ResolvedPreferenceLink {...props} />
    </Suspense>
  );
}
