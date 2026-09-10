"use client";

import type { ListingViewMode } from "@repo/marketplace";
import { useEffect, useRef, useState } from "react";

const listingViewPreferenceKey = "automarket:listing-view-mode";

export const useMarketplaceListingViewMode = (defaultViewMode: ListingViewMode) => {
  const [viewMode, setViewMode] = useState<ListingViewMode>(defaultViewMode);

  useEffect(() => {
    const storedPreference = window.localStorage.getItem(listingViewPreferenceKey);
    if (storedPreference === "grid" || storedPreference === "list") {
      setViewMode(storedPreference);
    }
  }, []);

  const changeViewMode = (nextViewMode: ListingViewMode) => {
    setViewMode(nextViewMode);
    window.localStorage.setItem(listingViewPreferenceKey, nextViewMode);
  };

  return [viewMode, changeViewMode] as const;
};

export const useMobileCompactMarketplaceHeader = () => {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) {
        return;
      }
      setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return [visible, sentinelRef] as const;
};
