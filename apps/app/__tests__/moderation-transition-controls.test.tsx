import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transition: vi.fn(),
  useFormStatus: vi.fn(),
}));

vi.mock("react-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-dom")>()),
  useFormStatus: mocks.useFormStatus,
}));
vi.mock("../app/(authenticated)/admin/moderation/actions", () => ({
  transitionModerationReportAction: mocks.transition,
}));

import { ModerationTransitionControls } from "../app/(authenticated)/admin/moderation/moderation-transition-controls";

afterEach(cleanup);

describe("moderation terminal confirmation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useFormStatus.mockReturnValue({
      action: null,
      data: null,
      method: null,
      pending: false,
    });
  });

  test("requires a localized resolution reason inside an alert dialog", () => {
    render(
      <ModerationTransitionControls
        reportId="report_123456"
        status="reviewing"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Отхвърли сигнала" }));

    const dialog = screen.getByRole("alertdialog");
    expect(
      within(dialog).getByRole("heading", {
        name: "Отхвърли сигнала?",
      })
    ).toBeTruthy();
    expect(
      within(dialog).getByRole("combobox", { name: "Причина за решението" })
    ).toBeTruthy();
    expect(
      (
        within(dialog).getByRole("button", {
          name: "Потвърди отхвърлянето",
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);
  });

  test("locks transition controls while a server action is pending", () => {
    mocks.useFormStatus.mockReturnValue({
      action: null,
      data: null,
      method: null,
      pending: true,
    });
    render(
      <ModerationTransitionControls reportId="report_123456" status="new" />
    );

    expect(
      (
        screen.getByRole("button", {
          name: "Записва се…",
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);

    fireEvent.click(
      screen.getByRole("button", { name: "Маркирай като решен" })
    );
    const dialog = screen.getByRole("alertdialog");
    expect(
      (
        within(dialog).getByRole("button", {
          name: "Отказ",
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);
    expect(
      (
        within(dialog).getByRole("button", {
          name: "Записва се…",
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);
  });
});
