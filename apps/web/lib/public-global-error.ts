import { leadSite } from "@repo/marketplace";

export const getPublicGlobalErrorCopy = (pathname: string) => {
  const isBg = pathname === "/bg" || pathname.startsWith("/bg/");

  return {
    description: isBg
      ? `Опитайте да заредите страницата отново или се върнете в ${leadSite.name}.`
      : `Try loading the page again or return to ${leadSite.name}.`,
    home: isBg ? "Към началото" : "Go home",
    homeHref: isBg ? "/bg" : "/",
    lang: isBg ? "bg" : "en",
    retry: isBg ? "Опитайте отново" : "Try again",
    title: isBg ? "Нещо се обърка" : "Something went wrong",
  } as const;
};
