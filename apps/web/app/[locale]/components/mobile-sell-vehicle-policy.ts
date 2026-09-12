import { mobileFormFocusClassName } from "@repo/marketplace-ui/lib/mobile-form-control";
import {
  type SellVehicleCategory,
  sellCategoryLabels,
} from "../../../lib/sell-vehicle-draft";

export {
  isCompleteVehicleVin,
  normalizeVehicleVin,
} from "../../../lib/sell-vehicle-draft";
export const mobileSellVehicleCategoryOptions = {
  bg: Object.entries(sellCategoryLabels.bg).map(([value, label]) => ({
    value: value as SellVehicleCategory,
    label,
  })),
  en: Object.entries(sellCategoryLabels.en).map(([value, label]) => ({
    value: value as SellVehicleCategory,
    label,
  })),
};

export const mobileSellVehicleCopy = {
  bg: {
    category: "Категория",
    close: "Затворете",
    description: "Въведете VIN или добавете данни",
    directCall: "Предпочитате разговор?",
    formDescription: "Въведете VIN или марка, модел, година и пробег.",
    formTitle: "Данни за автомобила",
    howDescription: "Три ясни стъпки от данните до конкретна оферта.",
    howEyebrow: "Продажба на автомобил",
    howOpen: "Как работи?",
    howStart: "Въведете данните",
    howSteps: [
      {
        description:
          "VIN или марка, модел, година и пробег са достатъчни за начало.",
        title: "Подгответе основните данни",
      },
      {
        description:
          "Обадете ни се с данните, за да обсъдим удобен час за оглед.",
        title: "Организираме оглед",
      },
      {
        description:
          "След огледа получавате конкретни условия за изкупуване или бартер.",
        title: "Получавате оферта",
      },
    ],
    howTitle: "Как протича продажбата",
    inventory: "Вижте наличностите",
    make: "Марка",
    mileage: "Пробег",
    model: "Модел",
    noVin: "Нямате VIN? Въведете данните",
    openForm: "Отворете формата за оценка",
    submit: "Продължете към контакт",
    title: "Продайте автомобила си",
    vin: "VIN номер",
    vinOptional: "VIN номер (по желание)",
    year: "Година",
  },
  en: {
    category: "Category",
    close: "Close",
    description: "Enter a VIN or add vehicle details",
    directCall: "Prefer to speak directly?",
    formDescription: "Enter a VIN or the make, model, year and mileage.",
    formTitle: "Vehicle details",
    howDescription:
      "Three clear steps from vehicle details to a concrete offer.",
    howEyebrow: "Sell your vehicle",
    howOpen: "How does it work?",
    howStart: "Enter vehicle details",
    howSteps: [
      {
        description:
          "A VIN or make, model, year and mileage is enough to begin.",
        title: "Prepare the essentials",
      },
      {
        description:
          "Call us with the details to discuss a convenient inspection time.",
        title: "Arrange an inspection",
      },
      {
        description:
          "After inspection you receive concrete purchase or trade-in terms.",
        title: "Receive an offer",
      },
    ],
    howTitle: "How selling works",
    inventory: "Browse inventory",
    make: "Make",
    mileage: "Mileage",
    model: "Model",
    noVin: "No VIN? Enter the details",
    openForm: "Open appraisal form",
    submit: "Continue to contact",
    title: "Sell your vehicle",
    vin: "VIN number",
    vinOptional: "VIN number (optional)",
    year: "Year",
  },
} as const;

export const mobileSellInputClassName = `h-12 rounded-xl border-transparent bg-zinc-100 text-base shadow-none ${mobileFormFocusClassName}`;
export const mobileSellSelectClassName =
  "h-12 w-full rounded-xl border border-transparent bg-zinc-100 px-3 text-base outline-none transition-shadow focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";
