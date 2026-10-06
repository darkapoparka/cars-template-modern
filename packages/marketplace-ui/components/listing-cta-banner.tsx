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
  readonly layout: "split" | "photo";
  readonly slot: string;
}

const bannerLayouts = {
  split: {
    frame: "min-h-40 items-end",
    wash: "bg-linear-to-r from-zinc-950/85 via-zinc-950/25 to-transparent",
    copy: "flex-row items-end justify-between gap-3 text-left",
    body: "flex-1 gap-1",
    action: "shrink-0",
  },
  photo: {
    frame: "min-h-44 items-end",
    wash: "bg-linear-to-t from-zinc-950 via-zinc-950/55 to-transparent",
    copy: "flex-col items-start gap-2 text-left",
    body: "gap-2",
    action: "mt-2",
  },
} as const;

/** Keep imagery decorative and the title, copy and action in normal flow. */
export const ListingCtaBanner = ({
  action,
  artwork,
  children,
  external = false,
  heading,
  headingId,
  href,
  layout,
  slot,
}: ListingCtaBannerProps) => {
  const styles = bannerLayouts[layout];

  return (
    <Link
      className={`group relative isolate flex w-full overflow-hidden rounded-2xl bg-zinc-950 p-4 text-white focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-[-4px] ${styles.frame}`}
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
      <span aria-hidden="true" className={`absolute inset-0 ${styles.wash}`} />
      <div className={`relative z-10 flex w-full min-w-0 ${styles.copy}`}>
        <div className={`flex min-w-0 flex-col ${styles.body}`}>
          <h2
            className="max-w-full font-semibold text-card-title-lg tracking-heading [overflow-wrap:anywhere]"
            id={headingId}
          >
            {heading}
          </h2>
          {children}
        </div>
        <span
          className={`inline-flex min-h-11 max-w-full items-center justify-center gap-1.5 rounded-full bg-white px-3 py-2 font-semibold text-meta text-zinc-950 ${styles.action}`}
        >
          <span data-slot="listing-banner-action">{action}</span>
          <ArrowUpRight
            aria-hidden="true"
            className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
          />
        </span>
      </div>
    </Link>
  );
};
