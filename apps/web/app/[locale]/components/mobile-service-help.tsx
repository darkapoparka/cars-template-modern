"use client";

import { DealerMobileHeaderIcon } from "@repo/marketplace-ui/components/dealer-mobile-header-icon";
import { mobileHeaderIconActionClassName } from "@repo/marketplace-ui/lib/mobile-header-icon-action";
import { Info } from "lucide-react";
import {
  type ComponentProps,
  type MouseEventHandler,
  type Ref,
  useEffect,
  useRef,
  useState,
} from "react";

import { MobileServiceHelpDrawer } from "./mobile-service-help-drawer";

export function MobileServiceHelpButton({
  disabled = false,
  title,
  onClick,
  ref,
}: {
  title: string;
  disabled?: boolean;
  onClick: MouseEventHandler<HTMLButtonElement>;
  ref?: Ref<HTMLButtonElement>;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <button
      aria-haspopup="dialog"
      aria-label={title}
      className={mobileHeaderIconActionClassName}
      data-slot="mobile-service-help"
      disabled={disabled || !ready}
      onClick={onClick}
      ref={ref}
      title={title}
      type="button"
    >
      <DealerMobileHeaderIcon icon={Info} kind="info" />
    </button>
  );
}

export function MobileServiceHelp(
  props: Omit<
    ComponentProps<typeof MobileServiceHelpDrawer>,
    "open" | "onOpenChange" | "onRestoreFocus"
  >
) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <MobileServiceHelpButton
        onClick={() => setOpen(true)}
        ref={triggerRef}
        title={props.title}
      />
      <MobileServiceHelpDrawer
        {...props}
        onOpenChange={setOpen}
        onRestoreFocus={() =>
          triggerRef.current?.focus({ preventScroll: true })
        }
        open={open}
      />
    </>
  );
}
