"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";
import { X } from "lucide-react";
import { type ReactNode, useRef } from "react";
import { getMarketplaceControlCopy } from "../lib/marketplace-control-copy";
import { DesktopMakeModelStages } from "./desktop-make-model-stages";
import styles from "./marketplace-model-picker.module.css";

type PickerStep = "make" | "model" | "derivative";

export function DesktopMakeModelDialog({
  applyLabel,
  clearSelection,
  derivative,
  handleApply,
  hasDerivatives,
  locale,
  make,
  model,
  onOpenChange,
  onStepChange,
  open,
  pickerBody,
  searchField,
  step,
}: {
  applyLabel?: string;
  clearSelection: () => void;
  derivative?: string;
  handleApply: () => void;
  hasDerivatives: boolean;
  locale?: string;
  make?: string;
  model?: string;
  onOpenChange: (open: boolean) => void;
  onStepChange: (step: PickerStep) => void;
  open: boolean;
  pickerBody: ReactNode;
  searchField: ReactNode;
  step: PickerStep;
}) {
  const copy = getMarketplaceControlCopy(locale);
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  const dialogRef = useRef<HTMLDivElement>(null);
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className="flex max-h-[var(--desktop-model-dialog-max-height)] w-[var(--desktop-model-dialog-width)] flex-col gap-0 overflow-hidden rounded-2xl border-border/80 bg-card p-0 shadow-overlay sm:max-w-[var(--desktop-model-dialog-max-width)]"
        data-slot="make-model-dialog"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          const target =
            dialogRef.current?.querySelector<HTMLInputElement>(
              'input[type="search"]'
            ) ??
            dialogRef.current?.querySelector<HTMLButtonElement>(
              '[role="tab"][data-state="active"]'
            );
          target?.focus({ preventScroll: true });
        }}
        ref={dialogRef}
        showCloseButton={false}
      >
        <DialogHeader className={styles.header}>
          <div className={styles.titleRow}>
            <DialogTitle className="text-dialog-title">
              {isBg ? "Марка и модел" : "Make and model"}
            </DialogTitle>
            <DialogClose asChild>
              <Button
                aria-label={copy.actions.close}
                className="size-10 rounded-lg bg-control p-0 shadow-none hover:bg-control-hover"
                size="icon"
                type="button"
                variant="secondary"
              >
                <X
                  aria-hidden="true"
                  className="size-[var(--desktop-icon-size)]"
                />
              </Button>
            </DialogClose>
          </div>
          <DialogDescription className="sr-only">
            {copy.makeModel.description}
          </DialogDescription>
        </DialogHeader>
        <DesktopMakeModelStages
          derivative={derivative}
          hasDerivatives={hasDerivatives}
          locale={locale}
          make={make}
          model={model}
          onStepChange={onStepChange}
          pickerBody={pickerBody}
          searchField={searchField}
          step={step}
        />
        <DialogFooter className={styles.footer}>
          <div className="flex w-full gap-2">
            <Button
              className="h-11 rounded-lg border-0 bg-control px-6 shadow-none hover:bg-control-hover"
              onClick={clearSelection}
              variant="secondary"
            >
              {copy.actions.clear}
            </Button>
            <Button
              className="h-11 flex-1 rounded-lg shadow-none"
              onClick={handleApply}
            >
              {applyLabel ?? copy.actions.showResults}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
