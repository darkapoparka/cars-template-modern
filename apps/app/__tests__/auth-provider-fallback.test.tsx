import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthProviderLoading } from "../app/(unauthenticated)/auth-provider-loading";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("auth provider loading fallback", () => {
  it("offers an explicit recovery action when the provider stalls", () => {
    vi.useFakeTimers();
    render(<AuthProviderLoading title="Вход" />);

    expect(
      screen.queryByRole("button", { name: "Опитайте отново" })
    ).toBeNull();

    act(() => vi.advanceTimersByTime(10_000));

    expect(
      screen.getByText(
        "Доставчикът за идентификация отговаря по-бавно от очакваното."
      )
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Опитайте отново" })
    ).toBeTruthy();
  });
});
