import { cn } from "@repo/design-system/lib/utils";

// The transparent 2px top/bottom borders keep a 44px target around a 40px fill.
// Keeping that space inside the button avoids clipping in horizontal pill rails.
export const getMobileQuickPillClassName = (
  active: boolean,
  className?: string
) =>
  cn(
    "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-transparent border-y-2 bg-clip-padding px-3.5 font-medium text-compact-control text-zinc-950 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--lead-site-accent)] focus-visible:outline-offset-2",
    active
      ? "bg-zinc-950 font-semibold text-white hover:bg-zinc-800 active:bg-zinc-800"
      : "bg-card hover:bg-control-hover",
    className
  );
