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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/design-system/components/ui/tabs";
import { X } from "lucide-react";
import { useRef, useState } from "react";
import {
  clearDesktopFullFilterSection,
  type DesktopFullFilterEntry,
  type DesktopFullFilterGroup,
  type DesktopFullFilterSection,
  desktopFullFilterGroups,
  getDesktopFullFilterGroup,
  getDesktopFullFilterLabel,
} from "../lib/desktop-full-filter-policy";
import { getMarketplaceControlCopy } from "../lib/marketplace-control-copy";
import {
  DesktopFullFilterContent,
  type DesktopFullFilterDraftProps,
} from "./desktop-full-filter-content";
import styles from "./desktop-full-filter-dialog.module.css";
import { DesktopFullFilterGroupContent } from "./desktop-full-filter-group";

export type {
  DesktopFullFilterEntry,
  DesktopFullFilterSection,
} from "../lib/desktop-full-filter-policy";

function getDialogPresentation(entry: DesktopFullFilterEntry, locale?: string) {
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  const section: DesktopFullFilterSection =
    entry === "make" || entry === "model" ? "vehicle" : entry;
  const focused = ["make", "model", "price", "search"].includes(entry);
  let title = isBg ? "Филтри" : "Filters";
  if (focused) {
    title = getDesktopFullFilterLabel(section, locale);
    if (entry === "make") {
      title = isBg ? "Марка" : "Make";
    }
    if (entry === "model") {
      title = isBg ? "Модел" : "Model";
    }
  }
  const initialStep: "make" | "model" = entry === "model" ? "model" : "make";
  return { focused, initialStep, isBg, section, title };
}

export function DesktopFullFilterDialog({
  applyLabel,
  draft,
  initialEntry = "vehicle",
  locale,
  modelCounts,
  onApply,
  onChange,
  onOpenChange,
  onReset,
  open,
  taxonomy,
}: DesktopFullFilterDraftProps & {
  applyLabel?: string;
  initialEntry?: DesktopFullFilterEntry;
  onApply: () => void;
  onOpenChange: (open: boolean) => void;
  onReset: () => void;
  open: boolean;
}) {
  const copy = getMarketplaceControlCopy(locale);
  const { focused, initialStep, isBg, section, title } = getDialogPresentation(
    initialEntry,
    locale
  );
  const [group, setGroup] = useState<DesktopFullFilterGroup>(
    getDesktopFullFilterGroup(section)
  );
  const [resetVersion, setResetVersion] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Numeric ranges commit on blur before pointer navigation unmounts their group.
  const commitActiveInput = () => {
    const input = document.activeElement;
    if (input instanceof HTMLInputElement && input.type === "number") {
      input.blur();
    }
  };
  const fieldProps = { draft, locale, onChange };
  const vehicleProps: DesktopFullFilterDraftProps & {
    resetVersion: number;
    vehicleInitialStep: "auto" | "make" | "model";
  } = {
    ...fieldProps,
    modelCounts,
    resetVersion,
    taxonomy,
    vehicleInitialStep: initialStep,
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className={styles.dialog}
        data-filter-entry={initialEntry}
        data-focused={focused}
        data-slot={
          focused
            ? "desktop-focused-filter-dialog"
            : "desktop-full-filter-dialog"
        }
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          const target =
            contentRef.current?.querySelector<HTMLElement>(
              '[data-slot="desktop-full-filter-content"] input:not([disabled])'
            ) ??
            contentRef.current?.querySelector<HTMLElement>(
              '[data-slot="desktop-full-filter-navigation"] [data-state="active"]'
            );
          target?.focus({ preventScroll: true });
        }}
        ref={contentRef}
        showCloseButton={false}
      >
        <DialogHeader className={styles.header}>
          <DialogTitle className="text-dialog-title">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            {focused ? copy.quickFilterDescription : copy.fullFilterDescription}
          </DialogDescription>
          <DialogClose asChild>
            <Button
              aria-label={copy.actions.close}
              className={styles.close}
              data-slot="desktop-full-filter-close"
              size="icon"
              variant="secondary"
            >
              <X aria-hidden="true" size={18} />
            </Button>
          </DialogClose>
        </DialogHeader>
        {focused ? (
          <div
            className={styles.focusedContent}
            data-slot="desktop-full-filter-content"
          >
            <DesktopFullFilterContent
              {...vehicleProps}
              section={section}
              showHeading={false}
            />
          </div>
        ) : (
          <Tabs
            className={styles.workspace}
            onValueChange={(value) => {
              setGroup(value as DesktopFullFilterGroup);
            }}
            value={group}
          >
            <TabsList
              aria-label={isBg ? "Групи филтри" : "Filter groups"}
              className={styles.menu}
              data-slot="desktop-full-filter-navigation"
              onPointerDownCapture={commitActiveInput}
            >
              {desktopFullFilterGroups.map((item) => (
                <TabsTrigger
                  className={styles.menuItem}
                  data-filter-group={item.id}
                  key={item.id}
                  value={item.id}
                >
                  {isBg ? item.bg : item.en}
                </TabsTrigger>
              ))}
            </TabsList>
            {desktopFullFilterGroups.map((item) => (
              <TabsContent
                className={styles.content}
                data-slot="desktop-full-filter-content"
                key={item.id}
                value={item.id}
              >
                {group === item.id ? (
                  <DesktopFullFilterGroupContent
                    {...vehicleProps}
                    group={item}
                    onChooseCategory={() => {
                      const tab =
                        contentRef.current?.querySelector<HTMLButtonElement>(
                          '[data-filter-group="category"]'
                        );
                      tab?.click();
                      tab?.focus({ preventScroll: true });
                    }}
                  />
                ) : null}
              </TabsContent>
            ))}
          </Tabs>
        )}
        <DialogFooter className={styles.footer}>
          <Button
            className={styles.reset}
            data-slot="desktop-full-filter-reset"
            onClick={() => {
              if (focused) {
                onChange(clearDesktopFullFilterSection(section, draft));
              } else {
                onReset();
              }
              setResetVersion((value) => value + 1);
            }}
            variant="secondary"
          >
            {focused ? copy.actions.clear : copy.actions.reset}
          </Button>
          <Button className={styles.apply} onClick={onApply}>
            {applyLabel ?? copy.actions.showResults}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
