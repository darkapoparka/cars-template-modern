import type { MarketplaceSearchParams } from "../search";
import type { Money, VehicleListing } from "../types";

export const mockListings: VehicleListing[] = [
  {
    id: "am-1001",
    slug: "bmw-x5-m50d-sofia-2020",
    category: "car",
    dealerOrgId: "dealer-day-night-auto-group",
    status: "active",
    title: "2020 BMW X5 M50d",
    description:
      "Примерна обява за BMW X5 M50d с 360 камери, панорама, HUD и обдухване. Снимката е илюстративна; наличност и условия се потвърждават с автокъщата.",
    price: { amount: 89_379, currency: "BGN" },
    priceType: "fixed",
    monthlyEstimate: { amount: 1360, currency: "BGN" },
    images: [
      {
        url: "https://images.unsplash.com/photo-1635990215241-4d2805d729bb?w=1200&q=82&auto=format&fit=crop",
        alt: "Черен BMW X5 SUV",
      },
    ],
    badges: ["used", "promoted"],
    location: { city: "София", region: "Студентски град", country: "България" },
    features: [
      { bg: "360° камери", en: "360° cameras" },
      { bg: "Панорамен покрив", en: "Panoramic roof" },
      { bg: "Head-up display", en: "Head-up display" },
      { bg: "Обдухване на седалките", en: "Ventilated seats" },
    ],
    spec: {
      make: "BMW",
      model: "X5",
      trim: "M50d",
      year: 2020,
      bodyType: "suv",
      fuelType: "diesel",
      transmission: "automatic",
      mileageValue: 167_000,
      mileageUnit: "km",
      enginePowerHp: 400,
    },
    seller: {
      id: "dealer-day-night-auto-group",
      type: "dealer",
      displayName: "Day & Night Auto Group",
      verificationStatus: "verified",
      city: "София",
    },
    publishedAt: "2026-07-28T09:00:00.000Z",
    promoted: true,
  },
  {
    id: "am-1010",
    slug: "mercedes-benz-gls-400d-4matic-amg-sofia-2021",
    category: "car",
    dealerOrgId: "dealer-day-night-auto-group",
    status: "active",
    title: "2021 Mercedes-Benz GLS 400d 4MATIC AMG",
    description:
      "GLS 400d 4MATIC AMG Line с Burmester и панорама. Голям семеен SUV от Day & Night - наличен за оглед в София.",
    price: { amount: 122_629, currency: "BGN" },
    priceType: "fixed",
    monthlyEstimate: { amount: 1870, currency: "BGN" },
    images: [
      {
        url: "https://images.unsplash.com/photo-1669023161435-b3b8ad71f8f7?w=1200&q=82&auto=format&fit=crop",
        alt: "Mercedes-Benz GLS 4MATIC AMG SUV",
      },
    ],
    badges: ["used", "promoted"],
    location: { city: "София", region: "Студентски град", country: "България" },
    spec: {
      make: "Mercedes-Benz",
      model: "GLS",
      trim: "400d 4MATIC AMG Line",
      year: 2021,
      bodyType: "suv",
      fuelType: "diesel",
      transmission: "automatic",
      mileageValue: 166_000,
      mileageUnit: "km",
      enginePowerHp: 330,
      colorExterior: "Черен",
    },
    seller: {
      id: "dealer-day-night-auto-group",
      type: "dealer",
      displayName: "Day & Night Auto Group",
      verificationStatus: "verified",
      city: "София",
    },
    publishedAt: "2026-07-27T10:15:00.000Z",
    promoted: true,
  },
  {
    id: "am-1011",
    slug: "bmw-750e-xdrive-m-sport-sofia-2024",
    category: "car",
    dealerOrgId: "dealer-day-night-auto-group",
    status: "active",
    title: "2024 BMW 750e xDrive M Sport",
    description:
      "Очакван внос: 7 Series plug-in hybrid с M Sport. Нисък пробег - Day & Night организира доставка и оглед в София.",
    price: { amount: 175_436, currency: "BGN" },
    priceType: "fixed",
    monthlyEstimate: { amount: 2680, currency: "BGN" },
    images: [
      {
        url: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&q=80",
        alt: "BMW 7 Series",
      },
    ],
    badges: ["used"],
    location: { city: "София", region: "Студентски град", country: "България" },
    spec: {
      make: "BMW",
      model: "7 Series",
      trim: "750e xDrive M Sport",
      year: 2024,
      bodyType: "sedan",
      fuelType: "plug_in_hybrid",
      transmission: "automatic",
      mileageValue: 40_000,
      mileageUnit: "km",
      enginePowerHp: 489,
      colorExterior: "Черен сапфир",
    },
    seller: {
      id: "dealer-day-night-auto-group",
      type: "dealer",
      displayName: "Day & Night Auto Group",
      verificationStatus: "verified",
      city: "София",
    },
    publishedAt: "2026-07-26T08:40:00.000Z",
    promoted: false,
  },
  {
    id: "am-1012",
    slug: "mercedes-benz-e-63-s-amg-sofia-2021",
    category: "car",
    dealerOrgId: "dealer-day-night-auto-group",
    status: "active",
    title: "2021 Mercedes-Benz E 63 S AMG",
    description:
      "E 63 S AMG facelift с 360, HUD и Burmester. Спортна лимузина от Day & Night Auto Group.",
    price: { amount: 165_657, currency: "BGN" },
    priceType: "fixed",
    monthlyEstimate: { amount: 2530, currency: "BGN" },
    images: [
      {
        url: "https://images.unsplash.com/photo-1609703048009-d3576872b32c?w=1200&q=80",
        alt: "Mercedes-Benz E-Class sedan",
      },
    ],
    badges: ["used"],
    location: { city: "София", region: "Студентски град", country: "България" },
    spec: {
      make: "Mercedes-Benz",
      model: "E-Class",
      trim: "E 63 S AMG",
      year: 2021,
      bodyType: "sedan",
      fuelType: "gasoline",
      transmission: "automatic",
      mileageValue: 96_000,
      mileageUnit: "km",
      enginePowerHp: 612,
      colorExterior: "Черен",
    },
    seller: {
      id: "dealer-day-night-auto-group",
      type: "dealer",
      displayName: "Day & Night Auto Group",
      verificationStatus: "verified",
      city: "София",
    },
    publishedAt: "2026-07-25T13:20:00.000Z",
    promoted: false,
  },
  {
    id: "am-1013",
    slug: "mercedes-benz-cls-400d-4matic-sofia-2020",
    category: "car",
    dealerOrgId: "dealer-day-night-auto-group",
    status: "active",
    title: "2020 Mercedes-Benz CLS 400d 4MATIC",
    description:
      "CLS 400d 4MATIC AMG Line Designo с 360 камери. Елегантно купе-седан от Day & Night в София.",
    price: { amount: 73_733, currency: "BGN" },
    priceType: "negotiable",
    monthlyEstimate: { amount: 1125, currency: "BGN" },
    images: [
      {
        url: "https://images.unsplash.com/photo-1624085568108-36410cfe4d24?w=1200&q=80",
        alt: "Mercedes CLS",
      },
    ],
    badges: ["used"],
    location: { city: "София", region: "Студентски град", country: "България" },
    spec: {
      make: "Mercedes-Benz",
      model: "CLS",
      trim: "400d 4MATIC AMG Line",
      year: 2020,
      bodyType: "coupe",
      fuelType: "diesel",
      transmission: "automatic",
      mileageValue: 171_000,
      mileageUnit: "km",
      enginePowerHp: 330,
      colorExterior: "Сив металик",
    },
    seller: {
      id: "dealer-day-night-auto-group",
      type: "dealer",
      displayName: "Day & Night Auto Group",
      verificationStatus: "verified",
      city: "София",
    },
    publishedAt: "2026-07-24T15:05:00.000Z",
    promoted: false,
  },
  {
    id: "am-1014",
    slug: "audi-q8-50-tdi-quattro-s-line-sofia-2021",
    category: "car",
    dealerOrgId: "dealer-day-night-auto-group",
    status: "active",
    title: "2021 Audi Q8 50 TDI quattro S line",
    description:
      "Очакван внос: Q8 50 TDI quattro S line Plus. Купе-SUV с quattro за клиенти на Day & Night.",
    price: { amount: 99_159, currency: "BGN" },
    priceType: "fixed",
    monthlyEstimate: { amount: 1515, currency: "BGN" },
    images: [
      {
        url: "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=1200&q=80",
        alt: "Audi Q8",
      },
    ],
    badges: ["used"],
    location: { city: "София", region: "Студентски град", country: "България" },
    spec: {
      make: "Audi",
      model: "Q8",
      trim: "50 TDI quattro S line",
      year: 2021,
      bodyType: "suv",
      fuelType: "diesel",
      transmission: "automatic",
      mileageValue: 163_000,
      mileageUnit: "km",
      enginePowerHp: 286,
      colorExterior: "Черен",
    },
    seller: {
      id: "dealer-day-night-auto-group",
      type: "dealer",
      displayName: "Day & Night Auto Group",
      verificationStatus: "verified",
      city: "София",
    },
    publishedAt: "2026-07-23T09:30:00.000Z",
    promoted: false,
  },
  {
    id: "am-1002",
    slug: "mercedes-benz-gle-400d-coupe-sofia-2021",
    category: "car",
    dealerOrgId: "dealer-day-night-auto-group",
    status: "active",
    title: "2021 Mercedes-Benz GLE 400d Coupe",
    description:
      "GLE 400d Coupe 4MATIC AMG с 360 и Burmester. Наличен при Day & Night Auto Group - София.",
    price: { amount: 124_584, currency: "BGN" },
    priceType: "fixed",
    monthlyEstimate: { amount: 1900, currency: "BGN" },
    images: [
      {
        url: "https://images.unsplash.com/photo-1751941710410-f8167da82750?w=1200&q=82&auto=format&fit=crop",
        alt: "Черен Mercedes-Benz GLE SUV",
      },
    ],
    badges: ["used"],
    location: { city: "София", region: "Студентски град", country: "България" },
    spec: {
      make: "Mercedes-Benz",
      model: "GLE",
      trim: "400d Coupe 4MATIC AMG",
      year: 2021,
      bodyType: "suv",
      fuelType: "diesel",
      transmission: "automatic",
      mileageValue: 166_000,
      mileageUnit: "km",
      enginePowerHp: 330,
      colorExterior: "Черен",
    },
    seller: {
      id: "dealer-day-night-auto-group",
      type: "dealer",
      displayName: "Day & Night Auto Group",
      verificationStatus: "verified",
      city: "София",
    },
    publishedAt: "2026-07-22T11:30:00.000Z",
    promoted: false,
  },
  {
    id: "am-1003",
    slug: "mercedes-benz-gle-53-amg-coupe-sofia-2022",
    category: "lease",
    dealerOrgId: "dealer-day-night-auto-group",
    status: "active",
    title: "2022 Mercedes-Benz GLE 53 AMG Coupe",
    description:
      "Очакван внос: GLE 53 AMG Coupe Night Pack. Day & Night предлага собствен лизинг след оглед.",
    price: { amount: 140_231, currency: "BGN" },
    priceType: "fixed",
    monthlyEstimate: { amount: 2140, currency: "BGN" },
    images: [
      {
        url: "https://images.unsplash.com/photo-1563721938524-4da1bede2935?w=1200&q=82&auto=format&fit=crop",
        alt: "Бял Mercedes-Benz GLE AMG SUV",
      },
    ],
    badges: ["used", "lease"],
    location: { city: "София", region: "Студентски град", country: "България" },
    spec: {
      make: "Mercedes-Benz",
      model: "GLE",
      trim: "53 AMG Coupe 4MATIC",
      year: 2022,
      bodyType: "suv",
      fuelType: "gasoline",
      transmission: "automatic",
      mileageValue: 105_000,
      mileageUnit: "km",
      enginePowerHp: 435,
      colorExterior: "Черен",
    },
    seller: {
      id: "dealer-day-night-auto-group",
      type: "dealer",
      displayName: "Day & Night Auto Group",
      verificationStatus: "verified",
      city: "София",
    },
    publishedAt: "2026-07-21T08:15:00.000Z",
    promoted: true,
  },
  {
    id: "am-1004",
    slug: "mercedes-benz-s-350d-long-amg-sofia-2019",
    category: "car",
    dealerOrgId: "dealer-day-night-auto-group",
    status: "active",
    title: "2019 Mercedes-Benz S 350d Long AMG",
    description:
      "S 350d Long с S63 AMG оптика и пакет за шофьор. Представителна лимузина от Day & Night.",
    price: { amount: 83_512, currency: "BGN" },
    priceType: "fixed",
    monthlyEstimate: { amount: 1275, currency: "BGN" },
    images: [
      {
        url: "https://images.unsplash.com/photo-1610099610040-ab19f3a5ec35?w=1200&q=80",
        alt: "Mercedes-Benz S-Class sedan",
      },
    ],
    badges: ["used"],
    location: { city: "София", region: "Студентски град", country: "България" },
    spec: {
      make: "Mercedes-Benz",
      model: "S-Class",
      trim: "S 350d Long AMG Optic",
      year: 2019,
      bodyType: "sedan",
      fuelType: "diesel",
      transmission: "automatic",
      mileageValue: 145_000,
      mileageUnit: "km",
      enginePowerHp: 286,
      colorExterior: "Черен",
    },
    seller: {
      id: "dealer-day-night-auto-group",
      type: "dealer",
      displayName: "Day & Night Auto Group",
      verificationStatus: "verified",
      city: "София",
    },
    publishedAt: "2026-07-20T14:45:00.000Z",
    promoted: false,
  },
  {
    id: "am-1005",
    slug: "mercedes-benz-v-250d-vip-business-sofia-2018",
    category: "van",
    dealerOrgId: "dealer-day-night-auto-group",
    status: "active",
    title: "2018 Mercedes-Benz V 250d VIP Business",
    description:
      "V 250d VIP Business с TV, обдухване и подгряване. Бизнес ван от Day & Night Auto Group.",
    price: { amount: 106_982, currency: "BGN" },
    priceType: "fixed",
    monthlyEstimate: { amount: 1635, currency: "BGN" },
    images: [
      {
        url: "/lead-sell-van-v1.png",
        alt: "V-Class van",
      },
    ],
    badges: ["used"],
    location: { city: "София", region: "Студентски град", country: "България" },
    spec: {
      make: "Mercedes-Benz",
      model: "V-Class",
      trim: "V 250d VIP Business",
      year: 2018,
      bodyType: "van",
      fuelType: "diesel",
      transmission: "automatic",
      mileageValue: 44_500,
      mileageUnit: "km",
      enginePowerHp: 190,
      colorExterior: "Черен",
    },
    seller: {
      id: "dealer-day-night-auto-group",
      type: "dealer",
      displayName: "Day & Night Auto Group",
      verificationStatus: "verified",
      city: "София",
    },
    publishedAt: "2026-07-19T10:20:00.000Z",
    promoted: false,
  },
  {
    id: "am-1006",
    slug: "range-rover-sport-svr-sofia-2021",
    category: "car",
    dealerOrgId: "dealer-day-night-auto-group",
    status: "active",
    title: "2021 Range Rover Sport SVR",
    description:
      "Range Rover Sport SVR 600 к.с. с панорама, 360 и Meridian. Висок клас SUV от Day & Night.",
    price: { amount: 106_982, currency: "BGN" },
    priceType: "negotiable",
    monthlyEstimate: { amount: 1635, currency: "BGN" },
    images: [
      {
        url: "https://images.unsplash.com/photo-1679506640590-f0152786dff0?w=1200&q=80",
        alt: "Range Rover Sport",
      },
    ],
    badges: ["used"],
    location: { city: "София", region: "Студентски град", country: "България" },
    spec: {
      make: "Land Rover",
      model: "Range Rover Sport",
      trim: "SVR",
      year: 2021,
      bodyType: "suv",
      fuelType: "gasoline",
      transmission: "automatic",
      mileageValue: 155_000,
      mileageUnit: "km",
      enginePowerHp: 600,
      colorExterior: "Черен",
    },
    seller: {
      id: "dealer-day-night-auto-group",
      type: "dealer",
      displayName: "Day & Night Auto Group",
      verificationStatus: "verified",
      city: "София",
    },
    publishedAt: "2026-07-18T12:10:00.000Z",
    promoted: false,
  },
  {
    id: "am-1007",
    slug: "bmw-430i-xdrive-gran-coupe-sofia-2023",
    category: "car",
    dealerOrgId: "dealer-day-night-auto-group",
    status: "active",
    title: "2023 BMW 430i xDrive Gran Coupe",
    description:
      "430i xDrive Gran Coupe M Sport с digital кокпит и Harman Kardon. Day & Night, София.",
    price: { amount: 81_556, currency: "BGN" },
    priceType: "fixed",
    monthlyEstimate: { amount: 1245, currency: "BGN" },
    images: [
      {
        url: "https://images.unsplash.com/photo-1556189250-72ba954cfc2b?w=1200&q=80",
        alt: "BMW 4 Series",
      },
    ],
    badges: ["used"],
    location: { city: "София", region: "Студентски град", country: "България" },
    spec: {
      make: "BMW",
      model: "4 Series",
      trim: "430i xDrive Gran Coupe M Sport",
      year: 2023,
      bodyType: "coupe",
      fuelType: "gasoline",
      transmission: "automatic",
      mileageValue: 35_000,
      mileageUnit: "km",
      enginePowerHp: 245,
      colorExterior: "Син металик",
    },
    seller: {
      id: "dealer-day-night-auto-group",
      type: "dealer",
      displayName: "Day & Night Auto Group",
      verificationStatus: "verified",
      city: "София",
    },
    publishedAt: "2026-07-17T16:00:00.000Z",
    promoted: false,
  },
  {
    id: "am-1008",
    slug: "bmw-m4-competition-sofia-2021",
    category: "car",
    dealerOrgId: "dealer-day-night-auto-group",
    status: "active",
    title: "2021 BMW M4 Competition",
    description:
      "BMW M4 Competition с M пакет, спортен салон и digital кокпит. Купе от портфолиото на Day & Night Auto Group.",
    price: { amount: 128_496, currency: "BGN" },
    priceType: "fixed",
    monthlyEstimate: { amount: 1960, currency: "BGN" },
    images: [
      {
        url: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=1200&q=80",
        alt: "Червено BMW M4 Competition пред модерен шоурум",
      },
    ],
    badges: ["used", "promoted"],
    location: { city: "София", region: "Студентски град", country: "България" },
    spec: {
      make: "BMW",
      model: "M4",
      trim: "Competition",
      year: 2021,
      bodyType: "coupe",
      fuelType: "gasoline",
      transmission: "automatic",
      mileageValue: 165_000,
      mileageUnit: "km",
      enginePowerHp: 510,
      colorExterior: "Червен металик",
    },
    seller: {
      id: "dealer-day-night-auto-group",
      type: "dealer",
      displayName: "Day & Night Auto Group",
      verificationStatus: "verified",
      city: "София",
    },
    publishedAt: "2026-07-16T07:40:00.000Z",
    promoted: true,
  },
  {
    id: "am-1009",
    slug: "bmw-x5-xdrive40d-berlin-2022",
    category: "car",
    status: "active",
    title: "2022 BMW X5 xDrive40d",
    description:
      "Крос-бордер демо наличност с оторизирани медии и право на доставка. Финалният транспорт, данъци и регистрация се уточняват с оферта от Day & Night.",
    price: { amount: 112_456, currency: "BGN" },
    priceType: "fixed",
    images: [
      {
        url: "https://images.unsplash.com/photo-1635990338914-6ee781fc6d5b?w=1200&q=82&auto=format&fit=crop",
        alt: "Черен BMW X5 SUV в градска среда",
      },
    ],
    badges: ["used"],
    location: { city: "Berlin", region: "Berlin", country: "Germany" },
    spec: {
      make: "BMW",
      model: "X5",
      trim: "xDrive40d",
      year: 2022,
      bodyType: "suv",
      fuelType: "diesel",
      transmission: "automatic",
      mileageValue: 28_531,
      mileageUnit: "km",
      enginePowerHp: 340,
      colorExterior: "Carbon Black",
    },
    seller: {
      id: "import-demo-supplier",
      type: "dealer",
      displayName: "AutoMarket Import Demo",
      verificationStatus: "verified",
      city: "Hamburg",
    },
    supply: {
      convertedPrice: { amount: 112_456, currency: "BGN" },
      delivery: {
        destinationCountryCode: "BG",
        eligibleCountryCodes: ["BG", "DE", "RO"],
        status: "quote_required",
      },
      documentCount: 4,
      landedCostStatus: "quote_required",
      nativePrice: { amount: 57_499, currency: "EUR" },
      origin: {
        city: "Berlin",
        country: "Germany",
        countryCode: "DE",
        region: "Berlin",
      },
      priceConversion: {
        convertedAt: "2026-07-12T18:00:00.000Z",
        status: "converted_estimate",
      },
      provenance: {
        externalReference: "DEMO-1009",
        freshUntil: "2026-07-14T18:00:00.000Z",
        freshnessStatus: "fresh",
        lastConfirmedAt: "2026-07-12T18:00:00.000Z",
        sourceDisplayName: "Authorized demo feed",
        sourceKind: "https_feed",
      },
      supplier: {
        kybStatus: "verified",
        orgType: "importer",
        trustStatus: "verified",
        verifiedImporter: true,
      },
    },
    publishedAt: "2026-07-12T18:00:00.000Z",
    promoted: false,
  },
];

const matchesText = (listing: VehicleListing, query: string) => {
  const haystack = [
    listing.title,
    listing.description,
    listing.spec.make,
    listing.spec.model,
    listing.spec.trim,
    listing.location.city,
    listing.seller.displayName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
};

type ListingPredicate = (listing: VehicleListing) => boolean;
type ListingComparator = (a: VehicleListing, b: VehicleListing) => number;

const createListingPredicates = (
  filters: MarketplaceSearchParams
): ListingPredicate[] => [
  (listing) => listing.status === "active",
  (listing) => listing.category === filters.category,
  (listing) => !filters.q || matchesText(listing, filters.q),
  (listing) => !filters.make || listing.spec.make === filters.make,
  (listing) => !filters.model || listing.spec.model === filters.model,
  (listing) => !filters.location || listing.location.city === filters.location,
  (listing) =>
    !filters.origin ||
    listing.supply?.origin.countryCode === filters.origin ||
    (filters.origin === "BG" &&
      (listing.location.country === "Bulgaria" ||
        listing.location.country === "България")),
  (listing) =>
    !filters.deliverTo ||
    listing.supply?.delivery.eligibleCountryCodes.includes(filters.deliverTo) ||
    (filters.deliverTo === "BG" &&
      (listing.location.country === "Bulgaria" ||
        listing.location.country === "България")),
  (listing) => !filters.currency || listing.price.currency === filters.currency,
  (listing) =>
    filters.priceMin === undefined || listing.price.amount >= filters.priceMin,
  (listing) =>
    filters.priceMax === undefined || listing.price.amount <= filters.priceMax,
  (listing) =>
    filters.yearMin === undefined || listing.spec.year >= filters.yearMin,
  (listing) =>
    filters.yearMax === undefined || listing.spec.year <= filters.yearMax,
  (listing) =>
    filters.mileageMax === undefined ||
    listing.spec.mileageValue <= filters.mileageMax,
  (listing) => !filters.fuel || listing.spec.fuelType === filters.fuel,
  (listing) =>
    !filters.transmission || listing.spec.transmission === filters.transmission,
  (listing) => !filters.body || listing.spec.bodyType === filters.body,
  (listing) => !filters.seller || listing.seller.type === filters.seller,
];

const listingComparators: Record<
  MarketplaceSearchParams["sort"],
  ListingComparator
> = {
  mileage_asc: (a, b) => a.spec.mileageValue - b.spec.mileageValue,
  newest: (a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  price_asc: (a, b) => a.price.amount - b.price.amount,
  price_desc: (a, b) => b.price.amount - a.price.amount,
  recommended: (a, b) => Number(b.promoted) - Number(a.promoted),
  year_desc: (a, b) => b.spec.year - a.spec.year,
};

export const getMockListings = (filters: MarketplaceSearchParams) => {
  const predicates = createListingPredicates(filters);

  return mockListings
    .filter((listing) => predicates.every((predicate) => predicate(listing)))
    .sort(listingComparators[filters.sort]);
};

const legacyListingSlugAliases: Readonly<Record<string, string>> = {
  "audi-q5-45-tfsi-quattro-stara-zagora-2021": "bmw-m4-competition-sofia-2021",
};

export const getMockListingBySlug = (slug: string) => {
  const resolvedSlug = legacyListingSlugAliases[slug] ?? slug;
  return mockListings.find((listing) => listing.slug === resolvedSlug);
};

export const getMockListingById = (id: string) =>
  mockListings.find((listing) => listing.id === id);

const scoreRelatedListing = (
  source: VehicleListing,
  candidate: VehicleListing
) =>
  Number(candidate.category === source.category) * 4 +
  Number(candidate.spec.make === source.spec.make) * 3 +
  Number(candidate.location.city === source.location.city) * 2 +
  Number(candidate.promoted);

export const getMockRelatedListings = (source: VehicleListing, limit = 3) =>
  mockListings
    .filter(
      (listing) => listing.status === "active" && listing.id !== source.id
    )
    .map((listing) => ({
      listing,
      score: scoreRelatedListing(source, listing),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ listing }) => listing);

export const mockSavedListingIds = ["am-1001", "am-1003", "am-1008"];

export const getMockSavedListings = () =>
  mockListings.filter((listing) => mockSavedListingIds.includes(listing.id));

export interface MockSavedSearch {
  cadence: "instant" | "daily" | "weekly";
  description: string;
  filters: Partial<MarketplaceSearchParams>;
  id: string;
  lastRunAt: string;
  newMatches: number;
  title: string;
}

export const mockSavedSearches: MockSavedSearch[] = [
  {
    id: "saved-search-premium-suv",
    title: "Premium SUVs under 100k",
    description: "BMW, Audi, and Toyota SUVs with verified sellers.",
    filters: {
      body: "suv",
      category: "car",
      priceMax: 100_000,
      seller: "dealer",
    },
    cadence: "daily",
    newMatches: 3,
    lastRunAt: "2026-06-06T07:00:00.000Z",
  },
  {
    id: "saved-search-lease-ev",
    title: "Lease-ready EVs",
    description: "Electric lease offers with automatic transmission.",
    filters: {
      category: "lease",
      fuel: "electric",
      transmission: "automatic",
    },
    cadence: "instant",
    newMatches: 1,
    lastRunAt: "2026-06-07T06:30:00.000Z",
  },
  {
    id: "saved-search-family-varna",
    title: "Family cars near Varna",
    description: "Low-mileage vehicles in Varna and nearby coastal cities.",
    filters: {
      category: "car",
      location: "Varna",
      mileageMax: 90_000,
    },
    cadence: "weekly",
    newMatches: 0,
    lastRunAt: "2026-06-03T08:00:00.000Z",
  },
];

const sellerListingStatuses: Record<string, VehicleListing["status"]> = {
  "am-1001": "active",
  "am-1003": "pending_review",
  "am-1007": "draft",
};

export const getMockSellerListings = () =>
  mockListings
    .filter((listing) =>
      Object.keys(sellerListingStatuses).includes(listing.id)
    )
    .map((listing) => ({
      ...listing,
      status: sellerListingStatuses[listing.id] ?? listing.status,
    }));

export const getMockSellerListingById = (id: string) =>
  getMockSellerListings().find((listing) => listing.id === id);

export const getMockDealerInventory = () =>
  mockListings.filter((listing) => listing.seller.type === "dealer");

export interface MockDealerLead {
  buyerName: string;
  id: string;
  intent: "test_drive" | "finance" | "trade_in" | "availability";
  listingId: string;
  listingTitle: string;
  receivedAt: string;
  source: "listing" | "saved_search" | "dealer_profile";
  status: "new" | "contacted" | "qualified" | "closed";
}

export const mockDealerLeads: MockDealerLead[] = [
  {
    buyerName: "Nikolay Petrov",
    id: "lead-1001",
    intent: "finance",
    listingId: "am-1001",
    listingTitle: "2020 BMW X5 M50d",
    receivedAt: "2026-06-07T07:30:00.000Z",
    source: "listing",
    status: "new",
  },
  {
    buyerName: "Elena Dimitrova",
    id: "lead-1002",
    intent: "test_drive",
    listingId: "am-1003",
    listingTitle: "2022 Mercedes-Benz GLE 53 AMG Coupe",
    receivedAt: "2026-06-06T15:20:00.000Z",
    source: "saved_search",
    status: "contacted",
  },
  {
    buyerName: "Martin Georgiev",
    id: "lead-1003",
    intent: "availability",
    listingId: "am-1008",
    listingTitle: "2020 Mercedes-Benz AMG GT 43",
    receivedAt: "2026-06-05T12:10:00.000Z",
    source: "dealer_profile",
    status: "qualified",
  },
  {
    buyerName: "Iva Marinova",
    id: "lead-1004",
    intent: "trade_in",
    listingId: "am-1005",
    listingTitle: "2018 Mercedes-Benz V 250d VIP Business",
    receivedAt: "2026-06-04T09:45:00.000Z",
    source: "listing",
    status: "closed",
  },
];

export const getMockDealerStats = () => {
  const inventory = getMockDealerInventory();
  const activeInventory = inventory.filter(
    (listing) => listing.status === "active"
  );
  const newLeads = mockDealerLeads.filter((lead) => lead.status === "new");

  return {
    activeInventory: activeInventory.length,
    averagePrice:
      inventory.reduce((total, listing) => total + listing.price.amount, 0) /
      inventory.length,
    leadCount: mockDealerLeads.length,
    newLeadCount: newLeads.length,
  };
};

export interface MockModerationReport {
  createdAt: string;
  details: string;
  flags: string[];
  id: string;
  listingId: string;
  listingTitle: string;
  reason:
    | "duplicate"
    | "fraud_risk"
    | "incorrect_details"
    | "prohibited_content"
    | "seller_behavior";
  reporter: string;
  severity: "low" | "medium" | "high";
  source: "buyer_report" | "system_flag" | "admin_review";
  status: "new" | "reviewing" | "resolved" | "dismissed";
}

export const mockModerationReports: MockModerationReport[] = [
  {
    id: "report-1001",
    listingId: "am-1003",
    listingTitle: "2022 Mercedes-Benz GLE 53 AMG Coupe",
    reason: "incorrect_details",
    details:
      "Buyer says lease terms in the message thread do not match the listing price.",
    reporter: "Elena Dimitrova",
    source: "buyer_report",
    status: "new",
    severity: "high",
    flags: ["Lease price mismatch", "Recent edit", "High intent lead"],
    createdAt: "2026-06-07T09:20:00.000Z",
  },
  {
    id: "report-1002",
    listingId: "am-1006",
    listingTitle: "2021 Range Rover Sport SVR",
    reason: "duplicate",
    details:
      "System found matching photos and mileage on another active dealer listing.",
    reporter: "System",
    source: "system_flag",
    status: "reviewing",
    severity: "medium",
    flags: ["Photo reuse", "Similar VIN pattern"],
    createdAt: "2026-06-07T06:45:00.000Z",
  },
  {
    id: "report-1003",
    listingId: "am-1002",
    listingTitle: "2021 Mercedes-Benz GLE 400d Coupe",
    reason: "seller_behavior",
    details:
      "Reporter says seller asked to move payment to an unverified channel.",
    reporter: "Nikolay Petrov",
    source: "buyer_report",
    status: "new",
    severity: "high",
    flags: ["Payment risk", "Private seller"],
    createdAt: "2026-06-06T17:30:00.000Z",
  },
  {
    id: "report-1004",
    listingId: "am-1008",
    listingTitle: "2020 Mercedes-Benz AMG GT 43",
    reason: "prohibited_content",
    details:
      "Admin review flagged promotional copy that may overstate warranty coverage.",
    reporter: "Admin review",
    source: "admin_review",
    status: "dismissed",
    severity: "low",
    flags: ["Copy review"],
    createdAt: "2026-06-05T12:10:00.000Z",
  },
];

export interface MockTrustReview {
  city: string;
  documents: string[];
  entityId: string;
  entityName: string;
  entityType: "dealer" | "seller";
  linkedListings: number;
  riskLevel: "low" | "medium" | "high";
  status: "unverified" | "pending" | "verified" | "rejected";
  submittedAt: string;
}

export const mockTrustReviews: MockTrustReview[] = [
  {
    entityId: "dealer-black-sea-ev",
    entityName: "Black Sea EV",
    entityType: "dealer",
    city: "Varna",
    status: "pending",
    riskLevel: "medium",
    linkedListings: 1,
    documents: ["Business registration", "VAT certificate", "Dealer address"],
    submittedAt: "2026-06-07T08:00:00.000Z",
  },
  {
    entityId: "seller-124",
    entityName: "Private seller",
    entityType: "seller",
    city: "Plovdiv",
    status: "pending",
    riskLevel: "high",
    linkedListings: 1,
    documents: ["ID check", "Phone verification"],
    submittedAt: "2026-06-06T16:15:00.000Z",
  },
  {
    entityId: "dealer-trakia-auto",
    entityName: "Trakia Auto",
    entityType: "dealer",
    city: "Stara Zagora",
    status: "verified",
    riskLevel: "low",
    linkedListings: 1,
    documents: ["Business registration", "Dealer address"],
    submittedAt: "2026-06-05T10:30:00.000Z",
  },
  {
    entityId: "seller-882",
    entityName: "Private seller",
    entityType: "seller",
    city: "Varna",
    status: "verified",
    riskLevel: "low",
    linkedListings: 1,
    documents: ["ID check", "Phone verification"],
    submittedAt: "2026-06-04T14:40:00.000Z",
  },
];

export interface MockAuditLogEntry {
  action: string;
  actor: string;
  createdAt: string;
  entityId: string;
  entityType: "listing" | "report" | "seller" | "dealer";
  id: string;
  note: string;
}

export const mockAuditLog: MockAuditLogEntry[] = [
  {
    id: "audit-1001",
    actor: "Admin",
    action: "report.opened",
    entityType: "report",
    entityId: "report-1001",
    note: "Moved Tesla lease report to new queue.",
    createdAt: "2026-06-07T09:25:00.000Z",
  },
  {
    id: "audit-1002",
    actor: "System",
    action: "listing.flagged",
    entityType: "listing",
    entityId: "am-1006",
    note: "Duplicate image match over threshold.",
    createdAt: "2026-06-07T06:45:00.000Z",
  },
  {
    id: "audit-1003",
    actor: "Trust ops",
    action: "dealer.verified",
    entityType: "dealer",
    entityId: "dealer-trakia-auto",
    note: "Business registry and address checks passed.",
    createdAt: "2026-06-06T11:15:00.000Z",
  },
];

export const getMockAdminStats = () => {
  const openReports = mockModerationReports.filter(
    (report) => report.status === "new" || report.status === "reviewing"
  );
  const highRiskReports = mockModerationReports.filter(
    (report) => report.severity === "high"
  );
  const pendingTrustReviews = mockTrustReviews.filter(
    (review) => review.status === "pending"
  );

  return {
    auditEvents: mockAuditLog.length,
    highRiskReports: highRiskReports.length,
    openReports: openReports.length,
    pendingTrustReviews: pendingTrustReviews.length,
  };
};

export interface MockDealerPlan {
  current?: boolean;
  description: string;
  id: string;
  leadCredits: number;
  listingLimit: number;
  monthlyPrice: Money;
  name: string;
  promotionCredits: number;
  support: "standard" | "priority" | "managed";
}

export const mockDealerPlans: MockDealerPlan[] = [
  {
    id: "dealer-starter",
    name: "Starter",
    description: "For small dealers testing AutoMarket inventory.",
    monthlyPrice: { amount: 99, currency: "EUR" },
    listingLimit: 20,
    leadCredits: 25,
    promotionCredits: 0,
    support: "standard",
  },
  {
    id: "dealer-growth",
    name: "Growth",
    description: "More active listings, included leads, and promotion credits.",
    monthlyPrice: { amount: 249, currency: "EUR" },
    listingLimit: 80,
    leadCredits: 120,
    promotionCredits: 4,
    support: "priority",
    current: true,
  },
  {
    id: "dealer-scale",
    name: "Scale",
    description: "High-volume inventory with managed marketplace support.",
    monthlyPrice: { amount: 599, currency: "EUR" },
    listingLimit: 250,
    leadCredits: 400,
    promotionCredits: 12,
    support: "managed",
  },
];

export interface MockPromotionProduct {
  description: string;
  durationDays: number;
  id: string;
  label: string;
  placement: "search_top" | "category_featured" | "lease_partner";
  price: Money;
}

export const mockPromotionProducts: MockPromotionProduct[] = [
  {
    id: "promo-search-top-7",
    label: "Top search boost",
    description: "Promoted placement in relevant search results for 7 days.",
    placement: "search_top",
    durationDays: 7,
    price: { amount: 39, currency: "EUR" },
  },
  {
    id: "promo-category-featured-14",
    label: "Category featured",
    description: "Featured card in category browse pages for 14 days.",
    placement: "category_featured",
    durationDays: 14,
    price: { amount: 79, currency: "EUR" },
  },
  {
    id: "promo-lease-partner-30",
    label: "Lease partner slot",
    description: "Finance and lease partner placement for eligible inventory.",
    placement: "lease_partner",
    durationDays: 30,
    price: { amount: 149, currency: "EUR" },
  },
];

export interface MockActivePromotion {
  clicks: number;
  endsAt: string;
  id: string;
  impressions: number;
  leads: number;
  listingId: string;
  productId: string;
  spend: Money;
  startsAt: string;
  status: "scheduled" | "active" | "ended";
}

export const mockActivePromotions: MockActivePromotion[] = [
  {
    id: "promotion-1001",
    listingId: "am-1001",
    productId: "promo-search-top-7",
    status: "active",
    startsAt: "2026-06-05T08:00:00.000Z",
    endsAt: "2026-06-12T08:00:00.000Z",
    spend: { amount: 39, currency: "EUR" },
    impressions: 4200,
    clicks: 184,
    leads: 8,
  },
  {
    id: "promotion-1002",
    listingId: "am-1003",
    productId: "promo-lease-partner-30",
    status: "active",
    startsAt: "2026-06-01T08:00:00.000Z",
    endsAt: "2026-07-01T08:00:00.000Z",
    spend: { amount: 149, currency: "EUR" },
    impressions: 6100,
    clicks: 246,
    leads: 12,
  },
  {
    id: "promotion-1003",
    listingId: "am-1008",
    productId: "promo-category-featured-14",
    status: "scheduled",
    startsAt: "2026-06-10T08:00:00.000Z",
    endsAt: "2026-06-24T08:00:00.000Z",
    spend: { amount: 79, currency: "EUR" },
    impressions: 0,
    clicks: 0,
    leads: 0,
  },
];

export interface MockDealerBillingAccount {
  currentPlanId: string;
  includedLeadCredits: number;
  invoiceBalance: Money;
  monthlySpend: Money;
  paymentMethod: string;
  renewalDate: string;
  status: "active" | "past_due" | "trialing";
  usedLeadCredits: number;
}

export const mockDealerBillingAccount: MockDealerBillingAccount = {
  currentPlanId: "dealer-growth",
  status: "active",
  renewalDate: "2026-07-01T00:00:00.000Z",
  paymentMethod: "Visa ending 4242",
  invoiceBalance: { amount: 0, currency: "EUR" },
  monthlySpend: { amount: 267, currency: "EUR" },
  includedLeadCredits: 120,
  usedLeadCredits: 74,
};

export const getMockCurrentDealerPlan = () =>
  mockDealerPlans.find(
    (plan) => plan.id === mockDealerBillingAccount.currentPlanId
  ) ?? mockDealerPlans[0];

export const getMockPromotionProductById = (id: string) =>
  mockPromotionProducts.find((product) => product.id === id);

export const getMockMonetizationStats = () => {
  const activePromotions = mockActivePromotions.filter(
    (promotion) => promotion.status === "active"
  );
  const totalLeads = mockActivePromotions.reduce(
    (total, promotion) => total + promotion.leads,
    0
  );
  const totalSpend = mockActivePromotions.reduce(
    (total, promotion) => total + promotion.spend.amount,
    0
  );

  return {
    activePromotions: activePromotions.length,
    leadCreditsRemaining:
      mockDealerBillingAccount.includedLeadCredits -
      mockDealerBillingAccount.usedLeadCredits,
    promotionLeads: totalLeads,
    promotionSpend: { amount: totalSpend, currency: "EUR" } satisfies Money,
  };
};
