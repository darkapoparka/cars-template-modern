import { Skeleton } from "@repo/design-system/components/ui/skeleton";

export const SegmentLoading = ({ title }: { readonly title: string }) => (
  <main
    aria-busy="true"
    aria-labelledby="segment-loading-title"
    className="grid flex-1 content-start gap-3 p-3 sm:p-4"
  >
    <h1 className="sr-only" id="segment-loading-title">
      {title}
    </h1>
    <output aria-live="polite" className="sr-only">
      Зареждаме актуалните данни.
    </output>
    <Skeleton className="h-14 w-full rounded-lg" />
    <Skeleton className="h-28 w-full rounded-lg" />
    <Skeleton className="h-28 w-full rounded-lg" />
  </main>
);
