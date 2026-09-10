import { cn } from "@repo/design-system/lib/utils";

export const getMobileQuickPillClassName = (
  active: boolean,
  className?: string
) =>
  cn(
    "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-transparent px-3.5 font-medium text-[15px] text-zinc-950 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--lead-site-accent)] focus-visible:outline-offset-2",
    active
      ? "bg-zinc-950 font-semibold text-white hover:bg-zinc-800 active:bg-zinc-800"
      : "bg-card hover:bg-control-hover",
    className
  );
