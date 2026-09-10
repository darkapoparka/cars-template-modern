export interface VehicleGuide {
  description: { bg: string; en: string };
  sections: readonly {
    body: { bg: string; en: string };
    heading: { bg: string; en: string };
  }[];
  slug: string;
  title: { bg: string; en: string };
}

export const vehicleGuides: readonly VehicleGuide[] = [
  {
    slug: "buying-used-car-bulgaria",
    title: {
      bg: "Покупка на употребяван автомобил в България",
      en: "Buying a used car in Bulgaria",
    },
    description: {
      bg: "Практичен списък за обявата, документите, огледа и пробното шофиране.",
      en: "A practical checklist for the listing, documents, inspection, and test drive.",
    },
    sections: [
      {
        heading: { bg: "Преди огледа", en: "Before the inspection" },
        body: {
          bg: "Сравнете цената с подобни автомобили и поискайте VIN, сервизна история, данни за продавача и писмено описание на известните повреди. Липсващата информация не доказва проблем, но е причина да зададете допълнителни въпроси.",
          en: "Compare the price with similar vehicles and ask for the VIN, service history, seller details, and a written description of known damage. Missing information does not prove a problem, but it warrants more questions.",
        },
      },
      {
        heading: { bg: "На място", en: "At the vehicle" },
        body: {
          bg: "Проверете дали VIN и документите съвпадат, огледайте автомобила на дневна светлина и направете независимо техническо изследване. Не разчитайте само на значки или маркетингови твърдения в обявата.",
          en: "Check that the VIN and documents match, inspect the vehicle in daylight, and arrange an independent technical inspection. Do not rely only on badges or marketing claims in the listing.",
        },
      },
    ],
  },
  {
    slug: "ev-hybrid-ownership-checklist",
    title: {
      bg: "Проверки при електромобил или хибрид",
      en: "EV and hybrid ownership checklist",
    },
    description: {
      bg: "Какво да проверите за батерия, зареждане, гаранция, сервиз и части.",
      en: "What to verify about the battery, charging, warranty, service, and parts.",
    },
    sections: [
      {
        heading: { bg: "Батерия и зареждане", en: "Battery and charging" },
        body: {
          bg: "Поискайте отчет за състоянието на батерията, когато е наличен, и проверете поддържаните стандарти и реалните условия за домашно и публично зареждане. Декларираният пробег зависи от версия, температура, скорост и оборудване.",
          en: "Request a battery-health report when available, and verify supported charging standards and realistic home and public charging conditions. Advertised range varies by version, temperature, speed, and equipment.",
        },
      },
      {
        heading: {
          bg: "Поддръжка след покупката",
          en: "Support after purchase",
        },
        body: {
          bg: "Проверете писмено гаранцията за автомобила и батерията, кои сервизи извършват гаранционна работа, наличността на части и условията за пътна помощ. Условията могат да се различават по модел и дата.",
          en: "Verify the vehicle and battery warranty in writing, which workshops perform warranty work, parts availability, and roadside-assistance terms. Conditions can vary by model and date.",
        },
      },
    ],
  },
  {
    slug: "dealer-listing-transparency",
    title: {
      bg: "Как да оцените дилърска обява",
      en: "How to assess a dealer listing",
    },
    description: {
      bg: "Сигнали за ясна цена, идентичност на продавача и условия след продажбата.",
      en: "Signals for clear pricing, seller identity, and aftersales terms.",
    },
    sections: [
      {
        heading: { bg: "Ясни факти", en: "Clear facts" },
        body: {
          bg: "Добрата обява посочва продавача, местоположението, ДДС статуса, крайна цена, наличност и всички допълнителни такси. При финансиране търсете депозит, срок, лихва или ГПР, такси, последна вноска и общо дължима сума.",
          en: "A strong listing identifies the seller, location, VAT status, final price, availability, and additional fees. For finance, look for the deposit, term, interest or APR, fees, final payment, and total payable.",
        },
      },
      {
        heading: { bg: "Проверими твърдения", en: "Verifiable claims" },
        body: {
          bg: "Твърденията за официален внос, гаранция, сервиз, история и наличност трябва да имат конкретен обхват и актуална основа. Платеното позициониране не е доказателство за качество или проверка.",
          en: "Claims about official import, warranty, service, history, and availability need a specific scope and current evidence. Paid placement is not evidence of quality or verification.",
        },
      },
    ],
  },
] as const;

export const getVehicleGuide = (slug: string) =>
  vehicleGuides.find((guide) => guide.slug === slug);
