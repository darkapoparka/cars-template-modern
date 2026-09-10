import { mobileResponsiveFormFocusClassName } from "@repo/marketplace-ui/lib/mobile-form-control";
export const importRequestOrigins = [
  { code: "CN", bg: "Китай", en: "China" },
  { code: "DE", bg: "Германия", en: "Germany" },
  { code: "US", bg: "САЩ", en: "United States" },
  { code: "JP", bg: "Япония", en: "Japan" },
  { code: "KR", bg: "Южна Корея", en: "South Korea" },
] as const;

export const importRequestInputClassName = `h-12 rounded-xl border-transparent bg-zinc-100 text-base shadow-none lg:h-11 lg:rounded-lg lg:bg-secondary ${mobileResponsiveFormFocusClassName}`;

export const importRequestSelectClassName =
  "h-11 w-full rounded-lg border border-transparent bg-secondary px-3 text-sm outline-none transition-shadow focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export const importRequestCopy = {
  bg: {
    budget: "Бюджет (по избор) ",
    budgetPlaceholder: "напр. до 50 000 €",
    email: "Имейл (по избор)",
    emailPlaceholder: "name@example.com",
    errorTitle: "Заявката не е изпратена",
    formDescription:
      "Изпратете линк или основните данни. Ще уточним транспорта, документите и следващата стъпка с вас.",
    formTitle: "Внос на автомобил по заявка",
    headingContact: "Вашият контакт",
    headingVehicle: "Автомобилът",
    make: "Марка (по избор)",
    makePlaceholder: "напр. BMW",
    message: "Бележки (по избор)",
    messagePlaceholder:
      "Какво е важно за вас — оборудване, срок, бюджет или конкретен въпрос?",
    mileage: "Пробег (по избор)",
    mileagePlaceholder: "напр. 62 000",
    model: "Модел (по избор)",
    modelPlaceholder: "напр. X5 xDrive40d",
    name: "Име",
    namePlaceholder: "Вашето име",
    origin: "Държава на произход",
    originPlaceholder: "Изберете държава",
    phone: "Телефон",
    phonePlaceholder: "напр. 0888 123 456",
    privacyPrefix: "Използваме данните само за отговор по тази заявка. Вижте",
    privacyText: "политиката за поверителност",
    send: "Изпрати заявка",
    sending: "Изпращане…",
    sourceUrl: "Линк към обявата (по избор)",
    sourceUrlPlaceholder: "https://...",
    successDescription:
      "Екипът ще прегледа информацията и ще се свърже с вас. Ако предпочитате, обадете се директно.",
    successTitle: "Заявката е получена",
    year: "Година (по избор)",
  },
  en: {
    budget: "Budget (optional)",
    budgetPlaceholder: "e.g. up to €50,000",
    email: "Email (optional)",
    emailPlaceholder: "name@example.com",
    errorTitle: "Your request was not sent",
    formDescription:
      "Send a link or the essential details. We will discuss transport, documents, and the next step with you.",
    formTitle: "Import a vehicle on request",
    headingContact: "Your contact",
    headingVehicle: "The vehicle",
    make: "Make (optional)",
    makePlaceholder: "e.g. BMW",
    message: "Notes (optional)",
    messagePlaceholder:
      "What matters to you — equipment, timing, budget, or a specific question?",
    mileage: "Mileage (optional)",
    mileagePlaceholder: "e.g. 62,000",
    model: "Model (optional)",
    modelPlaceholder: "e.g. X5 xDrive40d",
    name: "Name",
    namePlaceholder: "Your name",
    origin: "Origin country",
    originPlaceholder: "Select a country",
    phone: "Phone",
    phonePlaceholder: "e.g. +359 888 123 456",
    privacyPrefix: "We use these details only to answer this request. Read the",
    privacyText: "privacy policy",
    send: "Send import request",
    sending: "Sending…",
    sourceUrl: "Listing link (optional)",
    sourceUrlPlaceholder: "https://...",
    successDescription:
      "The team will review the information and contact you. If you prefer, call us directly.",
    successTitle: "Request received",
    year: "Year (optional)",
  },
} as const;
