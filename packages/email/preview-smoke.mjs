import { createHash, randomUUID } from "node:crypto";
import { Resend } from "resend";
import { getPreviewSmokeDecision } from "./preview-smoke-policy.mjs";

const decision = getPreviewSmokeDecision(process.env);
if (decision.status === "skipped") {
  console.log(JSON.stringify(decision));
  process.exit(0);
}

const configuration = decision.configuration;
const resend = new Resend(configuration.token);
const runId = randomUUID();
const idempotencyKey = `automarket-preview-delivery-${runId}`;
const payload = {
  from: configuration.from,
  subject: `AutoMarket Preview delivery proof ${runId}`,
  text: [
    "Disposable AutoMarket Preview delivery proof.",
    `Run: ${runId}`,
    "No customer or listing data is included.",
  ].join("\n"),
  to: configuration.recipient,
};

const withTimeout = async (operation, milliseconds = 5000) => {
  let timer;
  try {
    return await Promise.race([
      operation,
      new Promise((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error("Preview provider request timed out")),
          milliseconds
        );
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
};

const send = async () => {
  const result = await withTimeout(
    resend.emails.send(payload, { idempotencyKey })
  );
  if (result.error) {
    throw new Error(`Preview provider rejected send: ${result.error.name}`);
  }
  return result.data.id;
};

const firstReceiptId = await send();
const replayReceiptId = await send();
if (firstReceiptId !== replayReceiptId) {
  throw new Error("Provider idempotency proof returned different receipts");
}

const receipt = await withTimeout(resend.emails.get(firstReceiptId));
if (receipt.error) {
  throw new Error(`Preview receipt lookup failed: ${receipt.error.name}`);
}

const recipientHash = createHash("sha256")
  .update(configuration.recipient.toLowerCase())
  .digest("hex")
  .slice(0, 16);

console.log(
  JSON.stringify({
    duplicateSafe: true,
    provider: "resend",
    providerReceiptId: firstReceiptId,
    recipientHash,
    runId,
    state: "sent",
  })
);
