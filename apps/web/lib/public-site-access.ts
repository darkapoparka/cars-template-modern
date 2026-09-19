import "server-only";
import {
  isPublicSitePathEnabled,
  publicSite,
} from "@repo/marketplace/site-config";
import { notFound } from "next/navigation";

/** Presentation capabilities are not authentication; guard public routes as well as navigation. */
export const requirePublicSitePath = (pathname: string): void => {
  if (!isPublicSitePathEnabled(pathname, publicSite)) {
    notFound();
  }
};
