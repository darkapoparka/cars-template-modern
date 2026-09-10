export interface FinancingRequest {
  deposit?: string;
  term: string;
  vehicle: string;
}

export const financingRequestCopy = {
  bg: {
    call: "Обадете се",
    close: "Затворете",
    deposit: "Първоначална вноска",
    description: "Оставете данни и ще уточним индивидуалните условия.",
    email: "Имейл (по желание)",
    emailPlaceholder: "name@email.com",
    flexible: "Ще уточним",
    name: "Име",
    namePlaceholder: "Вашето име",
    note: "Бележка (по желание)",
    notePlaceholder: "Удобно време за разговор или допълнителен въпрос",
    phone: "Телефон",
    phonePlaceholder: "+359 ...",
    send: "Изпратете заявка",
    sending: "Изпращане…",
    success: "Заявката е изпратена",
    successBody:
      "Екипът на Day & Night ще се свърже с вас за конкретните условия.",
    term: "Срок",
    title: "Заявка за финансиране",
    vehicle: "Избран автомобил",
  },
  en: {
    call: "Call us",
    close: "Close",
    deposit: "Initial payment",
    description: "Leave your details and we will confirm the individual terms.",
    email: "Email (optional)",
    emailPlaceholder: "name@email.com",
    flexible: "To be discussed",
    name: "Name",
    namePlaceholder: "Your name",
    note: "Note (optional)",
    notePlaceholder: "Preferred time to call or an additional question",
    phone: "Phone",
    phonePlaceholder: "+359 ...",
    send: "Send request",
    sending: "Sending…",
    success: "Request sent",
    successBody: "The Day & Night team will contact you to confirm the terms.",
    term: "Term",
    title: "Financing request",
    vehicle: "Selected vehicle",
  },
} as const;

export const financingDepositOptions = ["flexible", "10", "20", "30"] as const;
export const financingTermOptions = [
  "flexible",
  "12",
  "24",
  "36",
  "48",
  "60",
] as const;

export const getFinancingTermLabel = (term: string, locale: "bg" | "en") =>
  term === "flexible"
    ? financingRequestCopy[locale].flexible
    : `${term} ${locale === "bg" ? "месеца" : "months"}`;

export const getFinancingDepositLabel = (
  deposit: string,
  locale: "bg" | "en"
) =>
  deposit === "flexible"
    ? financingRequestCopy[locale].flexible
    : `${deposit}%`;

export const buildFinancingContactMessage = ({
  deposit,
  locale,
  note,
  request,
}: {
  deposit: string;
  locale: "bg" | "en";
  note: string;
  request: FinancingRequest;
}) => {
  const copy = financingRequestCopy[locale];
  return [
    locale === "bg"
      ? "Заявка за автомобилно финансиране."
      : "Vehicle financing request.",
    `${copy.vehicle}: ${request.vehicle}`,
    `${copy.term}: ${getFinancingTermLabel(request.term, locale)}`,
    `${copy.deposit}: ${getFinancingDepositLabel(deposit, locale)}`,
    note.trim() ? `${copy.note}: ${note.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n");
};

export const parseFinancingRequestHref = (
  href: string,
  baseHref = "https://example.invalid/"
): FinancingRequest | null => {
  let url: URL;
  try {
    url = new URL(href, baseHref);
  } catch {
    return null;
  }

  if (
    !url.pathname.endsWith("/contact") ||
    url.searchParams.get("intent") !== "leasing"
  ) {
    return null;
  }

  const vehicle = url.searchParams.get("vehicle")?.trim();
  const term = url.searchParams.get("term")?.trim();
  const deposit = url.searchParams.get("deposit");
  const preference =
    deposit && ["flexible", "10", "20", "30"].includes(deposit)
      ? { deposit }
      : {};
  return vehicle && term ? { term, vehicle, ...preference } : null;
};
