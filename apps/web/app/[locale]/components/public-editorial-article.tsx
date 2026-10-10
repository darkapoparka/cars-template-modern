import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/design-system/components/ui/breadcrumb";
import { withBasePath } from "@repo/internationalization/paths";
import { publicSite } from "@repo/marketplace/site-config";
import { DealerDesktopHero } from "@repo/marketplace-ui/components/dealer-desktop-hero";
import Image from "@repo/marketplace-ui/components/public-image";
import { getLocalizedPath } from "@repo/seo/metadata";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
} from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { DesktopEditorialReading } from "@/lib/public-content-data";
import styles from "./public-editorial-article.module.css";
import {
  PublicEditorialMobileChrome,
  PublicEditorialShareButton,
} from "./public-editorial-article-actions";

type ArticleLanguage = "bg" | "en";
interface RelatedArticle {
  category: string;
  href: string;
  image: string;
  shortTitle: string;
  title: string;
}

interface PublicEditorialArticleProps {
  backHref: string;
  description: string;
  desktopReading?: DesktopEditorialReading;
  eyebrow: string;
  heroArtwork?: { image: string; takeaway: string };
  image: string;
  imagePosition?: string;
  language: ArticleLanguage;
  mobileTitle: string;
  published?: string;
  readTime?: string;
  related: readonly RelatedArticle[];
  sections: readonly {
    body: Record<ArticleLanguage, string>;
    heading: Record<ArticleLanguage, string>;
    navigationLabel?: Record<ArticleLanguage, string>;
  }[];
  title: string;
}

function RelatedArticles({
  language,
  related,
  sidebar = false,
}: {
  language: ArticleLanguage;
  related: readonly RelatedArticle[];
  sidebar?: boolean;
}) {
  if (!related.length) {
    return null;
  }
  const headingId = sidebar
    ? "editorial-sidebar-related-title"
    : "editorial-related-title";
  return (
    <section
      aria-labelledby={headingId}
      className={sidebar ? styles.relatedSidebar : styles.related}
      data-slot={
        sidebar
          ? "editorial-article-related-sidebar"
          : "editorial-article-related"
      }
    >
      <h2 id={headingId}>
        {language === "bg" ? "Още за четене" : "More to read"}
      </h2>
      <div className={styles.relatedGrid}>
        {related.map((entry) => (
          <Link
            aria-label={`${entry.shortTitle}: ${entry.title}`}
            className={styles.relatedLink}
            href={entry.href}
            key={entry.href}
            title={entry.title}
          >
            <span className={styles.relatedImage}>
              <Image alt="" fill sizes="72px" src={entry.image} />
            </span>
            <div className={styles.relatedText}>
              <p className={styles.relatedCategory}>{entry.category}</p>
              <h3>{entry.shortTitle}</h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ArticleCoverImage({
  image,
  imagePosition,
  heroArtwork,
}: Pick<
  PublicEditorialArticleProps,
  "image" | "imagePosition" | "heroArtwork"
>) {
  return (
    <picture className={styles.coverPicture}>
      {heroArtwork ? <source srcSet={withBasePath(heroArtwork.image)} /> : null}
      <Image
        alt=""
        className={
          heroArtwork
            ? [styles.coverImage, styles.illustratedCoverImage].join(" ")
            : styles.coverImage
        }
        fetchPriority="high"
        fill
        loading="eager"
        sizes="(min-width: 1520px) 570px, (min-width: 1024px) 42vw, (min-width: 768px) 760px, 100vw"
        src={image}
        style={{ "--editorial-cover-position": imagePosition } as CSSProperties}
      />
    </picture>
  );
}

function DesktopArticleMetadata({
  language,
  published,
  publishedLabel,
  readTime,
}: Pick<PublicEditorialArticleProps, "language" | "published" | "readTime"> & {
  publishedLabel?: string;
}) {
  if (!(published || readTime)) {
    return null;
  }
  return (
    <ul
      aria-label={
        language === "bg" ? "Информация за материала" : "Article details"
      }
      className={styles.heroMetadata}
      data-slot="editorial-article-desktop-details"
    >
      {published ? (
        <li>
          <CalendarDays aria-hidden className={styles.icon} />
          <time dateTime={published}>{publishedLabel}</time>
        </li>
      ) : null}
      {readTime ? (
        <li>
          <Clock3 aria-hidden className={styles.icon} />
          {readTime}
        </li>
      ) : null}
    </ul>
  );
}

function DesktopArticleBreadcrumbs({
  backHref,
  language,
  mobileTitle,
  title,
}: Pick<
  PublicEditorialArticleProps,
  "backHref" | "language" | "mobileTitle" | "title"
>) {
  const isBg = language === "bg";
  return (
    <Breadcrumb
      aria-label={isBg ? "Навигационна пътека" : "Breadcrumb"}
      className={styles.breadcrumb}
      data-slot="editorial-article-breadcrumb"
    >
      <BreadcrumbList className={styles.breadcrumbList}>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={getLocalizedPath(language, "/")}>
              {isBg ? "Начало" : "Home"}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={backHref}>
              {isBg ? "Съвети и статии" : "Guides and articles"}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem className={styles.breadcrumbCurrent}>
          <BreadcrumbPage
            aria-label={title}
            className={styles.breadcrumbPage}
            title={title}
          >
            {mobileTitle}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function DesktopArticleHero({
  backHref,
  eyebrow,
  image,
  language,
  mobileTitle,
  published,
  publishedLabel,
  readTime,
  title,
}: Pick<
  PublicEditorialArticleProps,
  | "backHref"
  | "eyebrow"
  | "image"
  | "language"
  | "mobileTitle"
  | "published"
  | "readTime"
  | "title"
> & { publishedLabel?: string }) {
  return (
    <div
      className={styles.desktopHero}
      data-slot="editorial-article-desktop-hero"
    >
      <DealerDesktopHero
        appearance="photo"
        artwork={
          publicSite.artwork.desktopHeroScene ??
          publicSite.artwork.heroScene ??
          image
        }
        controls={
          <DesktopArticleMetadata
            language={language}
            published={published}
            publishedLabel={publishedLabel}
            readTime={readTime}
          />
        }
        eyebrow={eyebrow}
        locale={language}
        sceneTone="editorial"
        title={title}
      />
      <div
        className={styles.utility}
        data-slot="editorial-article-hero-actions"
      >
        <Link
          className={styles.back}
          data-slot="editorial-article-back"
          href={backHref}
        >
          <ArrowLeft aria-hidden className={styles.icon} />
          {language === "bg" ? "Всички материали" : "All content"}
        </Link>
        <PublicEditorialShareButton language={language} title={title} />
      </div>
      <DesktopArticleBreadcrumbs
        backHref={backHref}
        language={language}
        mobileTitle={mobileTitle}
        title={title}
      />
    </div>
  );
}
function DesktopArticleFigure({
  heroArtwork,
}: Pick<PublicEditorialArticleProps, "heroArtwork">) {
  if (!heroArtwork) {
    return null;
  }
  return (
    <figure
      className={styles.desktopFigure}
      data-slot="editorial-article-desktop-figure"
    >
      <picture>
        <source
          media="(min-width: 1024px)"
          srcSet={withBasePath(heroArtwork.image)}
        />
        <img
          alt=""
          decoding="async"
          height={667}
          loading="lazy"
          src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
          width={1000}
        />
      </picture>
      <figcaption>{heroArtwork.takeaway}</figcaption>
    </figure>
  );
}

function ArticleSection({
  desktopParagraph,
  heroArtwork,
  index,
  language,
  section,
}: {
  desktopParagraph?: string;
  heroArtwork?: PublicEditorialArticleProps["heroArtwork"];
  index: number;
  language: ArticleLanguage;
  section: PublicEditorialArticleProps["sections"][number];
}) {
  return (
    <section
      aria-labelledby={`editorial-heading-${index + 1}`}
      className={styles.section}
      id={`editorial-section-${index + 1}`}
    >
      <h2 id={`editorial-heading-${index + 1}`} tabIndex={-1}>
        {section.heading[language]}
      </h2>
      <p>{section.body[language]}</p>
      {desktopParagraph ? (
        <p
          className={styles.desktopParagraph}
          data-slot="editorial-article-desktop-paragraph"
        >
          {desktopParagraph}
        </p>
      ) : null}
      {index === 0 ? <DesktopArticleFigure heroArtwork={heroArtwork} /> : null}
    </section>
  );
}

function DesktopArticleChecklist({
  checklist,
  language,
}: {
  checklist?: readonly string[];
  language: ArticleLanguage;
}) {
  if (!checklist?.length) {
    return null;
  }
  return (
    <section
      aria-labelledby="editorial-checklist-title"
      className={styles.desktopChecklist}
      data-slot="editorial-article-desktop-checklist"
    >
      <h2 id="editorial-checklist-title">
        {language === "bg" ? "Преди да решите" : "Before you decide"}
      </h2>
      <ul>
        {checklist.map((point) => (
          <li key={point}>
            <Check aria-hidden className={styles.icon} />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PublicEditorialArticle({
  backHref,
  description,
  desktopReading,
  eyebrow,
  image,
  imagePosition,
  language,
  heroArtwork,
  mobileTitle,
  published,
  readTime,
  related,
  sections,
  title,
}: PublicEditorialArticleProps) {
  const isBg = language === "bg";
  const carsHref = getLocalizedPath(language, "/cars");
  const publishedLabel = published
    ? new Intl.DateTimeFormat(isBg ? "bg-BG" : "en-GB", {
        day: "numeric",
        month: "long",
        timeZone: "UTC",
        year: "numeric",
      }).format(new Date(published))
    : undefined;
  const mobilePublishedLabel = published
    ? new Intl.DateTimeFormat(isBg ? "bg-BG" : "en-GB", {
        day: "numeric",
        month: "long",
        timeZone: "UTC",
      }).format(new Date(published))
    : undefined;

  return (
    <main className={styles.page} data-slot="public-editorial-article">
      <article className={styles.article}>
        <DesktopArticleHero
          backHref={backHref}
          eyebrow={eyebrow}
          image={image}
          language={language}
          mobileTitle={mobileTitle}
          published={published}
          publishedLabel={publishedLabel}
          readTime={desktopReading?.readTime ?? readTime}
          title={title}
        />

        <header className={styles.header} data-slot="editorial-article-header">
          <div className={styles.cover} data-slot="editorial-article-cover">
            <ArticleCoverImage
              heroArtwork={heroArtwork}
              image={image}
              imagePosition={imagePosition}
            />
            <PublicEditorialMobileChrome
              backHref={backHref}
              carsHref={carsHref}
              contents={sections.map((section, index) => ({
                heading: section.heading[language],
                href: `#editorial-section-${index + 1}`,
                label:
                  section.navigationLabel?.[language] ??
                  section.heading[language],
              }))}
              language={language}
              title={title}
            />
            {heroArtwork ? (
              <p
                className={styles.heroHint}
                data-slot="editorial-article-takeaway"
              >
                {heroArtwork.takeaway}
              </p>
            ) : null}
          </div>
          <div className={styles.intro}>
            <div className={styles.headingGroup}>
              <p className={styles.category}>{eyebrow}</p>
              <h1 className={styles.title}>
                <span className={styles.mobileTitle}>{mobileTitle}</span>
                <span className={styles.desktopTitle}>{title}</span>
              </h1>
            </div>
            <div className={styles.summary}>
              <p className={styles.description}>{description}</p>
              {published || readTime ? (
                <ul
                  aria-label={
                    isBg ? "Информация за материала" : "Article details"
                  }
                  className={styles.metadata}
                  data-slot="editorial-article-details"
                >
                  {published ? (
                    <li>
                      <CalendarDays aria-hidden className={styles.icon} />
                      <time dateTime={published}>
                        <span className={styles.mobileDate}>
                          <span aria-hidden>{mobilePublishedLabel}</span>
                          <span className="sr-only">{publishedLabel}</span>
                        </span>
                        <span className={styles.desktopDate}>
                          {publishedLabel}
                        </span>
                      </time>
                    </li>
                  ) : null}
                  {readTime ? (
                    <li>
                      <Clock3 aria-hidden className={styles.icon} />
                      {readTime}
                    </li>
                  ) : null}
                </ul>
              ) : null}
            </div>
          </div>
        </header>

        <div className={styles.layout} data-slot="editorial-article-layout">
          <div className={styles.reader} data-slot="editorial-article-reader">
            <h2
              className={styles.desktopReaderTitle}
              data-slot="editorial-article-reader-title"
            >
              {title}
            </h2>
            <p className={styles.desktopDescription}>{description}</p>
            <div
              className={styles.sections}
              data-slot="editorial-article-sections"
            >
              {sections.map((section, index) => (
                <ArticleSection
                  desktopParagraph={desktopReading?.paragraphs[index]}
                  heroArtwork={heroArtwork}
                  index={index}
                  key={section.heading.en}
                  language={language}
                  section={section}
                />
              ))}
            </div>
            <DesktopArticleChecklist
              checklist={desktopReading?.checklist}
              language={language}
            />
          </div>

          <aside
            className={styles.sidebar}
            data-slot="editorial-article-sidebar"
          >
            <nav
              aria-labelledby="editorial-contents-title"
              className={styles.contentsCard}
              data-slot="editorial-article-contents"
            >
              <h2 id="editorial-contents-title">
                {isBg ? "Съдържание" : "Contents"}
              </h2>
              <ol>
                {sections.map((section, index) => (
                  <li key={section.heading.en}>
                    <Link
                      aria-label={
                        section.navigationLabel &&
                        section.navigationLabel[language] !==
                          section.heading[language]
                          ? `${section.navigationLabel[language]}: ${section.heading[language]}`
                          : section.heading[language]
                      }
                      href={`#editorial-section-${index + 1}`}
                      prefetch={false}
                      title={section.heading[language]}
                    >
                      <span aria-hidden className={styles.contentsNumber}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className={styles.contentsLabel}>
                        {section.navigationLabel?.[language] ??
                          section.heading[language]}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </nav>
            <RelatedArticles language={language} related={related} sidebar />
            <div className={styles.nextStep}>
              <h2>{isBg ? "Следващ автомобил" : "Your next car"}</h2>
              <Link
                className={styles.action}
                data-slot="editorial-article-action"
                href={carsHref}
              >
                <span>{isBg ? "Автомобили" : "Vehicles"}</span>
                <ArrowRight aria-hidden className={styles.icon} />
              </Link>
            </div>
          </aside>
        </div>
        <RelatedArticles language={language} related={related} />
      </article>
    </main>
  );
}
