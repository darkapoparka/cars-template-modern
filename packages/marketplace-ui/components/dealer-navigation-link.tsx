"use client";

import { withoutBasePath } from "@repo/internationalization/paths";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

/** Re-selecting the current destination must not reset scroll or search state. */
export function DealerNavigationLink(props: ComponentProps<typeof Link>) {
  const pathname = usePathname();
  return (
    <Link
      {...props}
      onNavigate={(event) => {
        if (
          typeof props.href === "string" &&
          withoutBasePath(pathname) === props.href
        ) {
          event.preventDefault();
        }
        props.onNavigate?.(event);
      }}
    />
  );
}
