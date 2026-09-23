import type { ComponentProps } from "react";
import styles from "./desktop-action-panel.module.css";

/** Shared desktop surface for discovery, appraisal, import and finance. */
export function DesktopActionPanel({
  className = "",
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-desktop-action-panel=""
      {...props}
      className={`${styles.panel} ${className}`}
    />
  );
}
