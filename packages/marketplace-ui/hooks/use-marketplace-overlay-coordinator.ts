"use client";

import { useEffect, useRef } from "react";

export const useMarketplaceOverlayCoordinator = (anyOverlayOpen: boolean) => {
  const modalTriggerRef = useRef<HTMLElement | null>(null);
  const wasOverlayOpenRef = useRef(false);

  useEffect(() => {
    let focusFrame: number | undefined;

    if (wasOverlayOpenRef.current && !anyOverlayOpen) {
      const trigger = modalTriggerRef.current;
      modalTriggerRef.current = null;
      focusFrame = window.requestAnimationFrame(() => {
        if (trigger?.isConnected) {
          trigger.focus({ preventScroll: true });
        }
      });
    }

    wasOverlayOpenRef.current = anyOverlayOpen;
    return () => {
      if (focusFrame !== undefined) {
        window.cancelAnimationFrame(focusFrame);
      }
    };
  }, [anyOverlayOpen]);

  return (openOverlay: () => void) => {
    modalTriggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    openOverlay();
  };
};
