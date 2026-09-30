import { cn } from "@repo/design-system/lib/utils";

export const mobileFormTextClassName =
  "font-normal text-body text-muted-foreground placeholder:text-muted-foreground";
export const mobileResponsiveFormTextClassName =
  "max-lg:font-normal max-lg:text-body max-lg:text-muted-foreground max-lg:placeholder:text-muted-foreground";

/** Search entry points share geometry and type with their overlay fields. */
export const mobileSearchTriggerClassName =
  "flex h-12 w-full min-w-0 items-center gap-2.5 rounded-full px-4 text-left text-muted-foreground ring-1 ring-inset transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2";
export const mobileSearchTriggerLabelClassName =
  "min-w-0 flex-1 truncate font-normal text-body text-muted-foreground tracking-normal";

export const mobileFormFocusClassName =
  "focus-visible:border-transparent focus-visible:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
export const mobileFormPickerTriggerClassName = `flex h-12 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-transparent bg-zinc-100 px-3 text-left outline-none transition-colors ${mobileFormTextClassName} ${mobileFormFocusClassName} active:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-55`;
export const getMobileChoiceClassName = (selected: boolean) =>
  cn(
    "flex min-h-12 w-full items-center gap-3 rounded-xl bg-zinc-100 px-3 py-3 text-left text-compact-control text-zinc-950 outline-none hover:bg-zinc-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:bg-zinc-200",
    selected && "bg-zinc-200"
  );

export const mobileResponsiveFormFocusClassName =
  "max-lg:focus-visible:border-transparent max-lg:focus-visible:bg-zinc-100 max-lg:focus-visible:ring-2 max-lg:focus-visible:ring-ring max-lg:focus-visible:ring-offset-2";
