import type { VehicleListingImage } from "@repo/marketplace";

export const getListingGalleryCopy = (locale?: string) => {
  if (locale?.toLowerCase().startsWith("bg")) {
    return {
      choosePhoto: "Изберете снимка",
      description: (index: number, count: number) =>
        `Снимка ${index} от ${count}. Използвайте стрелките наляво и надясно за навигация.`,
      gallery: "галерия",
      imageUnavailable: "Снимката не е налична",
      imageUnavailableHint: "Данните за автомобила остават достъпни по-долу.",
      nextPhoto: "Следваща снимка",
      noPhotos: "Няма добавени снимки",
      openPhoto: (index: number, count: number) =>
        `Отвори снимка ${index} от ${count} на цял екран`,
      photoAlt: (title: string, index: number) => `${title}, снимка ${index}`,
      photos: "снимки",
      previousPhoto: "Предишна снимка",
      closeGallery: "Затвори галерията",
      showPhoto: (index: number, count: number) =>
        `Покажи снимка ${index} от ${count}`,
      viewFullScreen: "Отвори галерията",
    } as const;
  }

  return {
    choosePhoto: "Choose a vehicle photo",
    description: (index: number, count: number) =>
      `Photo ${index} of ${count}. Use the left and right arrow keys to move between photos.`,
    gallery: "photo gallery",
    imageUnavailable: "Photo unavailable",
    imageUnavailableHint: "Vehicle details remain available below.",
    nextPhoto: "Next photo",
    noPhotos: "No photos supplied",
    openPhoto: (index: number, count: number) =>
      `Open photo ${index} of ${count} full screen`,
    photoAlt: (title: string, index: number) => `${title}, photo ${index}`,
    photos: "photos",
    previousPhoto: "Previous photo",
    closeGallery: "Close gallery",
    showPhoto: (index: number, count: number) =>
      `Show photo ${index} of ${count}`,
    viewFullScreen: "View full screen",
  } as const;
};

export type ListingGalleryCopy = ReturnType<typeof getListingGalleryCopy>;

export const getKeyedListingGalleryImages = (
  images: readonly VehicleListingImage[]
) => {
  const occurrences = new Map<string, number>();

  return images.map((image, imageIndex) => {
    const occurrence = occurrences.get(image.url) ?? 0;
    occurrences.set(image.url, occurrence + 1);

    return {
      image,
      imageIndex,
      key: `${image.url}::${occurrence}`,
    };
  });
};

export const getPreviousGalleryIndex = (current: number, count: number) =>
  current === 0 ? Math.max(count - 1, 0) : current - 1;

export const getNextGalleryIndex = (current: number, count: number) =>
  count === 0 ? 0 : (current + 1) % count;
