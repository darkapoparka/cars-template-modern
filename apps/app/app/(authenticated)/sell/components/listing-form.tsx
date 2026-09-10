import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import {
  bodyTypes,
  formatMileage,
  formatMoney,
  fuelTypes,
  type PriceCurrency,
  transmissionTypes,
  vehicleCategories,
  vehicleMakes,
} from "@repo/marketplace";
import { CameraIcon, SaveIcon } from "lucide-react";
import Link from "next/link";
import type { ListingReturnContext } from "../listing-return-context";
import { ListingFormSummary } from "./listing-form-summary";

interface SellerListingFormProps {
  action: (formData: FormData) => Promise<void>;
  cancelHref?: string;
  defaults?: SellerListingDefaults;
  listing?: {
    readonly bodyType: string;
    readonly category: string;
    readonly colorExterior: string | null;
    readonly description: string;
    readonly enginePowerHp: number | null;
    readonly fuelType: string;
    readonly id: string;
    readonly images?: readonly unknown[];
    readonly locationCity: string;
    readonly locationCountry: string;
    readonly locationRegion: string | null;
    readonly make: string;
    readonly mileageValue: number;
    readonly model: string;
    readonly monthlyAmountMinor: number | null;
    readonly priceAmountMinor: number;
    readonly priceCurrency: string;
    readonly priceType: string;
    readonly status: string;
    readonly title: string;
    readonly transmission: string;
    readonly trim: string | null;
    readonly vin: string | null;
    readonly year: number;
  };
  mode: "create" | "edit";
  primaryHeadingLevel?: "h1" | "h2";
  returnContext?: ListingReturnContext;
}

export interface SellerListingDefaults {
  readonly category?: string;
  readonly make?: string;
  readonly mileageValue?: number;
  readonly model?: string;
  readonly year?: number;
}

const inputClassName = "h-10 rounded-lg";
const selectClassName =
  "h-10 rounded-lg border border-input bg-background px-3 text-sm";

const defaultDescription =
  "Сервизна история, състояние, включено оборудване, гаранция, финансиране и информация за собствеността.";

const submitLabels = {
  create: "Създай чернова",
  edit: "Запази промените",
} as const;
const categoryLabels: Record<string, string> = {
  car: "Автомобил",
  lease: "Лизинг",
  motorbike: "Мотоциклет",
  truck: "Камион",
  van: "Бус",
};
const bodyTypeLabels: Record<string, string> = {
  convertible: "Кабриолет",
  coupe: "Купе",
  hatchback: "Хечбек",
  minibus: "Микробус",
  motorcycle: "Мотоциклет",
  other: "Друго",
  pickup: "Пикап",
  scooter: "Скутер",
  sedan: "Седан",
  suv: "SUV",
  truck: "Камион",
  van: "Бус",
  wagon: "Комби",
};
const fuelTypeLabels: Record<string, string> = {
  cng: "Метан",
  diesel: "Дизел",
  electric: "Електрически",
  gasoline: "Бензин",
  hybrid: "Хибрид",
  lpg: "Газ",
  other: "Друго",
  plug_in_hybrid: "Plug-in хибрид",
};
const transmissionLabels: Record<string, string> = {
  automatic: "Автоматична",
  manual: "Ръчна",
  semi_automatic: "Полуавтоматична",
};
const statusLabels: Record<string, string> = {
  active: "Активна",
  draft: "Чернова",
  paused: "На пауза",
  pending_review: "Чака преглед",
  rejected: "Отхвърлена",
  sold: "Продадена",
};
const toMajorAmount = (amount?: number | null) =>
  amount === undefined || amount === null
    ? undefined
    : Math.round(amount / 100);
const getPriceCurrency = (value: string): PriceCurrency =>
  value === "EUR" ? "EUR" : "BGN";
const getDefaultTitle = (defaults?: SellerListingDefaults) =>
  [defaults?.year, defaults?.make, defaults?.model].filter(Boolean).join(" ");
const getInitialMileage = (
  listing: SellerListingFormProps["listing"] | undefined,
  defaults: SellerListingDefaults | undefined
) => {
  if (listing) {
    return formatMileage(listing.mileageValue, "bg");
  }

  return defaults?.mileageValue === undefined
    ? "Не е зададен"
    : formatMileage(defaults.mileageValue, "bg");
};
const hasCompleteVehicleDefaults = (defaults?: SellerListingDefaults) =>
  Boolean(
    defaults?.category &&
      defaults.make &&
      defaults.model &&
      defaults.year &&
      defaults.mileageValue !== undefined
  );
const getResolvedFormDefaults = (
  listing: SellerListingFormProps["listing"] | undefined,
  defaults: SellerListingDefaults | undefined
) => ({
  category: listing?.category ?? defaults?.category ?? "car",
  make: listing?.make ?? defaults?.make ?? "BMW",
  mileageValue: listing?.mileageValue ?? defaults?.mileageValue,
  model: listing?.model ?? defaults?.model,
  title: listing?.title ?? (getDefaultTitle(defaults) || undefined),
  year: listing?.year ?? defaults?.year,
});
const getInitialSummaryState = (
  listing?: SellerListingFormProps["listing"],
  defaults?: SellerListingDefaults
) => ({
  locationComplete: listing
    ? Boolean(listing.locationCity && listing.locationCountry)
    : true,
  mileage: getInitialMileage(listing, defaults),
  photosComplete: Boolean(listing?.images?.length),
  price: listing
    ? formatMoney(
        {
          amount: toMajorAmount(listing.priceAmountMinor) ?? 0,
          currency: getPriceCurrency(listing.priceCurrency),
        },
        "bg"
      )
    : "Не е зададена",
  priceComplete: listing
    ? listing.priceAmountMinor >= 0 && listing.priceAmountMinor <= 2_000_000_000
    : false,
  title: listing?.title ?? (getDefaultTitle(defaults) || "Нова обява"),
  vehicleComplete: listing
    ? Boolean(listing.make && listing.model && listing.year && listing.bodyType)
    : hasCompleteVehicleDefaults(defaults),
});

export const SellerListingForm = ({
  action,
  cancelHref = "/sell/listings",
  defaults,
  listing,
  mode,
  primaryHeadingLevel = "h1",
  returnContext,
}: SellerListingFormProps) => {
  const PrimaryHeading = primaryHeadingLevel;
  const submitLabel = submitLabels[mode];
  const initialSummaryState = getInitialSummaryState(listing, defaults);
  const formDefaults = getResolvedFormDefaults(listing, defaults);

  return (
    <form
      action={action}
      className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]"
    >
      {listing && <input name="listingId" type="hidden" value={listing.id} />}
      {returnContext && (
        <input name="returnContext" type="hidden" value={returnContext} />
      )}
      <div className="flex flex-col gap-3 sm:gap-4">
        <section className="rounded-lg border border-border bg-card p-3 sm:p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <PrimaryHeading className="font-semibold text-base">
                Основни данни
              </PrimaryHeading>
              <p className="text-muted-foreground text-sm">
                Категория, марка, модел и основни характеристики.
              </p>
            </div>
            {listing && (
              <Badge className="rounded-full" variant="secondary">
                {statusLabels[listing.status] ??
                  listing.status.replace("_", " ")}
              </Badge>
            )}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="category">Категория</Label>
              <select
                className={selectClassName}
                defaultValue={formDefaults.category}
                id="category"
                name="category"
                required
              >
                {vehicleCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {categoryLabels[category.id] ?? category.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="make">Марка</Label>
              <select
                className={selectClassName}
                defaultValue={formDefaults.make}
                id="make"
                name="make"
                required
              >
                {vehicleMakes.map((make) => (
                  <option key={make} value={make}>
                    {make}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="model">Модел</Label>
              <Input
                aria-describedby="model-requirements"
                className={inputClassName}
                defaultValue={formDefaults.model}
                id="model"
                maxLength={80}
                minLength={1}
                name="model"
                placeholder="X5"
                required
              />
              <p
                className="text-muted-foreground text-xs"
                id="model-requirements"
              >
                Задължително поле, до 80 знака.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="trim">Версия</Label>
              <Input
                className={inputClassName}
                defaultValue={listing?.trim ?? undefined}
                id="trim"
                maxLength={120}
                name="trim"
                placeholder="xDrive40d"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="year">Година</Label>
              <Input
                aria-describedby="year-requirements"
                className={inputClassName}
                defaultValue={formDefaults.year}
                id="year"
                inputMode="numeric"
                max={2100}
                min={1886}
                name="year"
                placeholder="2022"
                required
                step={1}
                type="number"
              />
              <p
                className="text-muted-foreground text-xs"
                id="year-requirements"
              >
                Въведете година между 1886 и 2100.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mileage">Пробег</Label>
              <Input
                aria-describedby="mileage-requirements"
                className={inputClassName}
                defaultValue={formDefaults.mileageValue}
                id="mileage"
                inputMode="numeric"
                max={10_000_000}
                min={0}
                name="mileage"
                placeholder="62000"
                required
                step={1}
                type="number"
              />
              <p
                className="text-muted-foreground text-xs"
                id="mileage-requirements"
              >
                Цяло число от 0 до 10 000 000 км.
              </p>
            </div>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="title">Заглавие на обявата</Label>
              <Input
                aria-describedby="title-requirements"
                className={inputClassName}
                defaultValue={formDefaults.title}
                id="title"
                maxLength={160}
                minLength={3}
                name="title"
                placeholder="2022 BMW X5 xDrive40d"
                required
              />
              <p
                className="text-muted-foreground text-xs"
                id="title-requirements"
              >
                Между 3 и 160 знака.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bodyType">Тип купе</Label>
              <select
                className={selectClassName}
                defaultValue={listing?.bodyType ?? "suv"}
                id="bodyType"
                name="bodyType"
                required
              >
                {bodyTypes.map((value) => (
                  <option key={value} value={value}>
                    {bodyTypeLabels[value] ?? value.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fuelType">Гориво</Label>
              <select
                className={selectClassName}
                defaultValue={listing?.fuelType ?? "diesel"}
                id="fuelType"
                name="fuelType"
                required
              >
                {fuelTypes.map((value) => (
                  <option key={value} value={value}>
                    {fuelTypeLabels[value] ?? value.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="transmission">Скоростна кутия</Label>
              <select
                className={selectClassName}
                defaultValue={listing?.transmission ?? "automatic"}
                id="transmission"
                name="transmission"
                required
              >
                {transmissionTypes.map((value) => (
                  <option key={value} value={value}>
                    {transmissionLabels[value] ?? value.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vin">VIN (незадължително)</Label>
              <Input
                aria-describedby="vin-requirements"
                autoCapitalize="characters"
                className={inputClassName}
                defaultValue={listing?.vin ?? undefined}
                id="vin"
                maxLength={17}
                minLength={17}
                name="vin"
                pattern="[A-HJ-NPR-Z0-9a-hj-npr-z]{17}"
                spellCheck={false}
              />
              <p
                className="text-muted-foreground text-xs"
                id="vin-requirements"
              >
                Точно 17 знака; буквите I, O и Q не се използват.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-3 sm:p-4">
          <div className="mb-4">
            <h2 className="font-semibold text-base">Цена и състояние</h2>
            <p className="text-muted-foreground text-sm">
              Цена, състояние и бележки за купувачите.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="price">Цена</Label>
              <Input
                aria-describedby="price-requirements"
                className={inputClassName}
                defaultValue={toMajorAmount(listing?.priceAmountMinor)}
                id="price"
                inputMode="numeric"
                max={20_000_000}
                min={0}
                name="price"
                placeholder="94900"
                required
                step={1}
                type="number"
              />
              <p
                className="text-muted-foreground text-xs"
                id="price-requirements"
              >
                Цяла сума от 0 до 20 000 000.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currency">Валута</Label>
              <select
                className={selectClassName}
                defaultValue={listing?.priceCurrency ?? "BGN"}
                id="currency"
                name="currency"
                required
              >
                <option value="BGN">BGN</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priceType">Вид цена</Label>
              <select
                className={selectClassName}
                defaultValue={listing?.priceType ?? "fixed"}
                id="priceType"
                name="priceType"
                required
              >
                <option value="fixed">Фиксирана</option>
                <option value="negotiable">По договаряне</option>
                <option value="lease_monthly">Месечен лизинг</option>
                <option value="finance_estimate">Прогнозно финансиране</option>
              </select>
            </div>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="monthlyAmount">Месечна вноска</Label>
              <Input
                aria-describedby="monthly-amount-requirements"
                className={inputClassName}
                defaultValue={toMajorAmount(listing?.monthlyAmountMinor)}
                id="monthlyAmount"
                inputMode="numeric"
                min={0}
                name="monthlyAmount"
                step={1}
                type="number"
              />
              <p
                className="text-muted-foreground text-xs"
                id="monthly-amount-requirements"
              >
                Незадължителна цяла сума, минимум 0.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="locationCity">Град</Label>
              <Input
                aria-describedby="location-city-requirements"
                className={inputClassName}
                defaultValue={listing?.locationCity ?? "Sofia"}
                id="locationCity"
                maxLength={120}
                minLength={2}
                name="locationCity"
                required
              />
              <p
                className="text-muted-foreground text-xs"
                id="location-city-requirements"
              >
                Между 2 и 120 знака.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="locationRegion">Област</Label>
              <Input
                className={inputClassName}
                defaultValue={listing?.locationRegion ?? undefined}
                id="locationRegion"
                maxLength={120}
                name="locationRegion"
              />
            </div>
            <input
              name="locationCountry"
              type="hidden"
              value={listing?.locationCountry ?? "Bulgaria"}
            />
            <div className="grid gap-2">
              <Label htmlFor="enginePowerHp">Мощност (к.с.)</Label>
              <Input
                aria-describedby="engine-power-requirements"
                className={inputClassName}
                defaultValue={listing?.enginePowerHp ?? undefined}
                id="enginePowerHp"
                inputMode="numeric"
                max={2500}
                min={1}
                name="enginePowerHp"
                step={1}
                type="number"
              />
              <p
                className="text-muted-foreground text-xs"
                id="engine-power-requirements"
              >
                Незадължително цяло число от 1 до 2500 к.с.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="colorExterior">Външен цвят</Label>
              <Input
                className={inputClassName}
                defaultValue={listing?.colorExterior ?? undefined}
                id="colorExterior"
                maxLength={120}
                name="colorExterior"
              />
            </div>
          </div>
          <div className="mt-3 grid gap-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              aria-describedby="description-requirements"
              className="min-h-32 rounded-lg"
              defaultValue={listing?.description ?? defaultDescription}
              id="description"
              maxLength={10_000}
              minLength={20}
              name="description"
              required
            />
            <p
              className="text-muted-foreground text-xs"
              id="description-requirements"
            >
              Между 20 и 10 000 знака.
            </p>
          </div>
        </section>

        {mode === "create" ? (
          <section className="rounded-lg border border-border bg-card p-3 sm:p-4">
            <div className="mb-4">
              <h2 className="font-semibold text-base">Снимки</h2>
              <p className="text-muted-foreground text-sm">
                Първо основната снимка, следвана от детайли и интериор.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-[14rem_minmax(0,1fr)]">
              <div className="flex aspect-[16/10] items-center justify-center rounded-lg border border-dashed bg-secondary md:aspect-[4/3]">
                <div className="text-center text-muted-foreground text-sm">
                  <CameraIcon className="mx-auto mb-2 h-6 w-6" />
                  Добавете снимки
                </div>
              </div>
              <div className="grid gap-2 text-muted-foreground text-sm">
                <p>
                  Използвайте ясни снимки на екстериора, интериора, километража
                  и документите.
                </p>
                <p>Качването се активира след създаване на черновата.</p>
              </div>
            </div>
          </section>
        ) : null}
      </div>

      <aside className="flex flex-col gap-3 sm:gap-4">
        <ListingFormSummary
          initialState={initialSummaryState}
          key={listing?.id ?? "create"}
        />
        <div className="flex gap-2">
          <Button asChild className="h-11 rounded-lg" variant="outline">
            <Link href={cancelHref}>Отказ</Link>
          </Button>
          <Button className="h-11 flex-1 gap-2 rounded-lg" type="submit">
            <SaveIcon className="h-4 w-4" />
            {submitLabel}
          </Button>
        </div>
      </aside>
    </form>
  );
};
