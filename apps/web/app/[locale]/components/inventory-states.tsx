"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { withBasePath } from "@repo/internationalization/paths";
import { leadSite } from "@repo/marketplace";
import { isDealershipSite } from "@repo/marketplace/site-config";
import { Phone, RefreshCcw, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface InventoryUnavailableProps {
  locale: string;
}

export const InventoryUnavailable = ({ locale }: InventoryUnavailableProps) => {
  const router = useRouter();
  const isBg = locale.toLowerCase().startsWith("bg");

  return (
    <main
      aria-live="assertive"
      className="grid min-h-[60dvh] place-items-center bg-background px-4 py-16 text-center"
      data-slot="inventory-unavailable"
      role="alert"
    >
      <div className="max-w-md rounded-xl border border-border bg-card p-6">
        <h1 className="font-semibold text-xl">
          {isBg
            ? "Обявите временно не са достъпни"
            : "Listings are temporarily unavailable"}
        </h1>
        <p className="mt-2 text-muted-foreground text-sm leading-6">
          {isBg
            ? "Не можем да заредим актуалните данни от пазара. Опитайте отново след малко."
            : "We could not load current marketplace data. Please try again shortly."}
        </p>
        <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
          <Button onClick={() => router.refresh()} type="button">
            <RefreshCcw aria-hidden="true" className="size-4" />
            {isBg ? "Опитайте отново" : "Try again"}
          </Button>
          <Button asChild variant="secondary">
            <Link href={isBg ? "/bg" : "/en"}>
              <Search aria-hidden="true" className="size-4" />
              {isBg ? "Към обявите" : "Browse listings"}
            </Link>
          </Button>
          {isDealershipSite ? (
            <Button asChild variant="outline">
              <a href={withBasePath(leadSite.phoneHref)}>
                <Phone aria-hidden="true" className="size-4" />
                {isBg ? "Обадете се" : "Call the dealership"}
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </main>
  );
};
