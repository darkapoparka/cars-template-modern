import type { ReactNode } from "react";
import { requireDealerOrganizationActor } from "./actor";

interface DealerLayoutProperties {
  readonly children: ReactNode;
}

const DealerLayout = async ({ children }: DealerLayoutProperties) => {
  await requireDealerOrganizationActor();

  return children;
};

export default DealerLayout;
