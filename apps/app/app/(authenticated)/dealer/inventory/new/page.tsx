import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@repo/design-system/components/ui/alert";
import { Button } from "@repo/design-system/components/ui/button";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  WandSparklesIcon,
} from "lucide-react";
import Link from "next/link";
import { Header } from "../../../components/header";
import { SellerListingStartForm } from "../../../sell/components/seller-listing-start-form";
import { createOrResumeMinimumDraft } from "../../../sell/start-actions";

interface ListingFactoryPageProps {
  readonly searchParams: Promise<{ state?: string | string[] }>;
}

const ListingFactoryPage = async ({
  searchParams,
}: ListingFactoryPageProps) => {
  const { state } = await searchParams;
  const invalid = (Array.isArray(state) ? state[0] : state) === "invalid";

  return (
    <>
      <Header page="Създаване на обява" pages={["Дилър", "Инвентар"]}>
        <Button
          asChild
          className="mr-3 h-10 gap-2 px-2 min-[360px]:px-4"
          variant="secondary"
        >
          <Link href="/dealer/inventory">
            <ArrowLeftIcon aria-hidden="true" className="h-4 w-4" />
            <span className="sr-only min-[360px]:not-sr-only">Инвентар</span>
          </Link>
        </Button>
      </Header>
      <main className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
        <section className="rounded-lg border bg-card p-3 sm:p-4">
          <h2 className="flex items-center gap-2 font-semibold text-base">
            <WandSparklesIcon className="h-4 w-4" /> Предвидимо създаване на
            обява
          </h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Създайте надеждна чернова от данните за автомобила. Обработката на
            VIN, текста и снимките използва заменяеми локални адаптери, докато
            външните доставчици бъдат изрично активирани.
          </p>
        </section>
        {invalid ? (
          <Alert variant="destructive">
            <AlertTriangleIcon aria-hidden="true" />
            <AlertTitle>Черновата не беше създадена</AlertTitle>
            <AlertDescription>
              Проверете задължителните полета и ограниченията, показани под тях,
              след което опитайте отново.
            </AlertDescription>
          </Alert>
        ) : null}
        <SellerListingStartForm action={createOrResumeMinimumDraft} />
      </main>
    </>
  );
};

export default ListingFactoryPage;
