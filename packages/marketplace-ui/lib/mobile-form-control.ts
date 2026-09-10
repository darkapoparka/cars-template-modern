import { cn } from "@repo/design-system/lib/utils";
export const mobileFormFocusClassName =
  "focus-visible:border-transparent focus-visible:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-0";
export const mobileFormPickerTriggerClassName = `flex h-12 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-transparent bg-zinc-100 px-3 text-left text-[16px] outline-none transition-colors ${mobileFormFocusClassName} active:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-55`;
export const getMobileChoiceClassName = (selected: boolean) =>
  cn(
    "flex min-h-12 w-full items-center gap-3 rounded-xl bg-zinc-100 px-3 py-3 text-left text-[15px] text-zinc-950 outline-none hover:bg-zinc-200 focus-visible:ring-2 focus-visible:ring-zinc-300 active:bg-zinc-200",
    selected && "bg-zinc-200"
  );

export const mobileResponsiveFormFocusClassName =
  "max-lg:focus-visible:border-transparent max-lg:focus-visible:bg-zinc-100 max-lg:focus-visible:ring-2 max-lg:focus-visible:ring-zinc-300 max-lg:focus-visible:ring-offset-0";
