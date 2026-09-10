"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { vehicleMakes } from "@repo/marketplace";
import { ArrowRightIcon, ShieldCheckIcon } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { SellFunnelSteps } from "./sell-funnel-steps";

interface SellerListingStartDefaults {
  readonly category?: string;
  readonly make?: string;
  readonly model?: string;
  readonly year?: number;
}

interface SellerListingStartFormProps {
  readonly action: (formData: FormData) => Promise<void>;
  readonly defaults?: SellerListingStartDefaults;
}

const selectClassName =
  "h-11 rounded-lg border border-input bg-background px-3 text-sm";

const StartSubmitButton = () => {
  const { pending } = useFormStatus();

  return (
    <Button
      className="mt-5 h-11 w-full gap-2 rounded-lg"
      disabled={pending}
      type="submit"
    >
      {pending ? "Запазване…" : "Запази и добави снимки"}
      <ArrowRightIcon aria-hidden="true" className="size-4" />
    </Button>
  );
};

export const SellerListingStartForm = ({
  action,
  defaults,
}: SellerListingStartFormProps) => {
  const [identityMethod, setIdentityMethod] = useState<
    "manual" | "registration" | "vin"
  >("manual");
  const identifierHelp =
    identityMethod === "vin"
      ? "Въведете точно 17 знака без I, O и Q."
      : identityMethod === "registration"
        ? "Въведете регистрационния номер; основните данни остават задължителни."
        : "Оставете празно при ръчно въвеждане.";

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-4">
      <SellFunnelSteps currentStep={1} />
      <form action={action} className="grid gap-4 lg:grid-cols-[1fr_19rem]">
        <section className="rounded-lg border bg-card p-4 sm:p-5">
          <h1 className="font-semibold text-lg">Кой автомобил продавате?</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground text-sm">
            Започнете само с данните за идентификация. След това запазваме
            чернова и снимките идват веднага — останалото може да довършите
            по-късно.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="identityMethod">Начин на идентификация</Label>
              <select
                className={selectClassName}
                defaultValue="manual"
                id="identityMethod"
                name="identityMethod"
                onChange={(event) =>
                  setIdentityMethod(
                    event.target.value as "manual" | "registration" | "vin"
                  )
                }
              >
                <option value="manual">Марка, модел и година</option>
                <option value="vin">VIN + основни данни</option>
                <option value="registration">
                  Регистрация + основни данни
                </option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="identifier">VIN или регистрационен номер</Label>
              <Input
                aria-describedby="identifier-help"
                autoCapitalize="characters"
                className="h-11 rounded-lg"
                id="identifier"
                maxLength={identityMethod === "vin" ? 17 : 20}
                minLength={
                  identityMethod === "vin"
                    ? 17
                    : identityMethod === "registration"
                      ? 2
                      : undefined
                }
                name="identifier"
                pattern={
                  identityMethod === "vin"
                    ? "[A-HJ-NPR-Z0-9a-hj-npr-z]{17}"
                    : undefined
                }
                placeholder="Незадължително при ръчно въвеждане"
                required={identityMethod !== "manual"}
                spellCheck={false}
              />
              <p className="text-muted-foreground text-xs" id="identifier-help">
                {identifierHelp}
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Категория</Label>
              <select
                className={selectClassName}
                defaultValue={defaults?.category ?? "car"}
                id="category"
                name="category"
                required
              >
                <option value="car">Автомобил</option>
                <option value="van">Бус</option>
                <option value="motorbike">Мотоциклет</option>
                <option value="truck">Камион</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="make">Марка</Label>
              <select
                className={selectClassName}
                defaultValue={defaults?.make ?? "BMW"}
                id="make"
                name="make"
                required
              >
                {vehicleMakes.map((make) => (
                  <option key={make} value={make}>
                    {make}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="model">Модел</Label>
              <Input
                className="h-11 rounded-lg"
                defaultValue={defaults?.model}
                id="model"
                maxLength={80}
                name="model"
                placeholder="XC60"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="year">Година</Label>
              <Input
                className="h-11 rounded-lg"
                defaultValue={defaults?.year}
                id="year"
                inputMode="numeric"
                max={2100}
                min={1886}
                name="year"
                placeholder="2022"
                required
                step={1}
                type="number"
              />
            </div>
          </div>
        </section>

        <aside className="h-fit rounded-lg border bg-card p-4">
          <div className="flex gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary">
              <ShieldCheckIcon aria-hidden="true" className="size-4" />
            </span>
            <div>
              <h2 className="font-semibold text-sm">Без загуба на прогрес</h2>
              <p className="mt-1 text-muted-foreground text-sm">
                Повторното изпращане възстановява същата недовършена чернова.
                Можете да пропуснете снимките и да се върнете от „Моите обяви“.
              </p>
            </div>
          </div>
          <StartSubmitButton />
        </aside>
      </form>
    </div>
  );
};
