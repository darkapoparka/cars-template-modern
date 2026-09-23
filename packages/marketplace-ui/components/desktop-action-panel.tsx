import { Button } from "@repo/design-system/components/ui/button";
import type { ComponentProps } from "react";
import styles from "./desktop-action-panel.module.css";

/** Shared desktop surface for discovery, appraisal, import and finance. */
export function DesktopActionPanel({
  className = "",
  fitContent = false,
  ...props
}: ComponentProps<"div"> & { fitContent?: boolean }) {
  return (
    <div
      data-desktop-action-panel=""
      data-fit-content={fitContent || undefined}
      {...props}
      className={`${styles.panel} ${className}`}
    />
  );
}

/** One primary action treatment; inset actions fit inside search/link fields. */
export function DesktopActionButton({
  className = "",
  inset = false,
  ...props
}: ComponentProps<typeof Button> & { inset?: boolean }) {
  return (
    <Button
      {...props}
      className={`${styles.action} ${className}`}
      data-inset={inset || undefined}
    />
  );
}
