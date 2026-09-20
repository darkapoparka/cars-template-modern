import { withBasePath } from "@repo/internationalization/paths";
import Image from "next/image";
import type { ComponentProps } from "react";
/** Native Next Image with mount-aware local assets; external/static imports are unchanged. */
export default function PublicImage({
  src,
  ...props
}: ComponentProps<typeof Image>) {
  return (
    <Image {...props} src={typeof src === "string" ? withBasePath(src) : src} />
  );
}
