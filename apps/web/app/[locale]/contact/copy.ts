import { leadSite } from "@repo/marketplace";
import { CarFront, Landmark, Ship, Tag } from "lucide-react";

export const pageCopy = {
  bg: {
    heroImageAlt: "Нощен автомобилен шоурум",
    title: "Премиум автомобили. Внос. Лизинг.",
    description: `Вижте автомобилите в наличност или говорете директно с ${leadSite.shortName} за следващия си автомобил.`,
    inventoryAction: "Вижте наличностите",
    phoneAction: "Обадете се",
    contactTitle: "Говорете директно с нас.",
    contactDescription: `Един телефон за автомобил, внос или финансиране. Шоурум в ${leadSite.district.bg}.`,
    locationLabel: `Шоурум · ${leadSite.district.bg}`,
    mapAction: "Отворете картата",
    servicesTitle: "Изберете правилната посока.",
    servicesDescription:
      "От наличен автомобил до внос по заявка — екипът ни е на една връзка разстояние.",
    sellHandoffAction: "Обадете се за оферта",
    sellHandoffDescription: `Данните за автомобила са готови. Обадете се на ${leadSite.shortName}, за да уточним оглед и конкретна оферта.`,
    sellHandoffEditAction: "Редактирайте данните",
    sellHandoffTitle: "Заявете оценка за автомобила",
    sellCategoryLabel: "Категория",
    sellDetailsLabel: "Екстри и бележки",
    sellMileageLabel: "Пробег",
    sellVehicleLabel: "Автомобил",
    sellYearLabel: "Година",
    sellLocationLabel: `Шоурум · ${leadSite.district.bg}`,
    services: [
      {
        title: "Автомобили в наличност",
        description: "Разгледайте предложенията и планирайте оглед.",
        href: "/cars",
        icon: CarFront,
      },
      {
        title: "Внос по заявка",
        description: "Кажете какво търсите и започнете разговор.",
        href: "/imports",
        icon: Ship,
      },
      {
        title: "Собствен лизинг",
        description: "Обсъдете вариант според автомобила и бюджета ви.",
        href: "/lease",
        icon: Landmark,
      },
      {
        title: "Продайте автомобила си",
        description: "Изпратете данни за автомобила и заявете оценка.",
        href: "/sell",
        icon: Tag,
      },
    ],
  },
  en: {
    heroImageAlt: "Night-time automotive showroom",
    title: "Premium vehicles. Imports. Leasing.",
    description: `Browse the vehicles in stock or speak directly with ${leadSite.shortName} about your next vehicle.`,
    inventoryAction: "View available vehicles",
    phoneAction: "Call us",
    contactTitle: "Speak directly with us.",
    contactDescription: `One phone number for vehicles, imports, or finance. Showroom in ${leadSite.district.en}.`,
    locationLabel: `Showroom · ${leadSite.district.en}`,
    mapAction: "Open the map",
    servicesTitle: "Choose the right direction.",
    servicesDescription:
      "From a vehicle in stock to an import on request, our team is one call away.",
    sellHandoffAction: "Call for an offer",
    sellHandoffDescription: `Your vehicle details are ready. Call ${leadSite.shortName} to arrange an inspection and a concrete offer.`,
    sellHandoffEditAction: "Edit vehicle details",
    sellHandoffTitle: "Request a vehicle appraisal",
    sellCategoryLabel: "Category",
    sellDetailsLabel: "Extras and notes",
    sellMileageLabel: "Mileage",
    sellVehicleLabel: "Vehicle",
    sellYearLabel: "Year",
    sellLocationLabel: `Showroom · ${leadSite.district.en}`,
    services: [
      {
        title: "Vehicles in stock",
        description: "Browse the offers and plan an inspection.",
        href: "/cars",
        icon: CarFront,
      },
      {
        title: "Import on request",
        description:
          "Tell us what you are looking for and start a conversation.",
        href: "/imports",
        icon: Ship,
      },
      {
        title: "In-house leasing",
        description: "Discuss an option for the vehicle and your budget.",
        href: "/lease",
        icon: Landmark,
      },
      {
        title: "Sell your car",
        description: "Share your vehicle details and request an appraisal.",
        href: "/sell",
        icon: Tag,
      },
    ],
  },
} as const;

/** Legacy trade-in entry has no completed draft; do not claim vehicle details are ready. */
export const getSellContactCopy = (
  locale: "en" | "bg",
  hasDetails: boolean
) => {
  const copy = pageCopy[locale];
  if (hasDetails) {
    return copy;
  }
  return {
    ...copy,
    sellHandoffTitle:
      locale === "bg"
        ? "Продайте или заменете автомобила си"
        : "Sell or trade in your vehicle",
    sellHandoffDescription:
      locale === "bg"
        ? "Добавете VIN или марка, модел, година и пробег, за да подготвите разговор за оценка. Нищо не се изпраща автоматично."
        : "Add a VIN or the make, model, year and mileage to prepare an appraisal conversation. Nothing is sent automatically.",
    sellHandoffEditAction:
      locale === "bg" ? "Добавете данни за автомобила" : "Add vehicle details",
    sellVehicleLabel:
      locale === "bg" ? "Добавете данни за автомобила" : "Add vehicle details",
    sellHandoffAction: locale === "bg" ? "Обадете се" : "Call us",
  };
};
