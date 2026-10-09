"use client";

import Link from "next/link";
import { type ComponentProps, useEffect, useState } from "react";
import {
  getInventoryReturnHref,
  prepareInventoryReturn,
} from "../lib/inventory-return";

export function ListingBackLink({
  href,
  onNavigate,
  ...props
}: ComponentProps<typeof Link> & { href: string }) {
  const [returnHref, setReturnHref] = useState(href);
  useEffect(() => setReturnHref(getInventoryReturnHref(href)), [href]);
  return (
    <Link
      {...props}
      href={returnHref}
      onNavigate={(event) => {
        let cancelled = false;
        onNavigate?.({
          preventDefault: () => {
            cancelled = true;
            event.preventDefault();
          },
        });
        if (!cancelled) {
          prepareInventoryReturn(returnHref);
        }
      }}
      scroll={false}
    />
  );
}
