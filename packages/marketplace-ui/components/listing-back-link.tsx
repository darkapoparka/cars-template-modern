"use client";

import Link from "next/link";
import { type ComponentProps, useEffect, useState } from "react";
import { getInventoryReturnHref } from "../lib/inventory-return";

export function ListingBackLink({
  href,
  ...props
}: ComponentProps<typeof Link> & { href: string }) {
  const [returnHref, setReturnHref] = useState(href);
  useEffect(() => setReturnHref(getInventoryReturnHref(href)), [href]);
  return <Link {...props} href={returnHref} scroll={false} />;
}
