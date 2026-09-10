import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  captureException: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: mocks.captureException,
}));
vi.mock("@repo/design-system/lib/fonts", () => ({
  fonts: "font-test",
}));

import WorkspaceError from "../app/(authenticated)/error";
import WorkspaceLoading from "../app/(authenticated)/loading";
import GlobalError from "../app/global-error";

const sensitiveDetailPattern = /sensitive-provider-detail/;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("authenticated route states", () => {
  it("announces loading without exposing decorative skeletons", () => {
    const { container } = render(<WorkspaceLoading />);

    expect(screen.getByRole("main").getAttribute("aria-busy")).toBe("true");
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Зареждане на работното пространство",
      })
    ).not.toBeNull();
    expect(screen.getByRole("status").textContent).toBe(
      "Зареждаме актуалните данни. Моля, изчакайте."
    );
    expect(container.querySelector("header")?.className).toContain("sticky");
    expect(container.querySelector("header")?.className).toContain(
      "backdrop-blur-xl"
    );
    expect(
      container.querySelectorAll("main section:nth-of-type(2) > div")
    ).toHaveLength(4);
  });

  it("reports a workspace failure without rendering raw error details", () => {
    const error = new Error("DATABASE_URL=sensitive-provider-detail");
    const reset = vi.fn();

    render(<WorkspaceError error={error} reset={reset} />);

    expect(mocks.captureException).toHaveBeenCalledWith(error);
    expect(screen.queryByText(sensitiveDetailPattern)).toBeNull();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Пространството временно не е достъпно",
      })
    ).not.toBeNull();

    const retry = screen.getByRole("button", { name: "Опитай отново" });
    expect(retry.className).toContain("h-10");
    fireEvent.click(retry);
    expect(reset).toHaveBeenCalledTimes(1);

    const home = screen.getByRole("link", { name: "Към началото" });
    expect(home.getAttribute("href")).toBe("/");
    expect(home.className).toContain("h-10");
  });

  it("keeps the root fallback localized, actionable, and detail-free", () => {
    const error = new Error("CLERK_SECRET_KEY=sensitive-provider-detail");
    const markup = renderToStaticMarkup(
      <GlobalError error={error} reset={vi.fn()} />
    );

    expect(markup).toContain('lang="bg"');
    expect(markup).toContain("Възникна неочаквана грешка");
    expect(markup).toContain("Опитай отново");
    expect(markup).toContain('href="/"');
    expect(markup).not.toContain("sensitive-provider-detail");
  });
});
