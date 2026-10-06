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
  "buying-used-car-bulgaria": {
    bg: "Покупка на употребяван автомобил",
    en: "Buying a used car in Bulgaria",
  },
};

export const getDesktopContentCardTitle = (
  card: Pick<PublicContentCard, "slug" | "title">,
  locale: "bg" | "en"
) => desktopCardTitles[card.slug]?.[locale] ?? card.title;

/** Only serializable card summaries cross the client boundary, never article bodies. */
export const getPublicContentCards = (
  locale: "bg" | "en"
): PublicContentCard[] => [
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
];
