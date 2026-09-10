import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import {
  curatedVehicleTaxonomy,
  getVehicleMakeId,
  getVehicleModelId,
  normalizeVehicleTaxonomyLabel,
  slugifyVehicleTaxonomyValue,
} from "@repo/marketplace-domain";
import {
  mockListings,
  mockSavedSearches,
} from "@repo/marketplace-domain/testing/mock-data";
import "dotenv/config";
import ws from "ws";
import { type PriceCurrency, PrismaClient } from "../generated/client";
import { seedVehicleTaxonomyCatalog } from "../vehicle-taxonomy";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed marketplace data.");
}

neonConfig.webSocketConstructor = ws;

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

const DEMO_BUYER_ID = "demo-buyer";
const DEMO_DEALER_MEMBER_CLERK_USER_ID = "user_demo_dealer";
const PRICE_MINOR_SCALE = 100;

const seededTaxonomyByMakeModel = new Map(
  curatedVehicleTaxonomy.makes.flatMap((makeDefinition) => {
    const makeSlug =
      makeDefinition.slug ?? slugifyVehicleTaxonomyValue(makeDefinition.name);
    const makeNames = [makeDefinition.name, ...(makeDefinition.aliases ?? [])];

    return makeDefinition.models.flatMap((modelDefinition) => {
      const modelSlug =
        modelDefinition.slug ??
        slugifyVehicleTaxonomyValue(modelDefinition.name);
      const modelNames = [
        modelDefinition.name,
        ...(modelDefinition.aliases ?? []),
      ];

      return makeNames.flatMap((makeName) =>
        modelNames.map(
          (modelName) =>
            [
              `${normalizeVehicleTaxonomyLabel(
                makeName
              )}\u0000${normalizeVehicleTaxonomyLabel(modelName)}`,
              {
                vehicleMakeId: getVehicleMakeId(makeSlug),
                vehicleModelId: getVehicleModelId(makeSlug, modelSlug),
              },
            ] as const
        )
      );
    });
  })
);

const getSeededTaxonomyIds = (make: string, model: string) =>
  seededTaxonomyByMakeModel.get(
    `${normalizeVehicleTaxonomyLabel(make)}\u0000${normalizeVehicleTaxonomyLabel(
      model
    )}`
  );

const toPriceCurrency = (currency: string): PriceCurrency => {
  if (currency !== "BGN" && currency !== "EUR") {
    throw new Error(`Unsupported legacy listing currency: ${currency}`);
  }

  return currency;
};

const demoDealerOrgs = [
  {
    city: "Sofia",
    clerkOrgId: "org_demo_sofia_premium",
    displayName: "Sofia Premium Cars",
    id: "dealer-org-sofia-premium",
    legalName: "Sofia Premium Cars OOD",
    orgType: "dealer" as const,
    phone: "+359 2 000 1001",
    sellerId: "dealer-sofia-premium",
    slug: "sofia-premium-cars",
    websiteUrl: "https://sofia-premium.example",
  },
  {
    city: "Varna",
    clerkOrgId: "org_demo_black_sea_ev",
    displayName: "Black Sea EV",
    id: "dealer-org-black-sea-ev",
    legalName: "Black Sea EV OOD",
    orgType: "dealer" as const,
    phone: "+359 52 000 1003",
    sellerId: "dealer-black-sea-ev",
    slug: "black-sea-ev",
    websiteUrl: "https://black-sea-ev.example",
  },
  {
    city: "Sofia",
    clerkOrgId: "org_demo_pro_vans",
    displayName: "Pro Vans Bulgaria",
    id: "dealer-org-pro-vans",
    legalName: "Pro Vans Bulgaria OOD",
    orgType: "distributor" as const,
    phone: "+359 2 000 1005",
    sellerId: "dealer-pro-vans",
    slug: "pro-vans-bulgaria",
    websiteUrl: "https://pro-vans.example",
  },
  {
    city: "Ruse",
    clerkOrgId: "org_demo_danube_trucks",
    displayName: "Danube Trucks",
    id: "dealer-org-danube-trucks",
    legalName: "Danube Trucks OOD",
    orgType: "importer" as const,
    phone: "+359 82 000 1006",
    sellerId: "dealer-danube-trucks",
    slug: "danube-trucks",
    websiteUrl: "https://danube-trucks.example",
  },
  {
    city: "Stara Zagora",
    clerkOrgId: "org_demo_trakia_auto",
    displayName: "Trakia Auto",
    id: "dealer-org-trakia-auto",
    legalName: "Trakia Auto OOD",
    orgType: "dealer" as const,
    phone: "+359 42 000 1008",
    sellerId: "dealer-trakia-auto",
    slug: "trakia-auto",
    websiteUrl: "https://trakia-auto.example",
  },
];

const dealerOrgIdBySellerId = Object.fromEntries(
  demoDealerOrgs.map((dealerOrg) => [dealerOrg.sellerId, dealerOrg.id])
);

const seedDealerOrgs = async () => {
  const dealerAccount = await prisma.marketplaceAccount.upsert({
    create: { clerkUserId: DEMO_DEALER_MEMBER_CLERK_USER_ID },
    update: { status: "active" },
    where: { clerkUserId: DEMO_DEALER_MEMBER_CLERK_USER_ID },
  });

  for (const dealerOrg of demoDealerOrgs) {
    await prisma.dealerOrg.upsert({
      create: {
        city: dealerOrg.city,
        clerkOrgId: dealerOrg.clerkOrgId,
        displayName: dealerOrg.displayName,
        id: dealerOrg.id,
        legalName: dealerOrg.legalName,
        orgType: dealerOrg.orgType,
        phone: dealerOrg.phone,
        slug: dealerOrg.slug,
        verificationStatus: "verified",
        websiteFeedEnabled: true,
        websiteUrl: dealerOrg.websiteUrl,
      },
      update: {
        city: dealerOrg.city,
        clerkOrgId: dealerOrg.clerkOrgId,
        displayName: dealerOrg.displayName,
        legalName: dealerOrg.legalName,
        orgType: dealerOrg.orgType,
        phone: dealerOrg.phone,
        slug: dealerOrg.slug,
        verificationStatus: "verified",
        websiteFeedEnabled: true,
        websiteUrl: dealerOrg.websiteUrl,
      },
      where: {
        id: dealerOrg.id,
      },
    });

    await prisma.dealerMember.upsert({
      create: {
        accountId: dealerAccount.id,
        dealerOrgId: dealerOrg.id,
        id: `${dealerOrg.id}-owner`,
        role: "owner",
      },
      update: {
        role: "owner",
        status: "active",
      },
      where: {
        dealerOrgId_accountId: {
          accountId: dealerAccount.id,
          dealerOrgId: dealerOrg.id,
        },
      },
    });
  }
};

const seedPrivateSellerProfiles = async () => {
  const privateListings = mockListings.filter(
    (listing) => listing.seller.type === "private"
  );

  for (const listing of privateListings) {
    await prisma.sellerProfile.upsert({
      create: {
        city: listing.seller.city,
        country: listing.location.country,
        displayName: listing.seller.displayName,
        id: listing.seller.id,
        status: "unclaimed",
        verificationStatus: listing.seller.verificationStatus,
      },
      update: {
        city: listing.seller.city,
        displayName: listing.seller.displayName,
        verificationStatus: listing.seller.verificationStatus,
      },
      where: { id: listing.seller.id },
    });
  }
};

const seedListings = async () => {
  for (const listing of mockListings) {
    const dealerOrgId = dealerOrgIdBySellerId[listing.seller.id];
    const sellerProfileId =
      listing.seller.type === "private" ? listing.seller.id : undefined;
    const taxonomyIds = getSeededTaxonomyIds(
      listing.spec.make,
      listing.spec.model
    );

    const seededListing = await prisma.marketplaceListing.upsert({
      create: {
        id: listing.id,
        slug: listing.slug,
        category: listing.category,
        status: listing.status,
        title: listing.title,
        description: listing.description,
        priceAmountMinor: listing.price.amount * PRICE_MINOR_SCALE,
        priceCurrency: toPriceCurrency(listing.price.currency),
        priceType: listing.priceType,
        monthlyAmountMinor:
          listing.monthlyEstimate?.amount === undefined
            ? undefined
            : listing.monthlyEstimate.amount * PRICE_MINOR_SCALE,
        monthlyCurrency: listing.monthlyEstimate?.currency
          ? toPriceCurrency(listing.monthlyEstimate.currency)
          : undefined,
        badges: listing.badges,
        make: listing.spec.make,
        model: listing.spec.model,
        trim: listing.spec.trim,
        vehicleMakeId: taxonomyIds?.vehicleMakeId,
        vehicleModelId: taxonomyIds?.vehicleModelId,
        year: listing.spec.year,
        bodyType: listing.spec.bodyType,
        fuelType: listing.spec.fuelType,
        transmission: listing.spec.transmission,
        mileageValue: listing.spec.mileageValue,
        mileageUnit: listing.spec.mileageUnit,
        enginePowerHp: listing.spec.enginePowerHp,
        colorExterior: listing.spec.colorExterior,
        locationCity: listing.location.city,
        locationRegion: listing.location.region,
        locationCountry: listing.location.country,
        sellerId: listing.seller.id,
        sellerType: listing.seller.type,
        sellerDisplayName: listing.seller.displayName,
        sellerVerificationStatus: listing.seller.verificationStatus,
        sellerCity: listing.seller.city,
        sellerProfileId,
        dealerOrgId,
        promoted: listing.promoted,
        publishedAt: new Date(listing.publishedAt),
      },
      update: {
        category: listing.category,
        status: listing.status,
        title: listing.title,
        description: listing.description,
        priceAmountMinor: listing.price.amount * PRICE_MINOR_SCALE,
        priceCurrency: toPriceCurrency(listing.price.currency),
        priceType: listing.priceType,
        monthlyAmountMinor:
          listing.monthlyEstimate?.amount === undefined
            ? undefined
            : listing.monthlyEstimate.amount * PRICE_MINOR_SCALE,
        monthlyCurrency: listing.monthlyEstimate?.currency
          ? toPriceCurrency(listing.monthlyEstimate.currency)
          : undefined,
        badges: listing.badges,
        make: listing.spec.make,
        model: listing.spec.model,
        trim: listing.spec.trim,
        vehicleMakeId: taxonomyIds?.vehicleMakeId,
        vehicleModelId: taxonomyIds?.vehicleModelId,
        year: listing.spec.year,
        bodyType: listing.spec.bodyType,
        fuelType: listing.spec.fuelType,
        transmission: listing.spec.transmission,
        mileageValue: listing.spec.mileageValue,
        mileageUnit: listing.spec.mileageUnit,
        enginePowerHp: listing.spec.enginePowerHp,
        colorExterior: listing.spec.colorExterior,
        locationCity: listing.location.city,
        locationRegion: listing.location.region,
        locationCountry: listing.location.country,
        sellerId: listing.seller.id,
        sellerType: listing.seller.type,
        sellerDisplayName: listing.seller.displayName,
        sellerVerificationStatus: listing.seller.verificationStatus,
        sellerCity: listing.seller.city,
        sellerProfileId,
        dealerOrgId,
        promoted: listing.promoted,
        publishedAt: new Date(listing.publishedAt),
      },
      where: {
        slug: listing.slug,
      },
    });

    await prisma.marketplaceListingImage.deleteMany({
      where: { listingId: seededListing.id },
    });

    await prisma.marketplaceListingImage.createMany({
      data: listing.images.map((image, position) => ({
        alt: image.alt,
        listingId: seededListing.id,
        originalUrl: image.url,
        position,
        processedUrl: image.url,
        processingProvider: "stub",
        processingStatus: "skipped",
        url: image.url,
      })),
    });

    await prisma.listingStatusEvent.upsert({
      create: {
        actorDealerOrgId: dealerOrgId,
        createdAt: new Date(listing.publishedAt),
        id: `status_seed_${seededListing.id}`,
        listingId: seededListing.id,
        reasonCode: "seed",
        toStatus: listing.status,
      },
      update: {
        actorDealerOrgId: dealerOrgId,
        reasonCode: "seed",
        toStatus: listing.status,
      },
      where: { id: `status_seed_${seededListing.id}` },
    });

    await prisma.listingPriceSnapshot.upsert({
      create: {
        amountMinor: listing.price.amount * PRICE_MINOR_SCALE,
        createdAt: new Date(listing.publishedAt),
        currency: toPriceCurrency(listing.price.currency),
        id: `price_seed_${seededListing.id}`,
        listingId: seededListing.id,
        monthlyAmountMinor:
          listing.monthlyEstimate?.amount === undefined
            ? undefined
            : listing.monthlyEstimate.amount * PRICE_MINOR_SCALE,
        monthlyCurrency: listing.monthlyEstimate?.currency
          ? toPriceCurrency(listing.monthlyEstimate.currency)
          : undefined,
        priceType: listing.priceType,
        source: "seed",
      },
      update: {
        amountMinor: listing.price.amount * PRICE_MINOR_SCALE,
        currency: toPriceCurrency(listing.price.currency),
        monthlyAmountMinor:
          listing.monthlyEstimate?.amount === undefined
            ? undefined
            : listing.monthlyEstimate.amount * PRICE_MINOR_SCALE,
        monthlyCurrency: listing.monthlyEstimate?.currency
          ? toPriceCurrency(listing.monthlyEstimate.currency)
          : undefined,
        priceType: listing.priceType,
        source: "seed",
      },
      where: { id: `price_seed_${seededListing.id}` },
    });
  }
};

const seedDirectoryEntries = async () => {
  const inventoryConfirmedAt = new Date();

  for (const dealerOrg of demoDealerOrgs) {
    const publicListings = mockListings.filter(
      (listing) =>
        listing.seller.id === dealerOrg.sellerId && listing.status === "active"
    );

    if (publicListings.length === 0) {
      continue;
    }

    const localInventoryCount = publicListings.filter(
      (listing) =>
        listing.location.country === "Bulgaria" ||
        listing.location.country === "България"
    ).length;
    const sourceStockCount = publicListings.length - localInventoryCount;
    const directoryEntry = {
      claimStatus: "claimed" as const,
      city: dealerOrg.city,
      country: "Bulgaria",
      dealerOrgId: dealerOrg.id,
      displayName: dealerOrg.displayName,
      headquartersCountryCode: "BG",
      inventoryLastConfirmedAt: inventoryConfirmedAt,
      inventoryLocalCount: localInventoryCount,
      inventorySourceStockCount: sourceStockCount,
      legalName: dealerOrg.legalName,
      orgType: dealerOrg.orgType,
      phone: dealerOrg.phone,
      publishedAt: new Date(publicListings[0].publishedAt),
      slug: dealerOrg.slug,
      sourceKind: "first_party" as const,
      status: "published" as const,
      websiteUrl: dealerOrg.websiteUrl,
    };

    await prisma.organizationDirectoryEntry.upsert({
      create: {
        ...directoryEntry,
        id: `directory_${dealerOrg.id}`,
      },
      update: directoryEntry,
      where: { id: `directory_${dealerOrg.id}` },
    });
  }
};

const seedBuyerState = async () => {
  const buyerAccount = await prisma.marketplaceAccount.upsert({
    create: { clerkUserId: DEMO_BUYER_ID },
    update: { status: "active" },
    where: { clerkUserId: DEMO_BUYER_ID },
  });

  await prisma.savedListing.createMany({
    data: ["am-1001", "am-1003", "am-1008"].map((listingId) => ({
      listingId,
      accountId: buyerAccount.id,
    })),
    skipDuplicates: true,
  });

  for (const savedSearch of mockSavedSearches) {
    await prisma.savedSearch.upsert({
      create: {
        id: savedSearch.id,
        accountId: buyerAccount.id,
        title: savedSearch.title,
        description: savedSearch.description,
        filters: savedSearch.filters,
        cadence: savedSearch.cadence,
        newMatches: savedSearch.newMatches,
        lastRunAt: new Date(savedSearch.lastRunAt),
      },
      update: {
        title: savedSearch.title,
        description: savedSearch.description,
        filters: savedSearch.filters,
        cadence: savedSearch.cadence,
        newMatches: savedSearch.newMatches,
        lastRunAt: new Date(savedSearch.lastRunAt),
      },
      where: {
        id: savedSearch.id,
      },
    });
  }
};

const main = async () => {
  await seedVehicleTaxonomyCatalog(prisma, curatedVehicleTaxonomy);
  await seedDealerOrgs();
  await seedPrivateSellerProfiles();
  await seedListings();
  await seedDirectoryEntries();
  await seedBuyerState();
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
