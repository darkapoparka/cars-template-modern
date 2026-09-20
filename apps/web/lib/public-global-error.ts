const mountedPrefix = /^\/variant-[23](?=\/|$)/;

import { leadSite } from "@repo/marketplace";

const _mountedPrefix = /^\/variant-[23](?=\/|$)/;

export const getPublicGlobalErrorCopy = (pathname: string) => {
  const base = pathname.match(mountedPrefix)?.[0] ?? "";
  const localPath = pathname.slice(base.length);
  const isBg = localPath === "/bg" || localPath.startsWith("/bg/");

  return {
    description: isBg
      ? `Опитайте да заредите страницата отново или се върнете в ${leadSite.name}.`
      : `Try loading the page again or return to ${leadSite.name}.`,
    home: isBg ? "Към началото" : "Go home",
    homeHref: base + (isBg ? "/bg" : "/en"),
    lang: isBg ? "bg" : "en",
    retry: isBg ? "Опитайте отново" : "Try again",
    title: isBg ? "Нещо се обърка" : "Something went wrong",
  } as const;
};
