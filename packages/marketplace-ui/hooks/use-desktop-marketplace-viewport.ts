"use client";

import { useEffect, useRef, useState } from "react";

export const useDesktopMarketplaceViewport = (onLeaveDesktop?: () => void) => {
  const [isDesktop, setIsDesktop] = useState(false);
  const onLeaveDesktopRef = useRef(onLeaveDesktop);
  onLeaveDesktopRef.current = onLeaveDesktop;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const updateViewport = () => {
      if (!mediaQuery.matches) {
        onLeaveDesktopRef.current?.();
      }
      setIsDesktop(mediaQuery.matches);
    };

    setIsDesktop(mediaQuery.matches);
    mediaQuery.addEventListener("change", updateViewport);

    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  return isDesktop;
};
