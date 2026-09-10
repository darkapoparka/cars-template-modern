import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { ArrowRightIcon, SearchIcon } from "lucide-react";
import { getPublicMarketplaceSearchHref } from "../marketplace-url";

export const Search = () => (
  <search aria-label="Търсене на автомобили" className="px-3 pb-2">
    <form action={getPublicMarketplaceSearchHref()} method="get">
      <div className="relative w-full">
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          aria-label="Търси автомобил"
          className="h-10 rounded-lg border-0 bg-control pr-11 pl-9 text-sm shadow-none transition-colors placeholder:text-muted-foreground hover:bg-control-hover/70 focus-visible:bg-card"
          name="q"
          placeholder="Търси автомобил"
          type="text"
        />
        <Button
          aria-label="Търси"
          className="absolute top-1 right-1 size-8 rounded-md bg-orange-600 text-white hover:bg-orange-700 hover:text-white"
          size="icon"
          type="submit"
          variant="ghost"
        >
          <ArrowRightIcon aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </form>
  </search>
);
