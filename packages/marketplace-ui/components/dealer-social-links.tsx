import type { LeadSiteConfig } from "@repo/marketplace";
import { Music2 } from "lucide-react";
import Image from "next/image";

const socialPlatforms = [
  { key: "instagram", label: "Instagram" },
  { key: "youtube", label: "YouTube" },
  { key: "facebook", label: "Facebook" },
  { key: "tiktok", label: "TikTok" },
] as const;

function SocialBrandIcon({
  platform,
}: {
  platform: (typeof socialPlatforms)[number]["key"];
}) {
  if (platform === "tiktok") {
    return <Music2 aria-hidden="true" className="size-7" />;
  }
  if (platform === "instagram") {
    return (
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[radial-gradient(circle_at_30%_105%,#ffd600_0%,#ff7a00_25%,#ff0069_50%,#d300c5_75%,#7638fa_100%)]">
        <Image
          alt=""
          aria-hidden="true"
          className="size-[19px]"
          height={19}
          src="/images/social/instagram-white.svg"
          width={19}
        />
      </span>
    );
  }
  return (
    <span className="relative grid size-7 shrink-0 place-items-center">
      <Image
        alt=""
        aria-hidden="true"
        className={
          platform === "youtube"
            ? "absolute top-1/2 left-1/2 h-9 w-[42px] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
            : "size-7 object-contain"
        }
        height={platform === "youtube" ? 36 : 28}
        sizes={platform === "youtube" ? "42px" : "28px"}
        src={`/images/social/${platform}.png`}
        width={platform === "youtube" ? 42 : 28}
      />
    </span>
  );
}

export function DealerSocialLinks({
  links,
  isBg,
}: {
  links: LeadSiteConfig["socialLinks"];
  isBg: boolean;
}) {
  const configured = socialPlatforms.filter(
    (platform) => links?.[platform.key]
  );
  if (!configured.length) {
    return null;
  }
  return (
    <nav
      aria-label={isBg ? "Социални мрежи" : "Social media"}
      className="mt-4 grid grid-cols-3 gap-2"
      data-slot="dealer-social-links"
    >
      {configured.map(({ key, label }) =>
        links?.[key] ? (
          <a
            aria-label={`${label} — ${isBg ? "отваря нов раздел" : "opens in a new tab"}`}
            className="flex min-h-16 min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl bg-zinc-100 px-2 py-3 font-medium text-[12px] text-zinc-950 hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 active:bg-zinc-200"
            href={links?.[key]}
            key={key}
            rel="noopener noreferrer"
            target="_blank"
          >
            <SocialBrandIcon platform={key} />
            <span>{label}</span>
          </a>
        ) : (
          <button
            aria-label={`${label} — ${isBg ? "очаквайте скоро" : "coming soon"}`}
            className="flex min-h-16 min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl bg-zinc-100 px-2 py-3 font-medium text-[12px] text-zinc-950"
            disabled
            key={key}
            title={isBg ? "Очаквайте скоро" : "Coming soon"}
            type="button"
          >
            <SocialBrandIcon platform={key} />
            <span>{label}</span>
          </button>
        )
      )}
    </nav>
  );
}
