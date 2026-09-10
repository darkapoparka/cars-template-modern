import { createElement } from "react";
import { hugeiconsControls } from "../lib/icons/hugeicons-controls";
import { hugeiconsHeader } from "../lib/icons/hugeicons-header";
import { hugeiconsNavigation } from "../lib/icons/hugeicons-navigation";

const icons = {
  ...hugeiconsHeader,
  ...hugeiconsNavigation,
  ...hugeiconsControls,
};
export function DealerUiIcon({
  name,
  className = "size-5 shrink-0",
}: {
  readonly name: keyof typeof icons;
  readonly className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      data-icon-family="hugeicons-stroke-rounded"
      fill="none"
      focusable="false"
      viewBox="0 0 24 24"
    >
      {icons[name].map(([tag, attributes]) => createElement(tag, attributes))}
    </svg>
  );
}
