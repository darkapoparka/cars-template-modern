import { randomUUID } from "node:crypto";
import { log } from "@repo/observability/log";
import { NextResponse } from "next/server";
import {
  assistedSearchRequestSchema,
  parseAssistedSearch,
} from "../../../../lib/assisted-search";

export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 4096;

export const POST = async (request: Request) => {
  const requestId = randomUUID();
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_REQUEST_BYTES) {
    return NextResponse.json(
      { message: "Search request is too large", requestId },
      { status: 413 }
    );
  }

  try {
    const json: unknown = await request.json();
    const input = assistedSearchRequestSchema.parse(json);
    const result = parseAssistedSearch(input);
    log.info("ai.assisted_search.parsed", {
      ambiguityCount: result.ambiguities.length,
      chipCount: result.chips.length,
      mode: result.mode,
      promptVersion: result.promptVersion,
      requestId,
    });
    return NextResponse.json({ ...result, requestId });
  } catch {
    log.info("ai.assisted_search.rejected", { requestId });
    return NextResponse.json(
      {
        message: "Use 2 to 500 characters and valid marketplace context.",
        requestId,
      },
      { status: 400 }
    );
  }
};
