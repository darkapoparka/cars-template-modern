import { Skeleton } from "@repo/design-system/components/ui/skeleton";

const metricSkeletons = ["first", "second", "third", "fourth"] as const;

const WorkspaceLoading = () => (
  <>
    <header className="sticky top-0 z-30 flex min-h-14 shrink-0 items-center border-border/80 border-b bg-card/95 px-3 backdrop-blur-xl sm:px-4">
      <Skeleton className="size-9 rounded-lg" />
      <div className="ml-2.5 grid gap-1">
        <Skeleton className="h-2.5 w-20" />
        <Skeleton className="h-4 w-32" />
      </div>
    </header>

    <main
      aria-busy="true"
      aria-labelledby="workspace-loading-title"
      className="grid flex-1 content-start gap-3 p-3 sm:p-4"
    >
      <h1 className="sr-only" id="workspace-loading-title">
        Зареждане на работното пространство
      </h1>
      <output aria-live="polite" className="sr-only">
        Зареждаме актуалните данни. Моля, изчакайте.
      </output>

      <div aria-hidden="true" className="grid gap-3 sm:gap-4">
        <section className="grid gap-3 rounded-lg border bg-card p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-4">
          <div className="grid gap-2">
            <Skeleton className="h-5 w-44 max-w-full" />
            <Skeleton className="h-3.5 w-64 max-w-full" />
          </div>
          <Skeleton className="h-10 w-full sm:w-32" />
        </section>

        <section className="grid grid-cols-1 gap-2 md:grid-cols-4 md:gap-3 min-[360px]:grid-cols-2">
          {metricSkeletons.map((metric) => (
            <div
              className="grid min-h-20 content-between gap-2 rounded-lg border bg-card p-3 sm:min-h-24 sm:p-4"
              key={metric}
            >
              <Skeleton className="h-3 w-10 sm:w-16" />
              <Skeleton className="h-5 w-12 sm:h-6 sm:w-20" />
            </div>
          ))}
        </section>

        <section className="grid gap-3 rounded-lg border bg-card p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="size-9" />
          </div>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </section>
      </div>
    </main>
  </>
);

export default WorkspaceLoading;
