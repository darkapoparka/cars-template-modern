import { cn } from "@repo/design-system/lib/utils";
import { Geist_Mono, Inter } from "next/font/google";
import localFont from "next/font/local";

const desktop = localFont({
  src: "../public/desktop-boxcars/dm-sans.woff2",
  display: "swap",
  variable: "--font-desktop",
  weight: "100 1000",
  preload: false,
  adjustFontFallback: false,
});

const inter = Inter({
  display: "swap",
  subsets: ["cyrillic", "latin"],
  variable: "--font-inter",
});

const geistMono = Geist_Mono({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const fonts = cn(
  inter.className,
  inter.variable,
  desktop.variable,
  geistMono.variable,
  "touch-manipulation font-sans antialiased"
);
