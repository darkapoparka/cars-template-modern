"use client";

import { publicFonts } from "@repo/design-system/lib/public-fonts";
import { usePathname } from "next/navigation";
import { PublicErrorState } from "@/components/public-error-state";
import { getPublicGlobalErrorCopy } from "@/lib/public-global-error";

interface GlobalErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

const GlobalError = ({ error, reset }: GlobalErrorProps) => {
  const copy = getPublicGlobalErrorCopy(usePathname());

  return (
    <html className={publicFonts} lang={copy.lang}>
      <body>
        <PublicErrorState error={error} reset={reset} />
      </body>
    </html>
  );
};

export default GlobalError;
