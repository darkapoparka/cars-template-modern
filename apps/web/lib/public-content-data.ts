import "server-only";
import { publicBlogPosts } from "./public-blog-posts";
import { contentFilters, type PublicContentCard } from "./public-content";
import { vehicleGuides } from "./vehicle-guides";

const desktopCardTitles: Record<string, { bg: string; en: string }> = {
  "premium-used-car-checklist": {
    bg: "Какво да проверите преди покупка",
    en: "Buying a premium car: what to check",
  },
  "import-costs-and-timing": {
    bg: "Внос на автомобил: разходи и срокове",
    en: "Car imports: costs and timelines",
  },
  "financing-offer-questions": {
    bg: "5 въпроса преди офертата за финансиране",
    en: "Five questions before a finance offer",
  },
  "ev-hybrid-ownership-checklist": {
    bg: "Проверки при EV и хибрид",
    en: "Checks for EVs and hybrids",
  },
  "dealer-listing-transparency": {
    bg: "Как да оцените една обява",
    en: "How to assess a car listing",
  },
  "buying-used-car-bulgaria": {
    bg: "Покупка на употребяван автомобил",
    en: "Buying a used car in Bulgaria",
  },
};

const desktopCardArtwork: Record<string, string> = {
  "premium-used-car-checklist": "/images/desktop/cutout-m4-v1.webp",
  "import-costs-and-timing": "/images/services/desktop-imports-v1.webp",
  "financing-offer-questions": "/images/services/desktop-finance-v1.webp",
  "buying-used-car-bulgaria": "/images/desktop/cutout-golf-v1.webp",
  "ev-hybrid-ownership-checklist":
    "/images/categories/day-night-category-car-v2.png",
  "dealer-listing-transparency": "/images/services/desktop-sell-v1.webp",
};

export const getDesktopContentCardTitle = (
  card: Pick<PublicContentCard, "slug" | "title">,
  locale: "bg" | "en"
) => desktopCardTitles[card.slug]?.[locale] ?? card.title;

/** Only serializable card summaries cross the client boundary, never article bodies. */
export const getPublicContentCards = (
  locale: "bg" | "en"
): PublicContentCard[] =>
  [
    ...publicBlogPosts.map(
      (post): PublicContentCard => ({
        category: post.category[locale],
        description: post.excerpt[locale],
        filter: post.categoryId,
        image: post.image,
        meta: post.readTime[locale],
        slug: post.slug,
        title: post.title[locale],
        type: "article",
      })
    ),
    ...vehicleGuides.map(
      (guide): PublicContentCard => ({
        category:
          contentFilters.find(({ id }) => id === guide.categoryId)?.[locale] ??
          "",
        description: guide.description[locale],
        filter: guide.categoryId,
        image: guide.image,
        meta: locale === "bg" ? "Ръководство" : "Guide",
        slug: guide.slug,
        title: guide.title[locale],
        type: "guide",
      })
    ),
  ].map((card) => ({
    ...card,
    desktopImage: desktopCardArtwork[card.slug] ?? card.image,
    desktopTitle: getDesktopContentCardTitle(card, locale),
  }));
