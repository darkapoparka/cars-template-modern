import { ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { env } from "@/env";

interface AuthLayoutProps {
  readonly children: ReactNode;
}

const getMarketplaceHref = (): string => {
  try {
    return new URL("/bg", env.NEXT_PUBLIC_WEB_URL).toString();
  } catch {
    return "http://localhost:3001/bg";
  }
};

const AutoMarketMark = () => (
  <svg
    aria-hidden="true"
    className="h-8 w-9 shrink-0 text-orange-600"
    viewBox="0 0 40 36"
  >
    <path
      d="M1.5 34 15.2 3.2A3.5 3.5 0 0 1 18.4 1h4.7a3.5 3.5 0 0 1 3.2 2.2L39 34H28.3l-3.2-8H14.5l-3.2 8H1.5Z"
      fill="currentColor"
    />
    <path className="fill-card" d="m19.8 11.2-3.6 9h7.2l-3.6-9Z" />
  </svg>
);

const AuthLayout = ({ children }: AuthLayoutProps) => {
  const marketplaceHref = getMarketplaceHref();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-border/70 border-b bg-card">
        <div className="mx-auto flex h-16 w-full max-w-[90rem] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            aria-label="AutoMarket — към началната страница"
            className="flex items-center gap-2 rounded-md font-semibold text-lg tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            href={marketplaceHref}
          >
            <AutoMarketMark />
            <span>AutoMarket</span>
          </Link>

          <Link
            className="inline-flex h-10 items-center gap-2 rounded-full bg-control px-4 font-semibold text-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            href={marketplaceHref}
          >
            <span className="hidden sm:inline">Към обявите</span>
            <span className="sm:hidden">Обяви</span>
            <ArrowUpRightIcon aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-[90rem] items-center justify-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="w-full max-w-[28rem] rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border/70 sm:p-7">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AuthLayout;
