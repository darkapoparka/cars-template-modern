import { describe, expect, it } from "vitest";
import {
  getDealerLeadIntentLabel,
  getDealerLeadStatusLabel,
} from "../app/(authenticated)/dealer/leads/dealer-lead-labels";

describe("dealer lead labels", () => {
  it.each([
    ["new", "Ново"],
    ["viewed", "Прегледано"],
    ["contacted", "Осъществен контакт"],
    ["qualified", "Квалифицирано"],
    ["won", "Спечелено"],
    ["lost", "Загубено"],
    ["closed", "Затворено"],
    ["spam", "Спам"],
  ])("localizes the %s status", (value, label) => {
    expect(getDealerLeadStatusLabel(value)).toBe(label);
  });

  it.each([
    ["availability", "Наличност"],
    ["finance", "Финансиране"],
    ["test_drive", "Тестово шофиране"],
    ["trade_in", "Замяна"],
    ["general", "Общо запитване"],
  ])("localizes the %s intent", (value, label) => {
    expect(getDealerLeadIntentLabel(value)).toBe(label);
  });

  it("returns an unknown stored value unchanged", () => {
    expect(getDealerLeadStatusLabel("future_status")).toBe("future_status");
    expect(getDealerLeadIntentLabel("future_intent")).toBe("future_intent");
  });
});
