"use client";

import type { MarketplaceSearchParams } from "@repo/marketplace";
import {
  localizeMarketplace,
  marketplaceMileagePresets,
  marketplaceMileageRange,
  marketplaceYearPresets,
  marketplaceYearRange,
} from "../lib/marketplace-filter-config";
import { DesktopQuickRangeDialog } from "./desktop-filter-controls";

export const DesktopFilterRailRanges = ({
  filters,
  isBg,
  labels,
  numberFormatter,
  onApply,
}: {
  filters: MarketplaceSearchParams;
  isBg: boolean;
  labels: { mileage: string; year: string };
  numberFormatter: Intl.NumberFormat;
  onApply: (filters: Partial<MarketplaceSearchParams>) => void;
}) => (
  <>
    <DesktopQuickRangeDialog
      active={Boolean(filters.yearMin || filters.yearMax)}
      className="w-full"
      description={localizeMarketplace(
        isBg,
        "Изберете начална и крайна година с плъзгане или точни стойности.",
        "Choose a minimum and maximum year by dragging or entering exact values."
      )}
      formatValue={(value) => value.toString()}
      isBg={isBg}
      label={labels.year}
      maximumLabel={localizeMarketplace(isBg, "До година", "To year")}
      maximumPrefix={localizeMarketplace(isBg, "До", "Up to")}
      minimumLabel={localizeMarketplace(isBg, "От година", "From year")}
      onApply={({ maximum, minimum }) =>
        onApply({ yearMax: maximum, yearMin: minimum })
      }
      presets={marketplaceYearPresets.map((value) => ({
        label: `${localizeMarketplace(isBg, "От", "From")} ${value}`,
        value: [value, marketplaceYearRange[1]],
      }))}
      quickSelectLabel={localizeMarketplace(
        isBg,
        "Бърз избор",
        "Quick select"
      )}
      range={marketplaceYearRange}
      selectedMaximum={filters.yearMax}
      selectedMinimum={filters.yearMin}
      step={1}
      thumbLabels={[
        localizeMarketplace(isBg, "Минимална година", "Minimum year"),
        localizeMarketplace(isBg, "Максимална година", "Maximum year"),
      ]}
      title={localizeMarketplace(isBg, "Година", "Year")}
    />
    <DesktopQuickRangeDialog
      active={Boolean(filters.mileageMax)}
      className="w-full"
      description={localizeMarketplace(
        isBg,
        "Плъзнете или въведете максималния приемлив пробег.",
        "Drag or enter the maximum acceptable mileage."
      )}
      formatValue={(value) =>
        `${numberFormatter.format(value)} ${isBg ? "км" : "km"}`
      }
      isBg={isBg}
      label={labels.mileage}
      maximumLabel={localizeMarketplace(
        isBg,
        "Максимален пробег",
        "Maximum mileage"
      )}
      maximumOnly
      maximumPrefix={localizeMarketplace(isBg, "До", "Up to")}
      minimumLabel={localizeMarketplace(isBg, "Минимум", "Minimum")}
      onApply={({ maximum }) => onApply({ mileageMax: maximum })}
      presets={marketplaceMileagePresets.map((value) => ({
        label: `${localizeMarketplace(
          isBg,
          "До",
          "To"
        )} ${numberFormatter.format(value)} ${isBg ? "км" : "km"}`,
        value: [marketplaceMileageRange[0], value],
      }))}
      quickSelectLabel={localizeMarketplace(
        isBg,
        "Бърз избор",
        "Quick select"
      )}
      range={marketplaceMileageRange}
      selectedMaximum={filters.mileageMax}
      step={5000}
      thumbLabels={[
        localizeMarketplace(isBg, "Минимален пробег", "Minimum mileage"),
        localizeMarketplace(isBg, "Максимален пробег", "Maximum mileage"),
      ]}
      title={localizeMarketplace(isBg, "Пробег", "Mileage")}
    />
  </>
);
