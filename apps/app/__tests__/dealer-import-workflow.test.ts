import { describe, expect, test } from "vitest";
import { getImportSessionStatusView } from "../app/(authenticated)/dealer/inventory/components/import-session-list";

const now = new Date("2026-07-13T12:00:00.000Z");
const future = "2026-07-13T13:00:00.000Z";

describe("dealer CSV import truth", () => {
  test.each([
    ["created", "Създадена"],
    ["uploaded", "Качена"],
    ["applied", "Приложена"],
    ["applied_with_issues", "Приложена с проблеми"],
    ["cancelled", "Отменена"],
    ["expired", "Изтекла"],
  ])("localizes the %s terminal or transition state", (status, label) => {
    expect(
      getImportSessionStatusView({ expiresAt: future, status }, now).label
    ).toBe(label);
  });

  test("keeps scanner, mapping, preview, and apply states distinct", () => {
    expect(
      getImportSessionStatusView(
        { expiresAt: future, status: "scan_pending" },
        now
      )
    ).toMatchObject({ label: "Очаква сканиране", tone: "info" });
    expect(
      getImportSessionStatusView(
        { expiresAt: future, status: "mapping_required" },
        now
      )
    ).toMatchObject({ label: "Нужно е съпоставяне", tone: "warning" });
    expect(
      getImportSessionStatusView(
        { expiresAt: future, status: "previewing" },
        now
      )
    ).toMatchObject({ label: "Очаква преглед", tone: "info" });
    expect(
      getImportSessionStatusView({ expiresAt: future, status: "ready" }, now)
    ).toMatchObject({ label: "Готова за одобрение", tone: "success" });
    expect(
      getImportSessionStatusView(
        { expiresAt: future, status: "apply_queued" },
        now
      )
    ).toMatchObject({ label: "Прилага се", tone: "info" });
  });

  test("does not present an expired unfinished session as actionable", () => {
    const view = getImportSessionStatusView(
      { expiresAt: "2026-07-13T12:00:00.000Z", status: "ready" },
      now
    );
    expect(view).toMatchObject({ label: "Изтекла", tone: "destructive" });
    expect(view.detail).toContain("валидност");
  });

  test("states last-good preservation for failed imports", () => {
    const view = getImportSessionStatusView(
      { expiresAt: future, status: "failed" },
      now
    );
    expect(view.label).toBe("Неуспешна");
    expect(view.detail).toContain("последният надежден инвентар");
  });
});
