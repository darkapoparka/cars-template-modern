import { expect, it, vi } from "vitest";
import { buildFinancingContactMessage } from "../app/[locale]/components/mobile-financing-policy";
import { toFinancingContactFormData } from "./financing-contact-payload";
import { submitPublicSupportRequest } from "./public-support-submission";

const context = { correlationId: "finance_contract", ipKey: "synthetic", sameOrigin: true };
const dependencies = () => ({ available: false, deliver: vi.fn(), rateLimit: vi.fn(), report: vi.fn() });
const financingForm = () => {
  const data = new FormData();
  const request = { vehicle: "Synthetic vehicle", term: "36", deposit: "20" };
  for (const [key, value] of Object.entries({
    locale: "en", company: "", topic: "buyer", website: "",
    name: "Synthetic Buyer", phone: "+359000000000", email: "",
    term: request.term, deposit: request.deposit, note: "Call after work",
    message: buildFinancingContactMessage({ locale: "en", request, deposit: request.deposit, note: "Call after work" }),
  })) data.append(key, value);
  return data;
};

it("financing form reaches delivery readiness instead of being rejected as an invalid payload", async () => {
  const deps = dependencies();
  const result = await submitPublicSupportRequest(toFinancingContactFormData(financingForm()), context, deps);
  expect(result.status).toBe("unavailable");
  expect(deps.deliver).not.toHaveBeenCalled();
});
