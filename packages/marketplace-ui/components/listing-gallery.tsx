"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import {
  Dialog,
  DialogTrigger,
} from "@repo/design-system/components/ui/dialog";
import { cn } from "@repo/design-system/lib/utils";
import type { VehicleListingImage } from "@repo/marketplace";
import { Car, Expand } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import {
  getKeyedListingGalleryImages,
  getListingGalleryCopy,
  getNextGalleryIndex,
  getPreviousGalleryIndex,
} from "../lib/listing-gallery-policy";
import { ListingGalleryLightbox } from "./listing-gallery-lightbox";
import { GalleryImageFallback } from "./listing-gallery-primitives";

interface ListingGalleryProps {
  readonly badges?: readonly string[];
  readonly images: readonly VehicleListingImage[];
  readonly locale?: string;
  readonly title: string;
  readonly unoptimized?: boolean;
}

export const ListingGallery = ({
  badges = [],
  images,
  locale,
  title,
  unoptimized = false,
}: ListingGalleryProps) => {
  const [failedImageUrls, setFailedImageUrls] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedImage = images[selectedIndex];
  const imageCount = images.length;
  const copy = getListingGalleryCopy(locale);
  const keyedImages = getKeyedListingGalleryImages(images);
  const secondaryImages = keyedImages
    .filter(({ imageIndex }) => imageIndex !== selectedIndex)
    .slice(0, 2);

  const markImageFailed = (url: string) => {
    setFailedImageUrls((current) => {
      if (current.has(url)) {
        return current;
      }
      const next = new Set(current);
      next.add(url);
      return next;
    });
  };

  const selectPrevious = () =>
    setSelectedIndex((current) => getPreviousGalleryIndex(current, imageCount));
  const selectNext = () =>
    setSelectedIndex((current) => getNextGalleryIndex(current, imageCount));

  if (!selectedImage) {
    return (
      <section
        aria-label={`${title} ${copy.photos}`}
        className="flex h-[min(75vw,360px)] w-full items-center justify-center bg-muted text-muted-foreground lg:h-[clamp(24rem,38vw,31rem)] lg:rounded-lg"
        data-slot="listing-gallery-empty"
      >
        <div className="text-center">
          <Car aria-hidden="true" className="mx-auto size-10" />
          <p className="mt-3 text-sm">{copy.noPhotos}</p>
        </div>
      </section>
    );
  }

  return (
    <Dialog>
      <section
        aria-label={`${title} ${copy.photos}`}
        className="lg:space-y-2"
        data-slot="listing-gallery"
      >
        <div
          className={cn(
            "relative h-[min(75vw,360px)] w-full overflow-hidden bg-muted lg:h-[clamp(24rem,38vw,31rem)] lg:rounded-lg",
            imageCount > 1 &&
              "lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(14rem,1fr)] lg:gap-2 lg:bg-transparent"
          )}
          data-slot="listing-gallery-stage"
        >
          <DialogTrigger asChild>
            <button
              aria-label={copy.openPhoto(selectedIndex + 1, imageCount)}
              className="group relative block h-full w-full overflow-hidden bg-muted text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:rounded-lg"
              type="button"
            >
              {failedImageUrls.has(selectedImage.url) ? (
                <GalleryImageFallback copy={copy} title={title} />
              ) : (
                <Image
                  alt={selectedImage.alt || title}
                  className="object-cover object-[center_75%] lg:object-center lg:transition-transform lg:duration-200 lg:motion-reduce:transition-none lg:group-hover:scale-[1.01] lg:motion-reduce:group-hover:scale-100"
                  fetchPriority={selectedIndex === 0 ? "high" : "auto"}
                  fill
                  loading="eager"
                  onError={() => markImageFailed(selectedImage.url)}
                  preload={selectedIndex === 0}
                  referrerPolicy="no-referrer"
                  sizes={
                    imageCount > 1
                      ? "(max-width: 1023px) 100vw, 66vw"
                      : "(max-width: 1023px) 100vw, 1000px"
                  }
                  src={selectedImage.url}
                  unoptimized={unoptimized}
                />
              )}
              <span className="absolute right-3 bottom-7 inline-flex h-9 items-center gap-2 rounded-full bg-background px-3 font-medium text-foreground text-xs shadow-sm lg:bottom-3 lg:rounded-md lg:bg-background/90 lg:backdrop-blur">
                <Expand aria-hidden="true" className="size-4" />
                <span className="hidden lg:inline">{copy.viewFullScreen}</span>
                <span className="lg:hidden">{imageCount}</span>
              </span>
            </button>
          </DialogTrigger>

          <div
            className={cn(
              "hidden gap-2 lg:grid",
              imageCount > 2 ? "lg:grid-rows-2" : "lg:grid-rows-1"
            )}
            data-slot="listing-gallery-secondary-grid"
          >
            {secondaryImages.map(({ image, imageIndex, key }, tileIndex) => (
              <DialogTrigger asChild key={key}>
                <button
                  aria-label={copy.openPhoto(imageIndex + 1, imageCount)}
                  className="group relative min-h-0 overflow-hidden rounded-lg bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  onClick={() => setSelectedIndex(imageIndex)}
                  type="button"
                >
                  {failedImageUrls.has(image.url) ? (
                    <GalleryImageFallback compact copy={copy} title={title} />
                  ) : (
                    <Image
                      alt={image.alt || copy.photoAlt(title, imageIndex + 1)}
                      className="object-cover transition-transform duration-200 group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                      fill
                      onError={() => markImageFailed(image.url)}
                      referrerPolicy="no-referrer"
                      sizes="320px"
                      src={image.url}
                      unoptimized={unoptimized}
                    />
                  )}
                  {tileIndex === 1 && imageCount > 3 ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-foreground/55 font-semibold text-background text-sm">
                      +{imageCount - 3} {copy.photos}
                    </span>
                  ) : null}
                </button>
              </DialogTrigger>
            ))}
          </div>

          {badges.length > 0 ? (
            <div className="pointer-events-none absolute top-3 left-3 hidden flex-wrap gap-1.5 lg:flex">
              {badges.map((badge) => (
                <Badge
                  className="rounded-md border-border bg-background/95 text-foreground shadow-sm"
                  key={badge}
                  variant="secondary"
                >
                  {badge}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        {imageCount > 1 ? (
          <fieldset
            className="hidden gap-2 overflow-x-auto pb-1 lg:flex"
            data-slot="listing-gallery-thumbnails"
          >
            <legend className="sr-only">{copy.choosePhoto}</legend>
            {keyedImages.map(({ image, imageIndex, key }) => (
              <button
                aria-label={copy.showPhoto(imageIndex + 1, imageCount)}
                aria-pressed={selectedIndex === imageIndex}
                className={cn(
                  "relative h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  selectedIndex === imageIndex
                    ? "border-foreground"
                    : "border-transparent"
                )}
                key={key}
                onClick={() => setSelectedIndex(imageIndex)}
                type="button"
              >
                {failedImageUrls.has(image.url) ? (
                  <GalleryImageFallback compact copy={copy} title={title} />
                ) : (
                  <Image
                    alt=""
                    className="object-cover"
                    fill
                    onError={() => markImageFailed(image.url)}
                    referrerPolicy="no-referrer"
                    sizes="96px"
                    src={image.url}
                    unoptimized={unoptimized}
                  />
                )}
              </button>
            ))}
          </fieldset>
        ) : null}
      </section>

      <ListingGalleryLightbox
        copy={copy}
        failedImageUrls={failedImageUrls}
        imageCount={imageCount}
        onImageFailed={markImageFailed}
        onNext={selectNext}
        onPrevious={selectPrevious}
        selectedImage={selectedImage}
        selectedIndex={selectedIndex}
        title={title}
        unoptimized={unoptimized}
      />
    </Dialog>
  );
};
