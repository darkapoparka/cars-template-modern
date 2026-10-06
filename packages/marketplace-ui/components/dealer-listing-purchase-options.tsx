"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/design-system/components/ui/tabs";
import type { ReactNode } from "react";
import styles from "./listing-detail-desktop.module.css";

/** Keep the price and financing copy server-rendered; only the selection is interactive. */
export function DealerListingPurchaseOptions({
  finance,
  locale,
  purchase,
}: {
  finance: ReactNode;
  locale?: string;
  purchase: ReactNode;
}) {
  const isBg = locale?.startsWith("bg");
  return (
    <Tabs
      className={styles.purchaseOptions}
      data-slot="listing-purchase-options"
      defaultValue="purchase"
    >
      <TabsList
        aria-label={isBg ? "Начин на покупка" : "Purchase options"}
        className={styles.purchaseTabList}
      >
        <TabsTrigger className={styles.purchaseTab} value="purchase">
          {isBg ? "Покупка" : "Buy"}
        </TabsTrigger>
        <TabsTrigger className={styles.purchaseTab} value="finance">
          {isBg ? "Финансиране" : "Finance"}
        </TabsTrigger>
      </TabsList>
      <TabsContent className={styles.purchasePanel} value="purchase">
        {purchase}
      </TabsContent>
      <TabsContent className={styles.purchasePanel} value="finance">
        {finance}
      </TabsContent>
    </Tabs>
  );
}
