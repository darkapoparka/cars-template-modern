export const MODERATION_PAGE_SIZE = 50;

interface ModerationSeverityCounts {
  readonly high: number;
  readonly low: number;
  readonly medium: number;
}

interface ModerationPageSlice {
  readonly skip: number;
  readonly take: number;
}

export const getCanonicalModerationPage = (
  requestedPage: number,
  openReportCount: number
) => {
  const pageCount = Math.max(
    1,
    Math.ceil(openReportCount / MODERATION_PAGE_SIZE)
  );
  const currentPage = Math.min(Math.max(1, requestedPage), pageCount);

  return { currentPage, pageCount };
};

export const getModerationSeveritySlices = (
  counts: ModerationSeverityCounts,
  page: number
): Record<keyof ModerationSeverityCounts, ModerationPageSlice> => {
  let offsetRemaining = (page - 1) * MODERATION_PAGE_SIZE;
  let slotsRemaining = MODERATION_PAGE_SIZE;

  const getSlice = (count: number): ModerationPageSlice => {
    const skip = Math.min(offsetRemaining, count);
    offsetRemaining -= skip;
    const take = Math.min(slotsRemaining, count - skip);
    slotsRemaining -= take;
    return { skip, take };
  };

  return {
    high: getSlice(counts.high),
    medium: getSlice(counts.medium),
    low: getSlice(counts.low),
  };
};
