// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SellerListingStartForm } from "../app/(authenticated)/sell/components/seller-listing-start-form";

afterEach(cleanup);

describe("seller listing start form", () => {
  it("asks for minimum identification before the photo step", () => {
    render(
      <SellerListingStartForm
        action={vi.fn(async (_formData: FormData) => undefined)}
        defaults={{
          category: "car",
          make: "Volvo",
          model: "XC60",
          year: 2022,
        }}
      />
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Кой автомобил продавате?",
      })
    ).toBeTruthy();
    expect(screen.getByLabelText("Начин на идентификация")).toBeTruthy();
    expect(screen.getByLabelText("Категория")).toBeTruthy();
    expect(screen.getByLabelText("Марка")).toBeTruthy();
    expect(screen.getByLabelText("Модел")).toBeTruthy();
    expect(screen.getByLabelText("Година")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Запази и добави снимки/ })
    ).toBeTruthy();
    expect(screen.queryByLabelText("Цена")).toBeNull();
    expect(screen.queryByLabelText("Пробег")).toBeNull();
  });
});
