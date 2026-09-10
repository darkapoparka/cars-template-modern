import { Button } from "@repo/design-system/components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";
import type { VehicleListingImage } from "@repo/marketplace";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import type { KeyboardEvent } from "react";
import type { ListingGalleryCopy } from "../lib/listing-gallery-policy";
import { GalleryImageFallback } from "./listing-gallery-primitives";

export const ListingGalleryLightbox = ({
  copy,
  failedImageUrls,
  imageCount,
  onImageFailed,
  onNext,
  onPrevious,
  selectedImage,
  selectedIndex,
  title,
  unoptimized,
}: {
  copy: ListingGalleryCopy;
  failedImageUrls: ReadonlySet<string>;
  imageCount: number;
  onImageFailed: (url: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  selectedImage: VehicleListingImage;
  selectedIndex: number;
  title: string;
  unoptimized: boolean;
}) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      onPrevious();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      onNext();
    }
  };

  return (
    <DialogContent
      className="flex h-[100dvh] max-h-none w-screen max-w-none flex-col overflow-hidden rounded-none border-0 bg-black p-0 text-white sm:max-w-none"
      data-mobile-overlay="fullscreen"
      data-slot="listing-gallery-lightbox"
      onKeyDown={handleKeyDown}
      showCloseButton={false}
    >
      <DialogTitle className="sr-only">
        {title} {copy.gallery}
      </DialogTitle>
      <DialogDescription className="sr-only">
        {copy.description(selectedIndex + 1, imageCount)}
      </DialogDescription>
      <DialogClose
        aria-label={copy.closeGallery}
        className="absolute top-[calc(0.75rem+env(safe-area-inset-top))] right-3 z-20 grid size-11 place-items-center rounded-full bg-black/65 text-white transition-colors hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      >
        <X aria-hidden="true" className="size-5" />
      </DialogClose>
      <div className="relative min-h-0 flex-1">
        {failedImageUrls.has(selectedImage.url) ? (
          <GalleryImageFallback copy={copy} dark title={title} />
        ) : (
          <Image
            alt={selectedImage.alt || title}
            className="object-contain"
            fill
            onError={() => onImageFailed(selectedImage.url)}
            referrerPolicy="no-referrer"
            sizes="100vw"
            src={selectedImage.url}
            unoptimized={unoptimized}
          />
        )}
      </div>
      <p
        aria-live="polite"
        className="absolute bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1.5 text-sm"
      >
        {selectedIndex + 1} / {imageCount}
      </p>
      {imageCount > 1 ? (
        <>
          <Button
            aria-label={copy.previousPhoto}
            className="absolute top-1/2 left-3 z-10 size-11 -translate-y-1/2 rounded-full bg-black/65 text-white hover:bg-black/80"
            onClick={onPrevious}
            size="icon"
            type="button"
            variant="ghost"
          >
            <ChevronLeft aria-hidden="true" className="size-6" />
          </Button>
          <Button
            aria-label={copy.nextPhoto}
            className="absolute top-1/2 right-3 z-10 size-11 -translate-y-1/2 rounded-full bg-black/65 text-white hover:bg-black/80"
            onClick={onNext}
            size="icon"
            type="button"
            variant="ghost"
          >
            <ChevronRight aria-hidden="true" className="size-6" />
          </Button>
        </>
      ) : null}
    </DialogContent>
  );
};
