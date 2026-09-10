import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SellerListingForm } from "../app/(authenticated)/sell/components/listing-form";

const action = vi.fn(async (_formData: FormData) => undefined);
const savedPricePattern = /80.*000.*лв\./;
const savedMileagePattern = /40.*000 км/;
const liveMileagePattern = /42.*000 км/;
const zeroPricePattern = /0.*лв\./;

const getStatusRow = (label: string) => {
  const row = screen.getByText(label, { selector: "span" }).closest("div");

  if (!row) {
    throw new Error(`Missing status row for ${label}`);
  }

  return within(row);
};

afterEach(cleanup);

const listing = {
  bodyType: "suv",
  category: "car",
  colorExterior: null,
  description: "A complete listing fixture.",
  enginePowerHp: null,
  fuelType: "diesel",
  id: "listing-1",
  images: [{ id: "image-1" }],
  locationCity: "Sofia",
  locationCountry: "Bulgaria",
  locationRegion: null,
  make: "BMW",
  mileageValue: 40_000,
  model: "X5",
  monthlyAmountMinor: null,
  priceAmountMinor: 8_000_000,
  priceCurrency: "BGN",
  priceType: "fixed",
  status: "draft",
  title: "2022 BMW X5",
  transmission: "automatic",
  trim: null,
  vin: null,
  year: 2022,
};

describe("SellerListingForm review truth", () => {
  it("reports only the valid create defaults as complete", () => {
    render(<SellerListingForm action={action} mode="create" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Основни данни" })
    ).toBeTruthy();
    expect(screen.getAllByText("Необходимо")).toHaveLength(3);
    expect(screen.getAllByText("Готово")).toHaveLength(1);
    expect(getStatusRow("Местоположение").getByText("Готово")).toBeTruthy();
  });

  it("prefills a public sell-page vehicle start without inventing listing data", () => {
    render(
      <SellerListingForm
        action={action}
        defaults={{
          category: "car",
          make: "Volvo",
          mileageValue: 42_000,
          model: "XC60",
          year: 2024,
        }}
        mode="create"
      />
    );

    expect(
      (screen.getByLabelText("Категория") as HTMLSelectElement).value
    ).toBe("car");
    expect((screen.getByLabelText("Марка") as HTMLSelectElement).value).toBe(
      "Volvo"
    );
    expect((screen.getByLabelText("Модел") as HTMLInputElement).value).toBe(
      "XC60"
    );
    expect((screen.getByLabelText("Година") as HTMLInputElement).value).toBe(
      "2024"
    );
    expect((screen.getByLabelText("Пробег") as HTMLInputElement).value).toBe(
      "42000"
    );
    expect(
      (screen.getByLabelText("Заглавие на обявата") as HTMLInputElement).value
    ).toBe("2024 Volvo XC60");
    expect(screen.getByText(liveMileagePattern)).toBeTruthy();
  });

  it("derives completed checks from persisted listing data", () => {
    render(<SellerListingForm action={action} listing={listing} mode="edit" />);

    expect(screen.getAllByText("Готово")).toHaveLength(4);
    expect(screen.queryByText("Необходимо")).toBeNull();
    expect(screen.getByText(savedPricePattern)).toBeTruthy();
    expect(screen.getByText(savedMileagePattern)).toBeTruthy();
  });

  it("keeps preview and readiness synchronized with current controls", () => {
    render(<SellerListingForm action={action} mode="create" />);

    fireEvent.input(screen.getByLabelText("Заглавие на обявата"), {
      target: { value: "2024 Volvo XC60" },
    });
    fireEvent.input(screen.getByLabelText("Пробег"), {
      target: { value: "42000" },
    });
    fireEvent.input(screen.getByLabelText("Цена"), {
      target: { value: "0" },
    });
    fireEvent.input(screen.getByLabelText("Модел"), {
      target: { value: "XC60" },
    });
    fireEvent.input(screen.getByLabelText("Година"), {
      target: { value: "2024" },
    });

    expect(screen.getByText("2024 Volvo XC60")).toBeTruthy();
    expect(screen.getByText(liveMileagePattern)).toBeTruthy();
    expect(screen.getByText(zeroPricePattern)).toBeTruthy();
    expect(
      getStatusRow("Данни за автомобила").getByText("Готово")
    ).toBeTruthy();
    expect(getStatusRow("Цена").getByText("Готово")).toBeTruthy();

    fireEvent.input(screen.getByLabelText("Описание"), {
      target: { value: "Кратко" },
    });

    expect(
      getStatusRow("Данни за автомобила").getByText("Необходимо")
    ).toBeTruthy();

    fireEvent.input(screen.getByLabelText("Описание"), {
      target: { value: "Пълно описание на автомобила и неговото състояние." },
    });

    expect(
      getStatusRow("Данни за автомобила").getByText("Готово")
    ).toBeTruthy();

    fireEvent.input(screen.getByLabelText("Град"), {
      target: { value: "" },
    });

    expect(getStatusRow("Местоположение").getByText("Необходимо")).toBeTruthy();
  });

  it("mirrors the server schema in native constraints", () => {
    render(<SellerListingForm action={action} mode="create" />);

    const model = screen.getByLabelText("Модел") as HTMLInputElement;
    const year = screen.getByLabelText("Година") as HTMLInputElement;
    const mileage = screen.getByLabelText("Пробег") as HTMLInputElement;
    const price = screen.getByLabelText("Цена") as HTMLInputElement;
    const title = screen.getByLabelText(
      "Заглавие на обявата"
    ) as HTMLInputElement;
    const vin = screen.getByLabelText(
      "VIN (незадължително)"
    ) as HTMLInputElement;
    const monthlyAmount = screen.getByLabelText(
      "Месечна вноска"
    ) as HTMLInputElement;
    const locationCity = screen.getByLabelText("Град") as HTMLInputElement;
    const enginePower = screen.getByLabelText(
      "Мощност (к.с.)"
    ) as HTMLInputElement;
    const description = screen.getByLabelText(
      "Описание"
    ) as HTMLTextAreaElement;

    expect(model.required).toBe(true);
    expect(model.maxLength).toBe(80);
    expect(model.getAttribute("aria-describedby")).toBe("model-requirements");
    expect(year.min).toBe("1886");
    expect(year.max).toBe("2100");
    expect(year.required).toBe(true);
    expect(mileage.min).toBe("0");
    expect(mileage.max).toBe("10000000");
    expect(mileage.required).toBe(true);
    expect(price.min).toBe("0");
    expect(price.max).toBe("20000000");
    expect(price.required).toBe(true);
    expect(title.minLength).toBe(3);
    expect(title.maxLength).toBe(160);
    expect(title.required).toBe(true);
    expect(vin.minLength).toBe(17);
    expect(vin.maxLength).toBe(17);
    expect(vin.pattern).toBe("[A-HJ-NPR-Z0-9a-hj-npr-z]{17}");
    expect(monthlyAmount.min).toBe("0");
    expect(monthlyAmount.step).toBe("1");
    expect(locationCity.minLength).toBe(2);
    expect(locationCity.maxLength).toBe(120);
    expect(locationCity.required).toBe(true);
    expect(enginePower.min).toBe("1");
    expect(enginePower.max).toBe("2500");
    expect(enginePower.step).toBe("1");
    expect(description.minLength).toBe(20);
    expect(description.maxLength).toBe(10_000);
    expect(description.required).toBe(true);
    expect(screen.getByText("Въведете година между 1886 и 2100.")).toBeTruthy();
    expect(screen.getByText("Цяло число от 0 до 10 000 000 км.")).toBeTruthy();
  });

  it("keeps dealer cancellation inside Dealer Studio", () => {
    const { container } = render(
      <SellerListingForm
        action={action}
        cancelHref="/dealer/inventory"
        mode="create"
        primaryHeadingLevel="h2"
        returnContext="dealer-inventory"
      />
    );

    expect(
      screen.getByRole("link", { name: "Отказ" }).getAttribute("href")
    ).toBe("/dealer/inventory");
    expect(
      screen.getByRole("heading", { level: 2, name: "Основни данни" })
    ).toBeTruthy();
    expect(
      container
        .querySelector('input[name="returnContext"]')
        ?.getAttribute("value")
    ).toBe("dealer-inventory");
  });
});
