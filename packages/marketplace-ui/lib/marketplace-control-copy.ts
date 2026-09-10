import type {
  MarketplaceSearchParams,
  QuickFilterKey,
  VehicleCategory,
} from "@repo/marketplace";

export type MarketplaceFilterView =
  | "main"
  | "body"
  | "deliver-to"
  | "origin"
  | "location"
  | "price"
  | "year"
  | "mileage"
  | "fuel"
  | "transmission"
  | "seller";

type SortOption = MarketplaceSearchParams["sort"];

interface CategoryCopy {
  description: string;
  label: string;
  shortLabel: string;
}

interface MarketplaceControlCopy {
  actions: {
    apply: string;
    back: string;
    cancel: string;
    clear: string;
    close: string;
    reset: string;
    showResults: string;
  };
  bottomNav: {
    account: string;
    buy: string;
    lease: string;
    navigation: string;
    saved: string;
    sell: string;
  };
  categories: Record<VehicleCategory, CategoryCopy>;
  categoryDrawer: {
    description: string;
    title: string;
    triggerLabel: string;
  };
  chips: Record<QuickFilterKey, string>;
  countries: {
    any: string;
  };
  filters: Record<MarketplaceFilterView, string>;
  fullFilterDescription: string;
  makeModel: {
    additionalModels: string;
    anyDerivative: string;
    anyDerivativeDescription: string;
    derivativeDescription: string;
    derivativeHeading: string;
    description: string;
    popularModels: string;
    searchAriaLabel: string;
    searchMakes: string;
    searchModels: string;
    selectDerivative: string;
    selectMake: string;
  };
  options: {
    dealer: string;
    diesel: string;
    electric: string;
    gasoline: string;
    hybrid: string;
    lpg: string;
    manual: string;
    maximum: string;
    maximumMileage: string;
    maximumPrice: string;
    maximumYear: string;
    minimum: string;
    minimumPrice: string;
    minimumYear: string;
    phev: string;
    privateSeller: string;
    select: string;
    semiAutomatic: string;
    automatic: string;
  };
  quickFilterDescription: string;
  search: {
    allFilters: string;
    ariaLabel: string;
    placeholder: string;
  };
  sort: Record<SortOption, string>;
  view: {
    grid: string;
    group: string;
    list: string;
  };
}

const copyByLanguage = {
  bg: {
    actions: {
      apply: "Приложи",
      back: "Назад",
      cancel: "Отказ",
      clear: "Изчисти",
      close: "Затвори",
      reset: "Нулирай",
      showResults: "Покажи обявите",
    },
    bottomNav: {
      account: "Профил",
      buy: "Купи",
      lease: "Лизинг",
      navigation: "Основна навигация",
      saved: "Запазени",
      sell: "Продай",
    },
    categories: {
      car: {
        description: "Леки автомобили, SUV, комбита, купета и хечбеци",
        label: "Автомобили",
        shortLabel: "Коли",
      },
      truck: {
        description: "Товарни автомобили, пикапи и тежкотоварна техника",
        label: "Камиони",
        shortLabel: "Камиони",
      },
      motorbike: {
        description: "Мотоциклети, скутери и туристически модели",
        label: "Мотоциклети",
        shortLabel: "Мотори",
      },
      van: {
        description: "Товарни и пътнически бусове и микробуси",
        label: "Бусове",
        shortLabel: "Бусове",
      },
      lease: {
        description: "Автомобили на лизинг и оферти с месечна вноска",
        label: "Лизинг",
        shortLabel: "Лизинг",
      },
    },
    categoryDrawer: {
      description:
        "Избери тип превозно средство, преди да търсиш по марка или ключова дума.",
      title: "Категория",
      triggerLabel: "Избери категория превозно средство",
    },
    chips: {
      "make-model": "Марка и модел",
      "deliver-to": "Доставка до",
      origin: "Произход",
      location: "Местоположение",
      price: "Цена",
      year: "Година",
      mileage: "Пробег",
      fuel: "Гориво",
      transmission: "Скорости",
      sort: "Сортиране",
    },
    countries: {
      any: "Всички държави",
    },
    filters: {
      main: "Филтри",
      body: "Тип купе",
      "deliver-to": "Доставка до",
      origin: "Произход на автомобила",
      location: "Местоположение",
      price: "Ценови диапазон",
      year: "Година",
      mileage: "Максимален пробег",
      fuel: "Гориво",
      transmission: "Скоростна кутия",
      seller: "Тип продавач",
    },
    fullFilterDescription:
      "Разширени филтри за автомобил, цена, пробег и продавач.",
    makeModel: {
      anyDerivative: "Всички каросерии",
      anyDerivativeDescription: "Покажи всички обяви за този модел",
      derivativeDescription: "Това са официалните каросерии за избрания модел.",
      derivativeHeading: "Избери каросерия",
      description:
        "Избери марка и модел, а при налични официални варианти — и каросерия.",
      additionalModels: "Още модели",
      popularModels: "Популярни модели",
      searchAriaLabel: "Търси марки или модели",
      searchMakes: "Търси марки",
      searchModels: "Търси модели",
      selectDerivative: "Избери вариант",
      selectMake: "Избери марка",
    },
    options: {
      dealer: "Дилър",
      diesel: "Дизел",
      electric: "Електрически",
      gasoline: "Бензин",
      hybrid: "Хибрид",
      lpg: "Газ",
      manual: "Ръчни",
      maximum: "Максимум",
      maximumMileage: "Максимален пробег",
      maximumPrice: "Максимална цена",
      maximumYear: "Максимална година",
      minimum: "Минимум",
      minimumPrice: "Минимална цена",
      minimumYear: "Минимална година",
      phev: "Plug-in хибрид",
      privateSeller: "Частен продавач",
      select: "Избери",
      semiAutomatic: "Полуавтоматик",
      automatic: "Автоматик",
    },
    quickFilterDescription: "Избери стойност за този бърз филтър.",
    search: {
      allFilters: "Отвори всички филтри",
      ariaLabel: "Търси автомобили",
      placeholder: "Търси…",
    },
    sort: {
      recommended: "Препоръчани",
      newest: "Най-нови",
      price_asc: "Най-ниска цена",
      price_desc: "Най-висока цена",
      mileage_asc: "Най-нисък пробег",
      year_desc: "Най-нова година",
    },
    view: {
      grid: "Изглед в решетка",
      group: "Изглед на обявите",
      list: "Списъчен изглед",
    },
  },
  en: {
    actions: {
      apply: "Apply",
      back: "Back",
      cancel: "Cancel",
      clear: "Clear",
      close: "Close",
      reset: "Reset",
      showResults: "Show results",
    },
    bottomNav: {
      account: "Account",
      buy: "Buy",
      lease: "Lease",
      navigation: "Primary navigation",
      saved: "Saved",
      sell: "Sell",
    },
    categories: {
      car: {
        description: "Passenger cars, SUVs, wagons, coupes, and hatchbacks",
        label: "Cars",
        shortLabel: "Cars",
      },
      truck: {
        description: "Commercial trucks, pickups, and heavy duty vehicles",
        label: "Trucks",
        shortLabel: "Trucks",
      },
      motorbike: {
        description: "Motorcycles, scooters, and touring bikes",
        label: "Motorbikes",
        shortLabel: "Bikes",
      },
      van: {
        description: "Cargo vans, passenger vans, and minibuses",
        label: "Vans",
        shortLabel: "Vans",
      },
      lease: {
        description: "Lease-ready vehicles and monthly offers",
        label: "Lease",
        shortLabel: "Lease",
      },
    },
    categoryDrawer: {
      description:
        "Choose the vehicle class before searching by make or keyword.",
      title: "Vehicle category",
      triggerLabel: "Choose vehicle category",
    },
    chips: {
      "make-model": "Make and model",
      "deliver-to": "Deliver to",
      origin: "Origin",
      location: "Location",
      price: "Price",
      year: "Year",
      mileage: "Mileage",
      fuel: "Fuel",
      transmission: "Transmission",
      sort: "Sort",
    },
    countries: {
      any: "Any country",
    },
    filters: {
      main: "Filters",
      body: "Body type",
      "deliver-to": "Deliver to",
      origin: "Vehicle origin",
      location: "Local vehicle location",
      price: "Price range",
      year: "Year",
      mileage: "Max mileage",
      fuel: "Fuel type",
      transmission: "Transmission",
      seller: "Seller type",
    },
    fullFilterDescription:
      "Extended vehicle, price, mileage, and seller filters.",
    makeModel: {
      anyDerivative: "All body styles",
      anyDerivativeDescription: "Show every listing for this model",
      derivativeDescription:
        "These are the official body styles for the selected model.",
      derivativeHeading: "Choose a body style",
      description:
        "Choose a make and model, then an official body derivative when available.",
      additionalModels: "More models",
      popularModels: "Popular models",
      searchAriaLabel: "Search makes or models",
      searchMakes: "Search makes",
      searchModels: "Search models",
      selectDerivative: "Select body variant",
      selectMake: "Select make",
    },
    options: {
      dealer: "Dealer",
      diesel: "Diesel",
      electric: "Electric",
      gasoline: "Gasoline",
      hybrid: "Hybrid",
      lpg: "LPG",
      manual: "Manual",
      maximum: "Maximum",
      maximumMileage: "Maximum mileage",
      maximumPrice: "Maximum price",
      maximumYear: "Maximum year",
      minimum: "Minimum",
      minimumPrice: "Minimum price",
      minimumYear: "Minimum year",
      phev: "PHEV",
      privateSeller: "Private seller",
      select: "Select",
      semiAutomatic: "Semi-auto",
      automatic: "Automatic",
    },
    quickFilterDescription: "Focused quick filter controls.",
    search: {
      allFilters: "Open all filters",
      ariaLabel: "Search vehicles",
      placeholder: "Search…",
    },
    sort: {
      recommended: "Recommended",
      newest: "Newest",
      price_asc: "Price low",
      price_desc: "Price high",
      mileage_asc: "Lowest km",
      year_desc: "Newest year",
    },
    view: {
      grid: "Grid view",
      group: "Listing view",
      list: "List view",
    },
  },
} as const satisfies Record<"bg" | "en", MarketplaceControlCopy>;

const countryNameFormatters = {
  bg: new Intl.DisplayNames(["bg"], { type: "region" }),
  en: new Intl.DisplayNames(["en"], { type: "region" }),
} as const;

const cityLabelsBg: Record<string, string> = {
  Sofia: "София",
  Plovdiv: "Пловдив",
  Varna: "Варна",
  Burgas: "Бургас",
  Ruse: "Русе",
  "Stara Zagora": "Стара Загора",
};

export const isBulgarianMarketplaceLocale = (locale?: string) =>
  locale?.toLowerCase().startsWith("bg") ?? false;

export const formatMarketplaceModelYearRange = (
  years: { fromYear?: number; toYear?: number },
  locale?: string
) => {
  const { fromYear, toYear } = years;
  const isBg = isBulgarianMarketplaceLocale(locale);

  if (fromYear && toYear) {
    return `${fromYear}–${toYear}${isBg ? " г." : ""}`;
  }

  if (fromYear) {
    return `${isBg ? "От" : "From"} ${fromYear}${isBg ? " г." : ""}`;
  }

  if (toYear) {
    return `${isBg ? "До" : "Until"} ${toYear}${isBg ? " г." : ""}`;
  }

  return undefined;
};

export const getMarketplaceDerivativeDisplayName = (
  model: string,
  derivative: string
) => {
  const normalizedModel = model.trim().toLocaleLowerCase();
  const normalizedDerivative = derivative.trim().toLocaleLowerCase();

  return normalizedDerivative === normalizedModel ||
    normalizedDerivative.startsWith(`${normalizedModel} `)
    ? derivative
    : `${model} ${derivative}`;
};

export const getMarketplaceControlCopy = (
  locale?: string
): MarketplaceControlCopy =>
  copyByLanguage[isBulgarianMarketplaceLocale(locale) ? "bg" : "en"];

export const getLocalizedMarketplaceCountryName = (
  countryCode: string,
  locale?: string
) => {
  const language = isBulgarianMarketplaceLocale(locale) ? "bg" : "en";

  return (
    countryNameFormatters[language].of(countryCode.toUpperCase()) ??
    countryCode.toUpperCase()
  );
};

export const getLocalizedMarketplaceCityName = (
  city: string,
  locale?: string
) =>
  isBulgarianMarketplaceLocale(locale) ? (cityLabelsBg[city] ?? city) : city;
