import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  captureException: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: mocks.captureException,
}));

import RootError from "../app/error";

const sensitiveDetailPattern = /private-provider-detail/;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("root app error boundary", () => {
  it("handles authenticated-layout failures without exposing details", () => {
    const error = new Error("DATABASE_URL=private-provider-detail");
    const reset = vi.fn();

    render(<RootError error={error} reset={reset} />);

    expect(mocks.captureException).toHaveBeenCalledWith(error);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Пространството временно не е достъпно",
      })
    ).not.toBeNull();
    expect(screen.queryByText(sensitiveDetailPattern)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Опитай отново" }));
    expect(reset).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("link", { name: "Към началото" }).getAttribute("href")
    ).toBe("/");
  });
});
