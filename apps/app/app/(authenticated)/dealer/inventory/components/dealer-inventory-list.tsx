import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/design-system/components/ui/empty";
import { type DealerInventoryRow, formatMoney } from "@repo/marketplace";
import { formatVehicleLocation } from "@repo/marketplace-ui";
import { CarFrontIcon, EyeIcon, PencilIcon } from "lucide-react";
import Link from "next/link";
import { getListingEditHref } from "../../../sell/listing-return-context";

interface DealerInventoryListProps {
  readonly inventory: readonly DealerInventoryRow[];
  readonly webBaseUrl: string;
}

const getListingStatusTone = (
  status: DealerInventoryRow["status"]
): "destructive" | "secondary" | "success" | "warning" => {
  if (status === "active") {
    return "success";
  }

  if (status === "pending_review") {
    return "warning";
  }

  return status === "rejected" ? "destructive" : "secondary";
};

const listingStatusLabels: Record<DealerInventoryRow["status"], string> = {
  active: "Активна",
  archived: "Архивирана",
  draft: "Чернова",
  expired: "Изтекла",
  paused: "На пауза",
  pending_review: "Чака преглед",
  rejected: "Отхвърлена",
  sold: "Продадена",
};

export const DealerInventoryList = ({
  inventory,
  webBaseUrl,
}: DealerInventoryListProps) => (
  <section
    aria-labelledby="inventory-list-heading"
    className="overflow-hidden rounded-lg border bg-card"
  >
    <div className="flex items-start justify-between gap-3 p-4">
      <div>
        <h2 className="font-semibold text-sm" id="inventory-list-heading">
          Дилърски инвентар
        </h2>
        <p className="mt-1 text-muted-foreground text-sm">
          Ръчно добавени и импортирани автомобили на тази организация.
        </p>
      </div>
      <Badge variant="secondary">
        {inventory.length} {inventory.length === 1 ? "автомобил" : "автомобила"}
      </Badge>
    </div>

    {inventory.length === 0 ? (
      <Empty className="rounded-none border-x-0 border-b-0 py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CarFrontIcon />
          </EmptyMedia>
          <EmptyTitle>Все още няма автомобили</EmptyTitle>
          <EmptyDescription>
            Създайте чернова от „Създаване на обява“ или изчакайте конфигуриран
            източник на инвентар да завърши синхронизирането.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    ) : (
      <div className="divide-y border-t">
        {inventory.map((listing) => (
          <article className="p-4" key={listing.id}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-sm">{listing.title}</h3>
                  <Badge variant={getListingStatusTone(listing.status)}>
                    {listingStatusLabels[listing.status]}
                  </Badge>
                  {listing.sourceManaged && (
                    <Badge variant="secondary">Управлява се от източник</Badge>
                  )}
                </div>
                <p className="mt-1 text-muted-foreground text-sm">
                  {formatMoney(listing.price, "bg")} ·{" "}
                  {formatVehicleLocation(listing.location, "bg")} ·{" "}
                  {listing.leadCount}{" "}
                  {listing.leadCount === 1 ? "запитване" : "запитвания"}
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[360px]:flex-row">
                {listing.status === "active" && (
                  <Button
                    asChild
                    className="flex-1 gap-2 sm:flex-none"
                    size="lg"
                    variant="secondary"
                  >
                    <Link href={`${webBaseUrl}/bg/listing/${listing.slug}`}>
                      <EyeIcon />
                      Преглед
                    </Link>
                  </Button>
                )}
                {!listing.sourceManaged && (
                  <Button
                    asChild
                    className="flex-1 gap-2 sm:flex-none"
                    size="lg"
                  >
                    <Link
                      href={getListingEditHref(listing.id, "dealer-inventory")}
                    >
                      <PencilIcon />
                      Редактиране
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    )}
  </section>
);
