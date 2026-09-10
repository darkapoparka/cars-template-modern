import { listOrganizationInventorySources } from "@repo/database/inventory-sources";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@repo/design-system/components/ui/alert";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { FileLock2Icon, ShieldAlertIcon, UploadIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireDealerOrganizationActor } from "../../../actor";
import { dealerProviderReadiness } from "../../../provider-adapters";
import { ImporterPageHeader } from "../../components/importer-page-header";

export const metadata: Metadata = {
  title: "Качване на CSV инвентар",
  description: "Настройка за надежден частен CSV импорт.",
};

const NewInventoryImportPage = async ({
  searchParams,
}: {
  readonly searchParams: Promise<{ source?: string }>;
}) => {
  const [actor, params] = await Promise.all([
    requireDealerOrganizationActor(["owner", "manager", "sales"]),
    searchParams,
  ]);
  const sources = (
    await listOrganizationInventorySources(actor.dealerOrgId)
  ).filter(
    (source) =>
      source.kind === "csv" && ["active", "degraded"].includes(source.status)
  );
  const selected =
    sources.find((source) => source.id === params.source) ?? sources[0];
  const storageConfigured =
    dealerProviderReadiness.privateStorage === "configured";

  return (
    <>
      <ImporterPageHeader page="Качване на CSV" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-semibold text-lg">
              Качване на частен инвентар
            </h1>
            <p className="mt-1 text-muted-foreground text-sm">
              CSV файловете никога не стават публични медийни файлове. Приетият
              файл се обвързва с хеш, сканира се, съпоставя се, преглежда се и
              се одобрява изрично.
            </p>
          </div>
          <Badge variant={storageConfigured ? "success" : "destructive"}>
            Хранилище: {dealerProviderReadiness.privateStorage}
          </Badge>
        </div>
        {storageConfigured ? null : (
          <Alert variant="destructive">
            <ShieldAlertIcon />
            <AlertTitle>Частното хранилище не е конфигурирано</AlertTitle>
            <AlertDescription>
              Няма да бъде отчетен успешен резултат за сесия, файл, съпоставяне,
              преглед или прилагане. Конфигурирайте оторизиран частен доставчик,
              преди да използвате този процес.
            </AlertDescription>
          </Alert>
        )}
        <section className="rounded-lg border bg-card">
          <div className="border-b p-4">
            <div className="flex items-center gap-2">
              <FileLock2Icon className="size-4" />
              <h2 className="font-semibold text-sm">
                1. Изберете източник и файл
              </h2>
            </div>
            <p className="mt-1 text-muted-foreground text-sm">
              Максимум 10 MiB и 10 000 реда. Контролната сума от браузъра трябва
              да съвпада точно с обекта при доставчика.
            </p>
          </div>
          <div className="grid gap-4 p-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="importSource">CSV източник</Label>
              <select
                className="h-9 w-full rounded-md border bg-control px-3 text-sm"
                defaultValue={selected?.id}
                disabled={!storageConfigured || sources.length === 0}
                id="importSource"
              >
                {sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name} · {source.syncMode.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
              {sources.length === 0 ? (
                <p className="text-destructive text-xs">
                  Първо създайте и активирайте CSV източник.
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="csvFile">CSV файл</Label>
              <Input
                accept=".csv,text/csv,text/plain"
                disabled={!(storageConfigured && selected)}
                id="csvFile"
                type="file"
              />
            </div>
            <label className="flex items-start gap-2 rounded-md bg-control/55 p-3 text-sm">
              <input disabled={!storageConfigured} type="checkbox" />
              <span>
                <strong>Пълна снимка на инвентара</strong>
                <span className="mt-0.5 block text-muted-foreground text-xs">
                  Липсващи автомобили могат да се съгласуват само след успешно
                  завършване и изрично одобрение.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2 rounded-md bg-control/55 p-3 text-sm">
              <input disabled={!storageConfigured} type="checkbox" />
              <span>
                <strong>Разбирам, че карантината не означава успех</strong>
                <span className="mt-0.5 block text-muted-foreground text-xs">
                  Редовете с блокиращи проблеми се задържат и не могат да бъдат
                  публикувани без предупреждение.
                </span>
              </span>
            </label>
            <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
              <Button asChild variant="outline">
                <Link href="/dealer/inventory/sources">
                  Назад към източниците
                </Link>
              </Button>
              <Button disabled>
                <UploadIcon />
                Разрешаване на частно качване
              </Button>
            </div>
          </div>
        </section>
        <section className="grid gap-3 sm:grid-cols-4">
          {[
            [
              "2",
              "Сканиране",
              "Под карантина до получаване на подписан резултат от скенера",
            ],
            [
              "3",
              "Съпоставяне",
              "Канонични полета и стриктни ISO времеви стойности",
            ],
            [
              "4",
              "Преглед",
              "Въздействие, изчислено от надежден източник, а не от клиентски стойности",
            ],
            [
              "5",
              "Одобрение",
              "Повторна проверка на роля, версия, срок и заключване на източника",
            ],
          ].map(([step, title, detail]) => (
            <div className="rounded-lg border bg-card p-3" key={step}>
              <p className="font-mono text-muted-foreground text-xs">
                СТЪПКА {step}
              </p>
              <p className="mt-1 font-medium text-sm">{title}</p>
              <p className="mt-1 text-muted-foreground text-xs">{detail}</p>
            </div>
          ))}
        </section>
      </main>
    </>
  );
};

export default NewInventoryImportPage;
