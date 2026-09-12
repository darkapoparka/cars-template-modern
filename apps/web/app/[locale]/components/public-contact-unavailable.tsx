import { leadSite } from "@repo/marketplace";
import { Phone } from "lucide-react";

export const PublicContactUnavailable = ({
  locale,
}: {
  locale: "bg" | "en";
}) => (
  <div className="space-y-3" data-slot="public-contact-unavailable">
    <a
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 font-semibold text-[15px] text-white hover:bg-black focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
      href={leadSite.phoneHref}
    >
      <Phone aria-hidden="true" className="size-4" />
      {locale === "bg" ? "Обадете се" : "Call us"} · {leadSite.phoneDisplay}
    </a>
  </div>
);
