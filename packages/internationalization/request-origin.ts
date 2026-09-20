/** Next normalizes a loopback IP to localhost in development request URLs.
 * Restore only the exact incoming loopback authority, never arbitrary forwarded hosts.
 * Origin validation itself stays strict and is still performed by the portable policy.
 */
export function preferenceRequestOrigin(request: Request): Request {
  const url = new URL(request.url);
  if (
    url.hostname !== "localhost" ||
    !url.port ||
    request.headers.get("host") !== `127.0.0.1:${url.port}`
  ) {
    return request;
  }
  url.hostname = "127.0.0.1";
  return new Request(url, request);
}
