"use client";

import { ImageOff } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface SupportRouteImageProps {
  readonly alt: string;
  readonly fallbackLabel: string;
  readonly loading?: "eager" | "lazy";
  readonly sizes: string;
  readonly src: string;
}

export const SupportRouteImage = ({
  alt,
  fallbackLabel,
  loading = "lazy",
  sizes,
  src,
}: SupportRouteImageProps) => {
  const [failed, setFailed] = useState(false);

  return (
    <div className="absolute inset-0" data-slot="support-route-image">
      {failed ? (
        <div
          aria-label={`${alt}. ${fallbackLabel}`}
          className="grid h-full place-items-center bg-secondary px-6 text-center text-muted-foreground"
          data-slot="support-route-image-fallback"
          role="img"
        >
          <span className="grid justify-items-center gap-2 text-sm">
            <ImageOff aria-hidden="true" className="size-6" />
            <span>{fallbackLabel}</span>
          </span>
        </div>
      ) : (
        <Image
          alt={alt}
          className="object-cover"
          fill
          loading={loading}
          onError={() => setFailed(true)}
          sizes={sizes}
          src={src}
        />
      )}
    </div>
  );
};
