import type { VehicleListing } from "@repo/marketplace";
import { ListingPriceIntelligence } from "@repo/marketplace-ui/components/listing-price-intelligence";
import { ListingTrustPanel } from "@repo/marketplace-ui/components/listing-trust-panel";
import { VehicleCard } from "@repo/marketplace-ui/components/vehicle-card";
import type { Meta, StoryObj } from "@storybook/react";

const image = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750">
    <rect width="1200" height="750" fill="#e8ebef"/>
    <path d="M260 490h680l-78-178c-18-41-58-67-103-67H496c-42 0-81 22-102 58L260 490Z" fill="#9ba4af"/>
    <circle cx="430" cy="510" r="78" fill="#38414b"/>
    <circle cx="815" cy="510" r="78" fill="#38414b"/>
  </svg>
`)}`;

const listing = {
  badges: [],
  category: "car",
  description: "Deterministic Storybook fixture for launch visual review.",
  id: "story-listing-1",
  images: [{ alt: "Neutral vehicle illustration", url: image }],
  location: { city: "Sofia", country: "Bulgaria", region: "Sofia City" },
  monthlyEstimate: { amount: 730, currency: "BGN" },
  price: { amount: 47_900, currency: "BGN" },
  priceType: "fixed",
  promoted: false,
  publishedAt: "2026-07-01T10:00:00.000Z",
  seller: {
    city: "Sofia",
    displayName: "Fixture dealer",
    id: "story-dealer-1",
    type: "dealer",
    verificationStatus: "pending",
  },
  slug: "storybook-launch-fixture",
  spec: {
    bodyType: "suv",
    fuelType: "hybrid",
    make: "AutoMarket",
    mileageUnit: "km",
    mileageValue: 42_000,
    model: "Launch Fixture",
    transmission: "automatic",
    year: 2023,
  },
  status: "active",
  title: "2023 AutoMarket Launch Fixture",
} satisfies VehicleListing;

const MarketplaceLaunchFixture = () => (
  <main className="min-h-screen bg-canvas p-4 text-foreground sm:p-8">
    <div className="mx-auto grid max-w-6xl gap-6">
      <header>
        <p className="font-medium text-info-foreground text-sm">
          Deterministic product fixture
        </p>
        <h1 className="mt-1 font-bold text-2xl tracking-tight">
          Marketplace launch states
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground text-sm">
          Visual QA for vehicle density, unavailable evidence, and explicit
          price assumptions. This fixture does not represent live inventory.
        </p>
      </header>

      <section aria-labelledby="cards-heading">
        <h2 className="mb-3 font-semibold" id="cards-heading">
          Discovery cards
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <VehicleCard listing={listing} viewMode="list" />
          <VehicleCard
            density="compact"
            listing={listing}
            priceInsight={{
              detail: "Evidence unavailable in fixture",
              label: "No comparison",
              tone: "neutral",
            }}
            trustSignals={[
              { id: "vin", label: "VIN not checked", tone: "neutral" },
            ]}
            viewMode="list"
          />
        </div>
      </section>

      <section
        aria-labelledby="evidence-heading"
        className="grid gap-4 lg:grid-cols-2"
      >
        <h2 className="sr-only" id="evidence-heading">
          Price and trust evidence states
        </h2>
        <ListingPriceIntelligence
          evidence={{
            reason:
              "No comparable dataset is attached to this deterministic fixture.",
            state: "unavailable",
          }}
          monthlyEstimate={listing.monthlyEstimate}
          price={listing.price}
          priceType={listing.priceType}
        />
        <ListingTrustPanel
          evidence={[
            {
              id: "fixture-vin",
              kind: "vin",
              label: "VIN history",
              reason: "No provider response is attached to this fixture.",
              state: "unavailable",
            },
            {
              id: "fixture-service",
              kind: "service",
              label: "Service history",
              state: "seller_declared",
              summary:
                "Fixture-only seller statement; not independently checked.",
            },
          ]}
        />
      </section>
    </div>
  </main>
);

const meta = {
  component: MarketplaceLaunchFixture,
  parameters: { layout: "fullscreen" },
  title: "AutoMarket/Marketplace launch states",
} satisfies Meta<typeof MarketplaceLaunchFixture>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Desktop: Story = {};

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: "mobile2" },
  },
};
