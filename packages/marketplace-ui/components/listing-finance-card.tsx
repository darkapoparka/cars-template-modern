import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Image from "./public-image";

export function ListingFinanceCard({
  artwork,
  href,
  locale,
}: {
  readonly artwork: string;
  readonly href: string;
  readonly locale?: string;
}) {
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;

  return (
    <Link
      className="relative isolate grid min-h-52 place-items-center overflow-hidden rounded-2xl bg-zinc-950 px-5 py-5 text-white focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-[-4px]"
      data-slot="listing-financing-card"
      href={href}
    >
      <Image
        alt=""
        className="object-cover object-right"
        data-slot="listing-financing-artwork"
        fill
        sizes="(max-width: 1023px) calc(100vw - 32px), 0px"
        src={artwork}
      />
      <div aria-hidden="true" className="absolute inset-0 bg-black/45" />
      <div className="relative flex flex-col items-center gap-2 text-center">
        <h2 className="font-semibold text-4xl tracking-heading">
          {isBg ? "Лизинг" : "Leasing"}
        </h2>
        <p className="max-w-60 text-meta text-white/90">
          {isBg ? "Твоят следващ автомобил." : "Your next car."}{" "}
          <span className="block">
            {isBg ? "На месечни вноски." : "With monthly payments."}
          </span>
        </p>
        <span className="mt-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-4 py-2 font-semibold text-meta text-zinc-950">
          <span data-slot="listing-banner-action">
            {isBg ? "Виж условията" : "Explore options"}
          </span>
          <ArrowUpRight aria-hidden="true" className="size-4 shrink-0" />
        </span>
      </div>
    </Link>
  );
}
