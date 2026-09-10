import {
  type OrganizationDirectoryEntry,
  type OrganizationDirectoryType,
  type OrganizationInventoryAvailabilityKind,
  organizationDirectoryEntriesSchema,
} from "./directory";
import { getMockListingById } from "./mock-data";

const getRepresentativeVehicle = (
  listingId: string,
  availability: OrganizationInventoryAvailabilityKind
) => {
  const listing = getMockListingById(listingId);
  const image = listing?.images[0];

  if (!(listing && image)) {
    throw new Error(`Missing representative marketplace listing: ${listingId}`);
  }

  return {
    availability,
    href: `/listing/${listing.slug}`,
    id: listing.id,
    image: {
      alt: image.alt,
      url: image.url,
    },
    price: listing.price,
    title: listing.title,
  };
};

/**
 * Public directory fixtures for local/demo mode. Names that are not backed by
 * existing marketplace inventory are explicitly labelled as demos so they are
 * never presented as verified real-world businesses.
 */
export const mockOrganizationDirectoryCoreEntries =
  organizationDirectoryEntriesSchema.parse([
    {
      brandCoverage: [
        {
          authorizationVerified: false,
          brand: "BMW",
          relationship: "independent_importer",
        },
        {
          authorizationVerified: false,
          brand: "Mercedes-Benz",
          relationship: "independent_importer",
        },
      ],
      claimStatus: "unclaimed",
      contact: {},
      description:
        "Demo cross-border supplier profile with feed-backed stock and delivery quoting to Bulgaria.",
      displayName: "AutoMarket Import Demo",
      headquarters: {
        city: "Hamburg",
        countryCode: "DE",
      },
      headline: "Vehicles from Germany with delivery support",
      id: "directory-import-demo",
      inventory: {
        activeListingCount: 0,
        inTransitCount: 0,
        localCount: 0,
        orderableCount: 0,
        sourceStockCount: 1,
      },
      orgType: "importer",
      profileImage: {
        alt: "Vehicle import facility in Hamburg",
        url: "/images/directory/hamburg-importer-profile.webp",
      },
      representativeVehicles: [
        getRepresentativeVehicle("am-1009", "source_stock"),
      ],
      slug: "automarket-import-demo",
      tradeLanes: [
        {
          destinationCountryCode: "BG",
          originCountryCode: "DE",
          serviceKinds: [
            "inspection",
            "export_documents",
            "transport",
            "registration",
          ],
          vehicleCategories: ["car", "van"],
        },
      ],
      verification: {
        businessVerified: false,
        inventoryCurrent: false,
        trustedSupplier: false,
      },
    },
    {
      brandCoverage: [
        {
          authorizationVerified: false,
          brand: "Audi",
          relationship: "independent_importer",
        },
        {
          authorizationVerified: false,
          brand: "Tesla",
          relationship: "independent_importer",
        },
        {
          authorizationVerified: false,
          brand: "BMW",
          relationship: "independent_importer",
        },
      ],
      claimStatus: "unclaimed",
      contact: {},
      description:
        "Illustrative EV sourcing profile using marketplace-backed examples for delivery, inspection, and registration workflows.",
      displayName: "EV Import Network Demo",
      headquarters: {
        city: "Sofia",
        countryCode: "BG",
      },
      headline: "Electric vehicles sourced from Germany to Bulgaria",
      id: "directory-ev-import-network-demo",
      inventory: {
        activeListingCount: 0,
        inTransitCount: 3,
        localCount: 0,
        orderableCount: 18,
        sourceStockCount: 24,
      },
      orgType: "importer",
      profileImage: {
        alt: "Electric vehicle sourcing and logistics facility",
        url: "/images/directory/china-ev-importer-profile.webp",
      },
      representativeVehicles: [
        getRepresentativeVehicle("am-1014", "orderable"),
        getRepresentativeVehicle("am-1003", "orderable"),
      ],
      slug: "ev-import-network-demo",
      tradeLanes: [
        {
          destinationCountryCode: "BG",
          originCountryCode: "DE",
          serviceKinds: [
            "vehicle_sourcing",
            "inspection",
            "export_documents",
            "transport",
            "registration",
            "finance",
          ],
          vehicleCategories: ["car", "van"],
        },
      ],
      verification: {
        businessVerified: false,
        inventoryCurrent: false,
        trustedSupplier: false,
      },
    },
    {
      brandCoverage: [
        {
          authorizationVerified: false,
          brand: "BMW",
          relationship: "independent_importer",
        },
        {
          authorizationVerified: false,
          brand: "Audi",
          relationship: "independent_importer",
        },
      ],
      claimStatus: "claimed",
      contact: {
        email: "sales@sofia-premium.example",
        phone: "+359 2 000 1001",
        websiteUrl: "https://sofia-premium.example",
      },
      dealerOrgId: "dealer-sofia-premium",
      description:
        "Local dealer inventory with inspection history and finance enquiries.",
      displayName: "Sofia Premium Cars",
      headquarters: {
        city: "Sofia",
        countryCode: "BG",
      },
      headline: "Premium used cars available locally",
      id: "directory-sofia-premium",
      inventory: {
        activeListingCount: 6,
        inTransitCount: 0,
        lastConfirmedAt: "2026-07-20T08:00:00.000Z",
        localCount: 6,
        orderableCount: 0,
        sourceStockCount: 0,
      },
      orgType: "dealer",
      profileImage: {
        alt: "Premium vehicle showroom in Sofia",
        url: "/images/directory/sofia-premium-cars-profile.webp",
      },
      representativeVehicles: [
        getRepresentativeVehicle("am-1001", "local"),
        getRepresentativeVehicle("am-1010", "local"),
        getRepresentativeVehicle("am-1011", "local"),
      ],
      slug: "sofia-premium-cars",
      tradeLanes: [],
      verification: {
        businessVerified: true,
        inventoryCurrent: true,
        trustedSupplier: false,
      },
    },
    {
      brandCoverage: [
        {
          authorizationVerified: false,
          brand: "Tesla",
          relationship: "independent_importer",
        },
      ],
      claimStatus: "claimed",
      contact: {},
      dealerOrgId: "dealer-black-sea-ev",
      description:
        "Electric vehicle specialist serving the Bulgarian Black Sea region.",
      displayName: "Black Sea EV",
      headquarters: {
        city: "Varna",
        countryCode: "BG",
      },
      headline: "Electric vehicles, leasing, and local handover",
      id: "directory-black-sea-ev",
      inventory: {
        activeListingCount: 1,
        inTransitCount: 0,
        lastConfirmedAt: "2026-07-13T08:00:00.000Z",
        localCount: 1,
        orderableCount: 0,
        sourceStockCount: 0,
      },
      orgType: "dealer",
      profileImage: {
        alt: "Coastal electric vehicle specialist near Varna",
        url: "/images/directory/black-sea-ev-profile.webp",
      },
      representativeVehicles: [getRepresentativeVehicle("am-1003", "local")],
      slug: "black-sea-ev",
      tradeLanes: [],
      verification: {
        businessVerified: true,
        inventoryCurrent: true,
        trustedSupplier: false,
      },
    },
    {
      brandCoverage: [
        {
          authorizationVerified: false,
          brand: "Mercedes-Benz",
          relationship: "independent_importer",
        },
      ],
      claimStatus: "claimed",
      contact: {
        email: "sales@pro-vans.example",
        phone: "+359 2 000 1005",
      },
      dealerOrgId: "dealer-pro-vans",
      description:
        "Commercial van specialist with local stock, VAT-ready offers, and finance enquiries.",
      displayName: "Pro Vans Bulgaria",
      headquarters: {
        city: "Sofia",
        countryCode: "BG",
      },
      headline: "Passenger and commercial vans in local stock",
      id: "directory-pro-vans",
      inventory: {
        activeListingCount: 1,
        inTransitCount: 0,
        lastConfirmedAt: "2026-07-19T08:30:00.000Z",
        localCount: 1,
        orderableCount: 0,
        sourceStockCount: 0,
      },
      orgType: "dealer",
      profileImage: {
        alt: "Commercial van stock outside a dealership",
        url: "/images/avatars/organization-03.webp",
      },
      representativeVehicles: [getRepresentativeVehicle("am-1005", "local")],
      slug: "pro-vans-bulgaria",
      tradeLanes: [],
      verification: {
        businessVerified: true,
        inventoryCurrent: true,
        trustedSupplier: false,
      },
    },
    {
      brandCoverage: [
        {
          authorizationVerified: false,
          brand: "Ford",
          relationship: "independent_importer",
        },
      ],
      claimStatus: "claimed",
      contact: {
        email: "inventory@danube-trucks.example",
        phone: "+359 82 000 1006",
      },
      dealerOrgId: "dealer-danube-trucks",
      description:
        "Regional commercial-vehicle distributor focused on pickups, work vehicles, and fleet handover.",
      displayName: "Danube Trucks",
      headquarters: {
        city: "Ruse",
        countryCode: "BG",
      },
      headline: "Pickups and work vehicles for regional fleets",
      id: "directory-danube-trucks",
      inventory: {
        activeListingCount: 1,
        inTransitCount: 0,
        lastConfirmedAt: "2026-07-18T09:00:00.000Z",
        localCount: 1,
        orderableCount: 0,
        sourceStockCount: 0,
      },
      orgType: "distributor",
      profileImage: {
        alt: "Vehicle logistics truck at a distribution facility",
        url: "/images/avatars/organization-04.webp",
      },
      representativeVehicles: [getRepresentativeVehicle("am-1006", "local")],
      slug: "danube-trucks",
      tradeLanes: [],
      verification: {
        businessVerified: true,
        inventoryCurrent: true,
        trustedSupplier: false,
      },
    },
    {
      brandCoverage: [
        {
          authorizationVerified: false,
          brand: "Audi",
          relationship: "independent_importer",
        },
      ],
      claimStatus: "claimed",
      contact: {
        email: "sales@trakia-auto.example",
        phone: "+359 42 000 1008",
      },
      dealerOrgId: "dealer-trakia-auto",
      description:
        "Independent regional dealer with inspected premium vehicles and warranty enquiries.",
      displayName: "Trakia Auto",
      headquarters: {
        city: "Stara Zagora",
        countryCode: "BG",
      },
      headline: "Inspected premium vehicles in central Bulgaria",
      id: "directory-trakia-auto",
      inventory: {
        activeListingCount: 1,
        inTransitCount: 0,
        lastConfirmedAt: "2026-07-17T07:45:00.000Z",
        localCount: 1,
        orderableCount: 0,
        sourceStockCount: 0,
      },
      orgType: "dealer",
      profileImage: {
        alt: "Vehicle outside a modern regional showroom",
        url: "/images/avatars/organization-01.webp",
      },
      representativeVehicles: [getRepresentativeVehicle("am-1008", "local")],
      slug: "trakia-auto",
      tradeLanes: [],
      verification: {
        businessVerified: true,
        inventoryCurrent: true,
        trustedSupplier: false,
      },
    },
    {
      brandCoverage: [
        {
          authorizationVerified: false,
          brand: "Toyota",
          relationship: "official_representative",
        },
        {
          authorizationVerified: false,
          brand: "Volkswagen",
          relationship: "official_representative",
        },
        {
          authorizationVerified: false,
          brand: "Yamaha",
          relationship: "official_representative",
        },
      ],
      claimStatus: "unclaimed",
      contact: {},
      description:
        "Illustrative manufacturer profile showing how orderable brand ranges can appear without implying verified authorization.",
      displayName: "AutoMarket Brand Demo",
      headquarters: {
        city: "Plovdiv",
        countryCode: "BG",
      },
      headline: "Orderable vehicle ranges across multiple categories",
      id: "directory-manufacturer-demo",
      inventory: {
        activeListingCount: 0,
        inTransitCount: 0,
        localCount: 0,
        orderableCount: 3,
        sourceStockCount: 0,
      },
      orgType: "manufacturer",
      profileImage: {
        alt: "Vehicle on an illustrative production line",
        url: "/images/avatars/organization-07.webp",
      },
      representativeVehicles: [
        getRepresentativeVehicle("am-1004", "orderable"),
        getRepresentativeVehicle("am-1002", "orderable"),
        getRepresentativeVehicle("am-1007", "orderable"),
      ],
      slug: "automarket-manufacturer-demo",
      tradeLanes: [],
      verification: {
        businessVerified: false,
        inventoryCurrent: false,
        trustedSupplier: false,
      },
    },
  ]);

const scaleOrganizationTypes = [
  "dealer",
  "importer",
  "manufacturer",
  "distributor",
] as const satisfies readonly OrganizationDirectoryType[];

const scaleHeadquarters = [
  { city: "Sofia", countryCode: "BG" },
  { city: "Plovdiv", countryCode: "BG" },
  { city: "Varna", countryCode: "BG" },
  { city: "Hamburg", countryCode: "DE" },
  { city: "Shanghai", countryCode: "CN" },
  { city: "Yokohama", countryCode: "JP" },
  { city: "Busan", countryCode: "KR" },
  { city: "Long Beach", countryCode: "US" },
] as const;

const getScaleInventory = (
  index: number
): OrganizationDirectoryEntry["inventory"] => {
  switch (index % 4) {
    case 1:
      return {
        activeListingCount: 0,
        inTransitCount: 0,
        localCount: 0,
        orderableCount: 1,
        sourceStockCount: 0,
      };
    case 2:
      return {
        activeListingCount: 0,
        inTransitCount: 0,
        localCount: 0,
        orderableCount: 0,
        sourceStockCount: 7,
      };
    case 3:
      return {
        activeListingCount: 0,
        inTransitCount: 12,
        localCount: 0,
        orderableCount: 9,
        sourceStockCount: 0,
      };
    default:
      return {
        activeListingCount: 0,
        inTransitCount: 0,
        localCount: 0,
        orderableCount: 0,
        sourceStockCount: 0,
      };
  }
};

const createScaleOrganization = (index: number): OrganizationDirectoryEntry => {
  const fixtureNumber = String(index + 1).padStart(3, "0");
  const orgType = scaleOrganizationTypes[index % scaleOrganizationTypes.length];
  const headquarters = scaleHeadquarters[index % scaleHeadquarters.length];
  const inventory = getScaleInventory(index);
  const hasSourcePreview = inventory.sourceStockCount > 0 && index % 5 === 2;
  const usesBulgarianLongName = index % 2 === 1;

  return {
    brandCoverage: [
      {
        authorizationVerified: false,
        brand: `Directory Demo Brand ${String((index % 16) + 1).padStart(2, "0")}`,
        relationship: "independent_importer",
      },
    ],
    claimStatus: "unclaimed",
    contact: {},
    description: usesBulgarianLongName
      ? "Детерминиран демонстрационен запис за проверка на търсене, филтриране, странициране и устойчиво подреждане при голяма бизнес директория."
      : "Deterministic demonstration record for validating search, filtering, pagination, and stable ordering in a large business directory.",
    displayName: usesBulgarianLongName
      ? `AutoMarket Директория Демо ${fixtureNumber} — Регионален център за автомобили, логистика и мобилност`
      : `AutoMarket Directory Demo ${fixtureNumber} — International Vehicle, Logistics and Mobility Centre`,
    headquarters: { ...headquarters },
    headline: usesBulgarianLongName
      ? "Демонстрационна организация с дълго име и ограничена тестова наличност"
      : "Demonstration organization with a long name and bounded test inventory",
    id: `directory-scale-demo-${fixtureNumber}`,
    inventory,
    orgType,
    ...(index % 3 === 0
      ? {
          profileImage: {
            alt: `Generic vehicle business artwork for directory scale demo ${fixtureNumber}`,
            url: `/images/avatars/organization-0${(index % 7) + 1}.webp`,
          },
        }
      : {}),
    representativeVehicles: hasSourcePreview
      ? [getRepresentativeVehicle("am-1009", "source_stock")]
      : [],
    slug: `directory-scale-demo-${fixtureNumber}`,
    tradeLanes:
      orgType === "importer" || orgType === "distributor"
        ? [
            {
              destinationCountryCode: "BG",
              originCountryCode: headquarters.countryCode,
              serviceKinds: ["inspection", "transport"],
              vehicleCategories: ["car"],
            },
          ]
        : [],
    verification: {
      businessVerified: false,
      inventoryCurrent: false,
      trustedSupplier: false,
    },
  };
};

export const createMockOrganizationDirectoryScaleEntries = (
  totalOrganizations = 120
) => {
  if (totalOrganizations < mockOrganizationDirectoryCoreEntries.length) {
    throw new Error(
      `Directory scale fixtures require at least ${mockOrganizationDirectoryCoreEntries.length} organizations`
    );
  }

  const generatedCount =
    totalOrganizations - mockOrganizationDirectoryCoreEntries.length;
  const generatedOrganizations = Array.from(
    { length: generatedCount },
    (_, index) => createScaleOrganization(index)
  );

  return organizationDirectoryEntriesSchema.parse([
    ...mockOrganizationDirectoryCoreEntries,
    ...generatedOrganizations,
  ]);
};

/**
 * Provider-free public demo data deliberately exercises the same bounded
 * paging path used by the database-backed directory. Synthetic scale records
 * are plainly labelled as demos and never receive verified/trusted status.
 */
export const mockOrganizationDirectoryEntries =
  createMockOrganizationDirectoryScaleEntries();
