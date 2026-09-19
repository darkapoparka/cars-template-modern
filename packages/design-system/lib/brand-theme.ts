import type { CSSProperties } from "react";

const hexColorPattern = /^#[0-9a-f]{6}$/i;
const channelToLinear = (value: number) =>
  value <= 0.040_45 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
const channels = (color: string) =>
  [1, 3, 5].map(
    (offset) => Number.parseInt(color.slice(offset, offset + 2), 16) / 255
  );
const luminance = (color: string) =>
  channels(color).reduce(
    (sum, value, index) =>
      sum + channelToLinear(value) * [0.2126, 0.7152, 0.0722][index],
    0
  );
export const brandContrastRatio = (first: string, second: string): number => {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
};
const darken = (color: string, factor = 0.82) =>
  `#${channels(color)
    .map((channel) =>
      Math.round(channel * 255 * factor)
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}`;

const readableForeground = (color: string) => {
  const whiteContrast = brandContrastRatio(color, "#ffffff");
  const darkContrast = brandContrastRatio(color, "#09090b");
  // Around mid-gray neither off-black nor white can reach 4.5:1.
  // Pure black closes that narrow gap without changing the default brand.
  if (Math.max(whiteContrast, darkContrast) < 4.5) {
    return "#000000";
  }
  return whiteContrast >= darkContrast ? "#ffffff" : "#09090b";
};

/** Public CSS values are validated, and bright brands receive readable control/text pairs. */
export const createBrandTheme = (
  accent: string
): CSSProperties & Record<`--${string}`, string> => {
  if (!hexColorPattern.test(accent)) {
    throw new Error("Brand accent must be a six-digit hexadecimal color");
  }
  const foreground = readableForeground(accent);
  let text = accent;
  while (brandContrastRatio(text, "#ffffff") < 4.5) {
    text = darken(text);
  }
  return {
    "--brand": accent,
    "--brand-foreground": foreground,
    "--brand-text": text,
    "--brand-hover-foreground": readableForeground(darken(accent)),
    "--brand-active-foreground": readableForeground(darken(accent, 0.68)),
  };
};
