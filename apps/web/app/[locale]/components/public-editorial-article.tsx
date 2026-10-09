import Image from "@repo/marketplace-ui/components/public-image";
import { getLocalizedPath } from "@repo/seo/metadata";
import { ArrowLeft, ArrowRight, CalendarDays, Clock3 } from "lucide-react";
import Link from "next/link";
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
  eyebrow: string;
  image: string;
  imagePosition?: string;
  language: ArticleLanguage;
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

export function PublicEditorialArticle({
  backHref,
  description,
  eyebrow,
  image,
  imagePosition,
  language,
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

  return (
    <main className={styles.page} data-slot="public-editorial-article">
      <article className={styles.article}>
        <div className={styles.utility}>
          <Link
            className={styles.back}
            data-slot="editorial-article-back"
            href={backHref}
          >
            <ArrowLeft aria-hidden className={styles.icon} />
            {isBg ? "Всички материали" : "All content"}
          </Link>
          <PublicEditorialShareButton language={language} title={title} />
        </div>

        <header className={styles.header} data-slot="editorial-article-header">
          <div className={styles.cover} data-slot="editorial-article-cover">
            <Image
              alt=""
              className={styles.coverImage}
              fill
              priority
              sizes="(min-width: 1520px) 570px, (min-width: 1024px) 42vw, (min-width: 768px) 760px, 100vw"
              src={image}
              style={{ objectPosition: imagePosition }}
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
          </div>
          <div className={styles.intro}>
            <p className={styles.category}>{eyebrow}</p>
            <h1 className={styles.title}>{title}</h1>
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
            ) : null}
          </div>
        </header>

        <div className={styles.layout} data-slot="editorial-article-layout">
          <div className={styles.reader} data-slot="editorial-article-reader">
            <div
              className={styles.sections}
              data-slot="editorial-article-sections"
            >
              {sections.map((section, index) => (
                <section
                  aria-labelledby={`editorial-heading-${index + 1}`}
                  className={styles.section}
                  id={`editorial-section-${index + 1}`}
                  key={section.heading.en}
                >
                  <h2 id={`editorial-heading-${index + 1}`} tabIndex={-1}>
                    {section.heading[language]}
                  </h2>
                  <p>{section.body[language]}</p>
                </section>
              ))}
            </div>
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
