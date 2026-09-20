import { preferenceRequestOrigin } from "@repo/internationalization/request-origin";
import { localePolicy } from "@/lib/locale-preferences";
export const dynamic = "force-dynamic";
export const POST = (request: Request) =>
  localePolicy.preferenceResponse(preferenceRequestOrigin(request));
export const GET = POST;
export const PUT = POST;
export const DELETE = POST;
export const PATCH = POST;
export const OPTIONS = POST;
