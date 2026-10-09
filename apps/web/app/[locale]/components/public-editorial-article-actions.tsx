"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import {
  MobileMarketplaceOverlay,
  MobileMarketplaceOverlayCloseAction,
} from "@repo/marketplace-ui/components/mobile-marketplace-overlay";
import {
  isListingShareCancellation,
  shareListing,
} from "@repo/marketplace-ui/lib/listing-action-policy";
import { mobileImageIconActionClassName } from "@repo/marketplace-ui/lib/mobile-header-icon-action";
import {
  ArrowLeft,
  ArrowRight,
  List,
  LoaderCircle,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import styles from "./public-editorial-article.module.css";

type ArticleLanguage = "bg" | "en";

export function PublicEditorialShareButton({
  floating = false,
  language,
  title,
}: {
  floating?: boolean;
  language: ArticleLanguage;
  title: string;
}) {
  const isBg = language === "bg";
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState("");

  const handleShare = async () => {
    if (pending) {
      return;
    }
    setPending(true);
    setStatus("");
    try {
      const url = new URL(window.location.href);
      url.hash = "";
      const outcome = await shareListing(title, url.href);
      if (outcome === "copied") {
        setStatus(isBg ? "Линкът е копиран" : "Link copied");
      }
    } catch (error) {
      if (!isListingShareCancellation(error)) {
        setStatus(isBg ? "Опитай отново" : "Please try again");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className={styles.shareWrapper}>
      <Button
        aria-busy={pending}
        aria-label={isBg ? "Сподели статията" : "Share article"}
        className={cn(floating ? mobileImageIconActionClassName : styles.share)}
        data-slot="editorial-article-share"
        disabled={pending}
        onClick={handleShare}
        size="icon"
        type="button"
        variant="secondary"
      >
        {pending ? (
          <LoaderCircle
            aria-hidden
            className="size-[18px] animate-spin motion-reduce:animate-none"
          />
        ) : (
          <Share2 aria-hidden className="size-[18px]" />
        )}
      </Button>
      <span
        aria-live="polite"
        className={status ? styles.shareStatus : "sr-only"}
      >
        {status}
      </span>
    </div>
  );
}

export function PublicEditorialMobileChrome({
  backHref,
  carsHref,
  contents,
  language,
  title,
}: {
  backHref: string;
  carsHref: string;
  contents: readonly { heading: string; href: string; label: string }[];
  language: ArticleLanguage;
  title: string;
}) {
  const isBg = language === "bg";
  const [contentsOpen, setContentsOpen] = useState(false);
  const contentsButtonRef = useRef<HTMLButtonElement>(null);
  const selectedSectionRef = useRef<string | null>(null);

  return (
    <>
      <div
        className={styles.mobileHeader}
        data-slot="editorial-article-mobile-header"
      >
        <Button
          asChild
          className={mobileImageIconActionClassName}
          size="icon"
          variant="secondary"
        >
          <Link
            aria-label={isBg ? "Назад към статиите" : "Back to articles"}
            data-slot="editorial-article-mobile-back"
            href={backHref}
          >
            <ArrowLeft aria-hidden className="size-[18px]" />
          </Link>
        </Button>
        <PublicEditorialShareButton
          floating
          language={language}
          title={title}
        />
      </div>

      <nav
        aria-label={isBg ? "Действия за статията" : "Article actions"}
        className={styles.dock}
        data-slot="editorial-article-dock"
      >
        <button
          aria-expanded={contentsOpen}
          aria-haspopup="dialog"
          className={styles.dockContents}
          onClick={() => setContentsOpen(true)}
          ref={contentsButtonRef}
          type="button"
        >
          <List aria-hidden className={styles.icon} />
          {isBg ? "Съдържание" : "Contents"}
        </button>
        <Link
          className={styles.dockAction}
          data-slot="editorial-article-mobile-action"
          href={carsHref}
        >
          {isBg ? "Автомобили" : "Vehicles"}
          <ArrowRight aria-hidden className={styles.icon} />
        </Link>
      </nav>

      <MobileMarketplaceOverlay
        bodyClassName={styles.mobileContentsBody}
        contentDataSlot="editorial-article-contents-overlay"
        description={
          isBg
            ? "Избери раздел от статията"
            : "Choose a section of this article"
        }
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (selectedSectionRef.current) {
            document
              .getElementById(selectedSectionRef.current)
              ?.querySelector<HTMLElement>("h2")
              ?.focus({ preventScroll: true });
            selectedSectionRef.current = null;
          } else {
            contentsButtonRef.current?.focus({ preventScroll: true });
          }
        }}
        onOpenChange={setContentsOpen}
        open={contentsOpen}
        presentation="sheet"
        rightAction={
          <MobileMarketplaceOverlayCloseAction
            ariaLabel={isBg ? "Затвори" : "Close"}
          />
        }
        title={isBg ? "Съдържание" : "Contents"}
      >
        <ol className={styles.mobileContents}>
          {contents.map((entry, index) => (
            <li key={entry.href}>
              <Link
                aria-label={
                  entry.label === entry.heading
                    ? entry.heading
                    : `${entry.label}: ${entry.heading}`
                }
                href={entry.href}
                onNavigate={() => {
                  selectedSectionRef.current = entry.href.slice(1);
                  setContentsOpen(false);
                }}
                prefetch={false}
              >
                <span aria-hidden className={styles.contentsNumber}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className={styles.contentsLabel}>{entry.label}</span>
                <ArrowRight aria-hidden className={styles.icon} />
              </Link>
            </li>
          ))}
        </ol>
      </MobileMarketplaceOverlay>
    </>
  );
}
