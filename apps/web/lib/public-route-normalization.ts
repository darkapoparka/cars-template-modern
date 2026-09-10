const taxonomySlugPattern = /^[a-z0-9-]+$/i;

export const getCanonicalTaxonomyPathname = (
  pathname: string
): string | undefined => {
  const segments = pathname.split("/").filter(Boolean);
  const categoryIndex = segments[0] === "en" || segments[0] === "bg" ? 1 : 0;

  if (
    segments[categoryIndex] !== "cars" ||
    segments.length < categoryIndex + 2 ||
    segments.length > categoryIndex + 3
  ) {
    return undefined;
  }

  const slugSegments = segments.slice(categoryIndex + 1);
  if (slugSegments.some((segment) => !taxonomySlugPattern.test(segment))) {
    return undefined;
  }

  const normalizedSegments = segments.map((segment, index) =>
    index > categoryIndex ? segment.toLowerCase() : segment
  );
  const normalizedPathname = `/${normalizedSegments.join("/")}`;

  return normalizedPathname === pathname ? undefined : normalizedPathname;
};
