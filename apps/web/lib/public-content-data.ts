import "server-only";
import { publicBlogPosts } from "./public-blog-posts";
import { contentFilters, type PublicContentCard } from "./public-content";
import { vehicleGuides } from "./vehicle-guides";

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
