"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { mobileMarketplaceOverlayPrimaryActionClassName } from "@repo/marketplace-ui/lib/mobile-overlay-styles";
import { ChevronRight } from "lucide-react";
import { mobileSellVehicleCopy } from "./mobile-sell-vehicle-policy";
import { MobileServiceHelpDrawer } from "./mobile-service-help-drawer";

export const MobileSellHowItWorksDrawer = ({
  locale,
  onOpenChange,
  onStart,
  open,
  onAfterClose,
  onRestoreFocus,
}: {
  locale: "bg" | "en";
  onOpenChange: (open: boolean) => void;
  onStart: () => void;
  open: boolean;
  onAfterClose: () => void;
  onRestoreFocus: () => void;
}) => {
  const content = mobileSellVehicleCopy[locale];

  return (
    <MobileServiceHelpDrawer
      description={content.howDescription}
      footer={
        <Button
          className={mobileMarketplaceOverlayPrimaryActionClassName}
          onClick={onStart}
          type="button"
        >
          {content.howStart}
          <ChevronRight aria-hidden="true" className="size-4" />
        </Button>
      }
      locale={locale}
      onAfterClose={onAfterClose}
      onOpenChange={onOpenChange}
      onRestoreFocus={onRestoreFocus}
      open={open}
      steps={content.howSteps}
      title={content.howTitle}
    />
  );
};
