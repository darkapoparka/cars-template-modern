import { cn } from "@repo/design-system/lib/utils";
import { Geist_Mono, Inter } from "next/font/google";

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
  geistMono.variable,
  "touch-manipulation font-sans antialiased"
);
