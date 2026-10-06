"use client";

import {
  Dialog,
  DialogTrigger,
} from "@repo/design-system/components/ui/dialog";
import type { VehicleListingImage } from "@repo/marketplace";
import { Car, Expand } from "lucide-react";
import { useState } from "react";
import {
  getKeyedListingGalleryImages,
  getListingGalleryCopy,
  getNextGalleryIndex,
  getPreviousGalleryIndex,
} from "../lib/listing-gallery-policy";
import { ListingGalleryLightbox } from "./listing-gallery-lightbox";
import { GalleryImageFallback } from "./listing-gallery-primitives";
import Image from "./public-image";

/** Mobile photo tiles use the same source images and full-screen viewer as the hero. */
export function ListingPhotoGrid({
  images,
  locale,
  title,
}: {
  readonly images: readonly VehicleListingImage[];
  readonly locale?: string;
  readonly title: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [failedImageUrls, setFailedImageUrls] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const copy = getListingGalleryCopy(locale);
  const selectedImage = images[selectedIndex];
  const markImageFailed = (url: string) => {
    setFailedImageUrls((current) => new Set(current).add(url));
  };

  if (!selectedImage) {
    return (
      <div className="rounded-2xl bg-zinc-100 px-4 py-8 text-center text-muted-foreground">
        <Car aria-hidden="true" className="mx-auto mb-3 size-8" />
        <p className="text-meta">{copy.noPhotos}</p>
      </div>
    );
  }

  return (
    <Dialog>
      <div
        className={`grid gap-2 ${images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
        data-slot="listing-photo-grid"
      >
        {getKeyedListingGalleryImages(images).map(
          ({ image, imageIndex, key }) => (
            <DialogTrigger asChild key={key}>
              <button
                aria-label={copy.openPhoto(imageIndex + 1, images.length)}
                className="relative aspect-[4/3] min-w-0 overflow-hidden rounded-xl bg-zinc-100 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
                onClick={() => setSelectedIndex(imageIndex)}
                type="button"
              >
                {failedImageUrls.has(image.url) ? (
                  <GalleryImageFallback compact copy={copy} title={title} />
                ) : (
                  <Image
                    alt={image.alt || copy.photoAlt(title, imageIndex + 1)}
                    className="object-cover"
                    fill
                    onError={() => markImageFailed(image.url)}
                    referrerPolicy="no-referrer"
                    sizes={
                      images.length > 1
                        ? "(max-width: 1023px) calc((100vw - 40px) / 2), 0px"
                        : "(max-width: 1023px) calc(100vw - 32px), 0px"
                    }
                    src={image.url}
                  />
                )}
                <span className="absolute right-2 bottom-2 grid size-8 place-items-center rounded-full bg-black/55 text-white">
                  <Expand aria-hidden="true" className="size-4" />
                </span>
              </button>
            </DialogTrigger>
          )
        )}
      </div>
      <ListingGalleryLightbox
        copy={copy}
        failedImageUrls={failedImageUrls}
        imageCount={images.length}
        onImageFailed={markImageFailed}
        onNext={() =>
          setSelectedIndex((current) =>
            getNextGalleryIndex(current, images.length)
          )
        }
        onPrevious={() =>
          setSelectedIndex((current) =>
            getPreviousGalleryIndex(current, images.length)
          )
        }
        selectedImage={selectedImage}
        selectedIndex={selectedIndex}
        title={title}
        unoptimized={false}
      />
    </Dialog>
  );
}
