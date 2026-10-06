/** One allowlist for the web optimizer and persisted desktop thumbnails. */
export const publicImageRemotePatterns = [
  { protocol: "https", hostname: "assets.basehub.com" },
  { protocol: "https", hostname: "images.unsplash.com" },
  { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
] as const;

// biome-ignore lint/suspicious/noControlCharactersInRegex: Reject controls and backslashes in persisted URLs.
const unsafeUrlCharacters = /[\\\u0000-\u001f\u007f]/;

export function isPublicImageSource(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 4096) {
    return false;
  }
  if (unsafeUrlCharacters.test(value)) {
    return false;
  }
  try {
    const origin = "https://modern.invalid";
    const url = new URL(value, origin);
    if (value.startsWith("/") && !value.startsWith("//")) {
      return url.origin === origin;
    }
    return (
      value.startsWith("https://") &&
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      publicImageRemotePatterns.some(({ hostname }) =>
        hostname.startsWith("*.")
          ? url.hostname.endsWith(hostname.slice(1))
          : url.hostname === hostname
      )
    );
  } catch {
    return false;
  }
}
