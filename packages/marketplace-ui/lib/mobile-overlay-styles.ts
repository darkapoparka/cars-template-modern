import { mobileIconActionGeometryClassName } from "./mobile-header-icon-action";

/** Shared mobile control geometry; keep route components focused on behavior. */
export const mobileControlFocusClassName =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

/** Match header geometry with a 40px circle and 18px glyph in a 44px target. */
export const mobileMarketplaceOverlayIconActionClassName = `${mobileIconActionGeometryClassName} bg-zinc-200 text-zinc-950 shadow-none transition-[background-color,transform] duration-150 hover:bg-zinc-300 active:scale-[0.96] active:bg-zinc-300 motion-reduce:transform-none [&_svg]:size-[18px] ${mobileControlFocusClassName}`;

export const mobileMarketplaceOverlayFieldClassName =
  "flex h-[52px] min-w-0 items-center gap-1 rounded-full bg-zinc-100 p-1 pl-4 ring-1 ring-inset ring-black/5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2";
export const mobileMarketplaceOverlayInputClassName =
  "h-full min-w-0 flex-1 bg-transparent pr-2 pl-1 font-normal text-body text-muted-foreground tracking-normal outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:appearance-none";
export const mobileMarketplaceOverlayFieldRowClassName =
  "shrink-0 bg-white px-4 pb-3";
export const mobileMarketplaceOverlayScrollClassName =
  "min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white";
export const mobileMarketplaceOverlayPrimaryActionClassName = `h-auto min-h-12 w-full whitespace-normal rounded-xl bg-brand px-4 py-3 text-center font-semibold text-compact-control text-brand-foreground shadow-none transition-[background-color,transform] duration-150 hover:bg-[var(--lead-site-accent-hover)] hover:text-[var(--brand-hover-foreground)] active:scale-[0.99] active:bg-[var(--lead-site-accent-active)] active:text-[var(--brand-active-foreground)] motion-reduce:transform-none ${mobileControlFocusClassName}`;
