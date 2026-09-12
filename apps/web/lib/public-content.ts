export const contentFilters = [
  { id: "all", bg: "Всички", en: "All" },
  { id: "buying", bg: "Покупка", en: "Buying" },
  { id: "import", bg: "Внос", en: "Import" },
  { id: "finance", bg: "Финансиране", en: "Finance" },
  { id: "ev", bg: "EV и хибрид", en: "EV & hybrid" },
  { id: "listings", bg: "Обяви", en: "Listings" },
] as const;
export type ContentFilter = (typeof contentFilters)[number]["id"];
export type ContentCategory = Exclude<ContentFilter, "all">;
export interface PublicContentCard {
  readonly category: string;
  readonly description: string;
  readonly filter: ContentCategory;
  readonly image: string;
  readonly meta: string;
  readonly slug: string;
  readonly title: string;
  readonly type: "article" | "guide";
}
export interface ContentSearch {
  readonly filter: ContentFilter;
  readonly query: string;
}
export const parseContentSearch = (
  values: Readonly<Record<string, string | string[] | undefined>>
): ContentSearch => {
  const query = typeof values.q === "string" ? values.q.slice(0, 200) : "";
  const filter =
    contentFilters.find(({ id }) => id === values.topic)?.id ?? "all";
  return { query, filter };
};
export const serializeContentSearch = ({ query, filter }: ContentSearch) => {
  const params = new URLSearchParams();
  if (query.trim()) {
    params.set("q", query.trim().slice(0, 200));
  }
  if (filter !== "all") {
    params.set("topic", filter);
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
};
export const filterPublicContent = (
  items: readonly PublicContentCard[],
  search: ContentSearch,
  locale: string
) => {
  const query = search.query.trim().toLocaleLowerCase(locale);
  return items.filter(
    (item) =>
      (search.filter === "all" || item.filter === search.filter) &&
      (!query ||
        `${item.title} ${item.description} ${item.category}`
          .toLocaleLowerCase(locale)
          .includes(query))
  );
};
