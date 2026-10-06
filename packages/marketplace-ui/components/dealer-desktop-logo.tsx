import { withBasePath } from "@repo/internationalization/paths";
import type { PublicSiteConfig } from "@repo/marketplace/site-config";
import { publicSite } from "@repo/marketplace/site-config";
import styles from "./dealer-desktop-logo.module.css";
import Image from "./public-image";

/** Source-bound preview artwork; personalized copies retain their configured logo. */
export function DealerDesktopLogo({
  className,
  inverse = false,
  site = publicSite,
}: {
  className?: string;
  inverse?: boolean;
  site?: PublicSiteConfig;
}) {
  if (site.identity.desktopPreview) {
    const preview = site.identity.desktopPreview;
    if (preview.logo) {
      return (
        <span
          aria-label={preview.name}
          className={className}
          data-logo-source={preview.logo}
          data-slot="template-brand-logo"
          role="img"
        >
          <span
            aria-hidden="true"
            className={styles.artwork}
            style={{
              maskImage: `url("${withBasePath(preview.logo)}")`,
              ...(inverse ? { backgroundColor: "white" } : {}),
            }}
          />
        </span>
      );
    }
    return (
      <span className={className}>
        <span className={styles.wordmark}>{preview.shortName}</span>
      </span>
    );
  }
  return (
    <Image
      alt={site.identity.name}
      className={className}
      height={48}
      sizes="(max-width: 1023px) 1px, 160px"
      src={inverse ? site.identity.inverseLogo : site.identity.logo}
      width={220}
    />
  );
}
