"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";
import { cn } from "@repo/design-system/lib/utils";
import {
  type ComponentProps,
  type ReactNode,
  type RefObject,
  useRef,
} from "react";
import {
  mobileMarketplaceOverlayFieldClassName,
  mobileMarketplaceOverlayIconActionClassName,
  mobileMarketplaceOverlayInputClassName,
  mobileMarketplaceOverlayScrollClassName,
} from "../lib/mobile-overlay-styles";
import { DealerUiIcon } from "./dealer-ui-icon";

export {
  mobileMarketplaceOverlayFieldClassName,
  mobileMarketplaceOverlayFieldRowClassName,
  mobileMarketplaceOverlayIconActionClassName,
  mobileMarketplaceOverlayInputClassName,
  mobileMarketplaceOverlayPrimaryActionClassName,
  mobileMarketplaceOverlayScrollClassName,
} from "../lib/mobile-overlay-styles";

/** One entry field for inventory, vehicle selection, listing links and VIN. */
export const MobileMarketplaceOverlayField = ({
  className,
  clearAction,
  icon,
  inputClassName,
  inputRef,
  ...inputProps
}: Omit<ComponentProps<"input">, "className" | "ref"> & {
  readonly className?: string;
  readonly clearAction?: {
    readonly label: string;
    readonly onClear: () => void;
  };
  readonly icon?: ReactNode;
  readonly inputClassName?: string;
  readonly inputRef?: RefObject<HTMLInputElement | null>;
}) => {
  const localRef = useRef<HTMLInputElement>(null);
  const ref = inputRef ?? localRef;
  return (
    <div className={cn(mobileMarketplaceOverlayFieldClassName, className)}>
      {icon}
      <input
        autoComplete="off"
        className={cn(mobileMarketplaceOverlayInputClassName, inputClassName)}
        ref={ref}
        spellCheck={false}
        {...inputProps}
      />
      {clearAction && String(inputProps.value ?? "").length > 0 ? (
        <MobileMarketplaceOverlayIconAction
          ariaLabel={clearAction.label}
          disabled={inputProps.disabled || inputProps.readOnly}
          onClick={() => {
            clearAction.onClear();
            ref.current?.focus({ preventScroll: true });
          }}
        >
          <DealerUiIcon className="size-[18px]" name="close" />
        </MobileMarketplaceOverlayIconAction>
      ) : null}
    </div>
  );
};

interface MobileMarketplaceOverlayShellProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly contentDataSlot?: string;
  readonly onCloseAutoFocus?: (event: Event) => void;
  readonly onOpenAutoFocus?: (event: Event) => void;
  readonly onOpenChange: (open: boolean) => void;
  readonly open: boolean;
  readonly presentation?: "fullscreen" | "sheet";
}

export const MobileMarketplaceOverlayShell = ({
  presentation = "fullscreen",
  children,
  className,
  contentDataSlot = "mobile-marketplace-overlay",
  onCloseAutoFocus,
  onOpenAutoFocus,
  onOpenChange,
  open,
}: MobileMarketplaceOverlayShellProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className={cn(
          "data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100 top-0 left-0 z-[70] flex h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 bg-white p-0 shadow-none sm:max-w-none sm:rounded-none",
          presentation === "sheet" &&
            "top-auto bottom-[var(--mobile-keyboard-inset,0px)] h-auto max-h-[min(85dvh,var(--mobile-visible-height,100dvh))] rounded-t-3xl sm:rounded-t-3xl",
          className
        )}
        data-mobile-overlay={presentation}
        data-slot={contentDataSlot}
        onCloseAutoFocus={onCloseAutoFocus}
        onOpenAutoFocus={(event) => {
          onOpenAutoFocus?.(event);
          if (!event.defaultPrevented) {
            event.preventDefault();
            contentRef.current?.focus({ preventScroll: true });
          }
        }}
        ref={contentRef}
        showCloseButton={false}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
};

export const MobileMarketplaceOverlayHeader = ({
  description,
  leftAction,
  rightAction,
  title,
}: {
  readonly description: string;
  readonly leftAction?: ReactNode;
  readonly rightAction?: ReactNode;
  readonly title: string;
}) => (
  <DialogHeader
    className="shrink-0 gap-0 bg-white text-left"
    data-slot="mobile-marketplace-overlay-header"
  >
    <div className="grid min-h-16 grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
      <div className="flex justify-start">{leftAction}</div>
      <DialogTitle className="whitespace-normal text-balance break-words text-center font-medium text-card-title-lg tracking-normal">
        {title}
      </DialogTitle>
      <div className="flex justify-end">{rightAction}</div>
    </div>
    <DialogDescription className="sr-only">{description}</DialogDescription>
  </DialogHeader>
);

export const MobileMarketplaceOverlay = ({
  presentation,
  bodyClassName,
  children,
  contentClassName,
  contentDataSlot,
  description,
  footer,
  leftAction,
  onCloseAutoFocus,
  onOpenAutoFocus,
  onOpenChange,
  open,
  rightAction,
  title,
}: {
  readonly presentation?: "fullscreen" | "sheet";
  readonly bodyClassName?: string;
  readonly children: ReactNode;
  readonly contentClassName?: string;
  readonly contentDataSlot?: string;
  readonly description: string;
  readonly footer?: ReactNode;
  readonly leftAction?: ReactNode;
  readonly onCloseAutoFocus?: (event: Event) => void;
  readonly onOpenAutoFocus?: (event: Event) => void;
  readonly onOpenChange: (open: boolean) => void;
  readonly open: boolean;
  readonly rightAction?: ReactNode;
  readonly title: string;
}) => (
  <MobileMarketplaceOverlayShell
    className={contentClassName}
    contentDataSlot={contentDataSlot}
    onCloseAutoFocus={onCloseAutoFocus}
    onOpenAutoFocus={onOpenAutoFocus}
    onOpenChange={onOpenChange}
    open={open}
    presentation={presentation}
  >
    <MobileMarketplaceOverlayHeader
      description={description}
      leftAction={leftAction}
      rightAction={rightAction}
      title={title}
    />

    <div
      className={cn(mobileMarketplaceOverlayScrollClassName, bodyClassName)}
      data-slot="mobile-marketplace-overlay-scroll-body"
    >
      {children}
    </div>
    {footer ? (
      <div
        className="shrink-0 border-border border-t bg-white px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]"
        data-slot="mobile-marketplace-overlay-footer"
      >
        {footer}
      </div>
    ) : null}
  </MobileMarketplaceOverlayShell>
);

export const MobileMarketplaceOverlayIconAction = ({
  ariaLabel,
  children,
  disabled,
  onClick,
}: {
  readonly ariaLabel: string;
  readonly children: ReactNode;
  readonly disabled?: boolean;
  readonly onClick: () => void;
}) => (
  <Button
    aria-label={ariaLabel}
    className={mobileMarketplaceOverlayIconActionClassName}
    disabled={disabled}
    onClick={onClick}
    size="icon"
    title={ariaLabel}
    type="button"
    variant="ghost"
  >
    {children}
  </Button>
);

export const MobileMarketplaceOverlayCloseAction = ({
  ariaLabel,
}: {
  readonly ariaLabel: string;
}) => (
  <DialogClose asChild>
    <Button
      aria-label={ariaLabel}
      className={mobileMarketplaceOverlayIconActionClassName}
      size="icon"
      title={ariaLabel}
      type="button"
      variant="ghost"
    >
      <DealerUiIcon className="size-[18px]" name="close" />
    </Button>
  </DialogClose>
);

export const MobileMarketplaceOverlayBackAction = ({
  ariaLabel,
  onClick,
}: {
  readonly ariaLabel: string;
  readonly onClick: () => void;
}) => (
  <MobileMarketplaceOverlayIconAction ariaLabel={ariaLabel} onClick={onClick}>
    <DealerUiIcon className="size-5" name="back" />
  </MobileMarketplaceOverlayIconAction>
);

export const MobileMarketplaceOverlayBackOrCancelAction = ({
  backLabel,
  cancelLabel,
  onBack,
  onCancel,
  showBack,
}: {
  readonly backLabel: string;
  readonly cancelLabel: string;
  readonly onBack: () => void;
  readonly onCancel: () => void;
  readonly showBack: boolean;
}) => (
  <MobileMarketplaceOverlayIconAction
    ariaLabel={showBack ? backLabel : cancelLabel}
    onClick={showBack ? onBack : onCancel}
  >
    {showBack ? (
      <DealerUiIcon className="size-5" name="back" />
    ) : (
      <DealerUiIcon className="size-[18px]" name="close" />
    )}
  </MobileMarketplaceOverlayIconAction>
);
