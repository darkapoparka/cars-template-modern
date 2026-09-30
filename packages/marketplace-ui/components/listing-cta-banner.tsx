import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import Image from "./public-image";

interface ListingCtaBannerProps {
  readonly action: ReactNode;
  readonly artwork: string;
  readonly children?: ReactNode;
  readonly external?: boolean;
  readonly heading: ReactNode;
  readonly headingId?: string;
  readonly href: string;
  readonly slot: string;
}

/** Full-width copy keeps short CTAs readable on the narrowest phones. */
export const ListingCtaBanner = ({
  action,
  artwork,
  children,
  external = false,
  heading,
  headingId,
  href,
  slot,
}: ListingCtaBannerProps) => (
  <Link
    className="group relative isolate flex min-h-48 w-full items-center justify-center overflow-hidden rounded-xl bg-zinc-950 px-4 py-5 text-white focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
    data-slot={slot}
    href={href}
    rel={external ? "noreferrer" : undefined}
    target={external ? "_blank" : undefined}
  >
    <Image
      alt=""
      className="object-cover object-center"
      fill
      sizes="(max-width: 1023px) calc(100vw - 32px), 0px"
      src={artwork}
    />
    <span
      aria-hidden="true"
      className="absolute inset-0 bg-linear-to-b from-black/50 via-black/40 to-black/50"
    />
    <div className="relative z-10 flex w-full min-w-0 flex-col items-center gap-2 text-center">
      <h2
        className="max-w-full font-semibold text-section-title tracking-heading [overflow-wrap:anywhere]"
        id={headingId}
      >
        {heading}
      </h2>
      {children}
      <span className="mt-1 inline-flex min-h-10 max-w-full items-center justify-center gap-1.5 rounded-full bg-white px-3 py-2 font-semibold text-meta text-zinc-950">
        <span data-slot="listing-banner-action">{action}</span>
        <ArrowUpRight
          aria-hidden="true"
          className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
        />
      </span>
    </div>
  </Link>
);
