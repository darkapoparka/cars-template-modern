"use client";

import { usePathname } from "next/navigation";
import { PublicErrorState } from "@/components/public-error-state";
import { fonts } from "@/lib/fonts";
import { getPublicGlobalErrorCopy } from "@/lib/public-global-error";

interface GlobalErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

const GlobalError = ({ error, reset }: GlobalErrorProps) => {
  const copy = getPublicGlobalErrorCopy(usePathname());

  return (
    <html className={fonts} lang={copy.lang}>
      <body>
        <PublicErrorState error={error} reset={reset} />
      </body>
    </html>
  );
};

export default GlobalError;
