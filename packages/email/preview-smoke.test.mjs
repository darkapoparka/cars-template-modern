import assert from "node:assert/strict";
import test from "node:test";
import {
  getPreviewSmokeConfiguration,
  getPreviewSmokeDecision,
} from "./preview-smoke-policy.mjs";

const confirmationMissingPattern = /confirmation is missing/;
const previewTargetRequiredPattern = /target must be explicitly set to preview/;
const productionRefusedPattern =
  /Production delivery smoke targets are refused/;
const singleRecipientRequiredPattern =
  /One disposable Preview recipient is required/;

const valid = {
  AUTOMARKET_DELIVERY_SMOKE_TARGET: "preview",
  AUTOMARKET_PREVIEW_SMOKE_CONFIRM: "send-disposable-preview-email",
  AUTOMARKET_PREVIEW_SMOKE_RECIPIENT: "receipt@example.test",
  RESEND_FROM: "AutoMarket Preview <preview@example.test>",
  RESEND_TOKEN: "re_preview_token",
  VERCEL_ENV: "preview",
};

test("accepts only an explicitly confirmed disposable Preview target", () => {
  assert.deepEqual(getPreviewSmokeConfiguration(valid), {
    from: valid.RESEND_FROM,
    recipient: valid.AUTOMARKET_PREVIEW_SMOKE_RECIPIENT,
    token: valid.RESEND_TOKEN,
  });
});

test("refuses Production even when all provider values exist", () => {
  assert.throws(
    () =>
      getPreviewSmokeConfiguration({
        ...valid,
        VERCEL_ENV: "production",
      }),
    productionRefusedPattern
  );
});

test("skips only when explicit Preview provider values are absent", () => {
  assert.deepEqual(
    getPreviewSmokeDecision({
      AUTOMARKET_DELIVERY_SMOKE_TARGET: "preview",
      VERCEL_ENV: "preview",
    }),
    { reason: "preview_provider_values_absent", status: "skipped" }
  );
  assert.throws(
    () =>
      getPreviewSmokeDecision({
        ...valid,
        AUTOMARKET_DELIVERY_SMOKE_TARGET: undefined,
      }),
    previewTargetRequiredPattern
  );
});

test("refuses ambiguous recipients and missing confirmation", () => {
  assert.throws(
    () =>
      getPreviewSmokeConfiguration({
        ...valid,
        AUTOMARKET_PREVIEW_SMOKE_RECIPIENT: "one@example.test,two@example.test",
      }),
    singleRecipientRequiredPattern
  );
  assert.throws(
    () =>
      getPreviewSmokeConfiguration({
        ...valid,
        AUTOMARKET_PREVIEW_SMOKE_CONFIRM: undefined,
      }),
    confirmationMissingPattern
  );
});
