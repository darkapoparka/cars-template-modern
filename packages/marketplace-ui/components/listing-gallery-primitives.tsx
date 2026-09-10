import { cn } from "@repo/design-system/lib/utils";
import { Car } from "lucide-react";
import type { ListingGalleryCopy } from "../lib/listing-gallery-policy";

export const GalleryImageFallback = ({
  compact = false,
  copy,
  dark = false,
  title,
}: {
  compact?: boolean;
  copy: ListingGalleryCopy;
  dark?: boolean;
  title: string;
}) => (
  <div
    aria-label={`${title}. ${copy.imageUnavailable}`}
    className={cn(
      "absolute inset-0 grid place-items-center px-4 text-center",
      dark ? "bg-zinc-950 text-zinc-200" : "bg-control text-muted-foreground"
    )}
    role="img"
  >
    <div>
      <Car
        aria-hidden="true"
        className={cn("mx-auto", compact ? "size-6" : "size-10")}
        strokeWidth={1.6}
      />
      {compact ? null : (
        <>
          <p className="mt-3 font-semibold text-sm">{copy.imageUnavailable}</p>
          <p
            className={cn(
              "mt-1 text-xs",
              dark ? "text-zinc-400" : "text-muted-foreground"
            )}
          >
            {copy.imageUnavailableHint}
          </p>
        </>
      )}
    </div>
  </div>
);
