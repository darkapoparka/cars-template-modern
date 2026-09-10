"use client";

import { getMobileQuickPillClassName } from "@repo/marketplace-ui";

interface MobileDealerQuickAction {
  label: string;
  target: string;
}

export const MobileDealerQuickActions = ({
  ariaLabel,
  items,
}: {
  ariaLabel: string;
  items: readonly MobileDealerQuickAction[];
}) => {
  const activate = (targetSelector: string) => {
    const target = document.querySelector<HTMLElement>(targetSelector);
    if (!target) {
      return;
    }

    target.scrollIntoView({ behavior: "smooth", block: "center" });

    if (target instanceof HTMLButtonElement) {
      target.click();
      return;
    }

    target.focus({ preventScroll: true });
    if (target instanceof HTMLSelectElement) {
      try {
        target.showPicker?.();
      } catch {
        // Focus remains a useful fallback where showPicker is unsupported.
      }
    }
  };

  return (
    <nav
      aria-label={ariaLabel}
      className="bg-white px-3 py-2 sm:px-4 lg:hidden"
    >
      <div className="no-scrollbar flex gap-2 overflow-x-auto overscroll-x-contain">
        {items.map((item) => (
          <button
            className={getMobileQuickPillClassName(false, "px-4")}
            key={item.target}
            onClick={() => activate(item.target)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
};
