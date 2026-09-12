import type { ContentCategory } from "./public-content";

export type BlogLanguage = "bg" | "en";

interface LocalizedText {
  bg: string;
  en: string;
}

export interface PublicBlogPost {
  category: LocalizedText;
  categoryId: ContentCategory;
  excerpt: LocalizedText;
  image: string;
  published: string;
  readTime: LocalizedText;
  sections: readonly {
    body: LocalizedText;
    heading: LocalizedText;
  }[];
  slug: string;
  title: LocalizedText;
}

export const publicBlogPosts: readonly PublicBlogPost[] = [
  {
    slug: "premium-used-car-checklist",
    categoryId: "buying",
    image: "/images/directory/sofia-premium-cars-profile.webp",
    published: "2026-09-08",
    category: { bg: "Покупка", en: "Buying" },
    readTime: { bg: "5 мин четене", en: "5 min read" },
    title: {
      bg: "Какво да проверите преди покупка на премиум автомобил",
      en: "What to check before buying a premium used car",
    },
    excerpt: {
      bg: "История, документи, гуми, спирачки и електроника — кратък списък преди да оставите капаро.",
      en: "History, documents, tyres, brakes, and electronics — a concise checklist before leaving a deposit.",
    },
    sections: [
      {
        heading: { bg: "Започнете с историята", en: "Start with the history" },
        body: {
          bg: "VIN, сервизната история и фактурите трябва да разказват една и съща история. Проверете дали пробегът, периодичните обслужвания и ремонтите са логични за възрастта на автомобила.",
          en: "The VIN, service history, and invoices should tell the same story. Check that mileage, scheduled maintenance, and repairs make sense for the vehicle's age.",
        },
      },
      {
        heading: {
          bg: "Гледайте скъпите консумативи",
          en: "Check the expensive wear items",
        },
        body: {
          bg: "При премиум автомобил гуми, спирачки, въздушно окачване и адаптивни системи могат да променят реалната цена на покупката. Оценете ги преди преговорите, а не след сделката.",
          en: "On a premium car, tyres, brakes, air suspension, and adaptive systems can materially change the real purchase cost. Assess them before negotiating, not after the deal.",
        },
      },
      {
        heading: {
          bg: "Направете независим оглед",
          en: "Get an independent inspection",
        },
        body: {
          bg: "Кратък тест драйв не е достатъчен. Диагностика, оглед на подемник и проверка на боята дават много по-ясна представа за състоянието и бъдещите разходи.",
          en: "A short test drive is not enough. Diagnostics, an inspection on a lift, and paint-depth checks give a much clearer picture of condition and future costs.",
        },
      },
    ],
  },
  {
    slug: "import-costs-and-timing",
    categoryId: "import",
    image: "/images/import/day-night-mobile-terminal-v2.webp",
    published: "2026-09-04",
    category: { bg: "Внос", en: "Import" },
    readTime: { bg: "4 мин четене", en: "4 min read" },
    title: {
      bg: "Внос на автомобил: кои разходи и срокове често се пропускат",
      en: "Importing a car: the costs and timelines people often miss",
    },
    excerpt: {
      bg: "Покупната цена е само началото. Транспорт, документи, регистрация и подготовка трябва да се сметнат предварително.",
      en: "The purchase price is only the start. Transport, documents, registration, and preparation should be budgeted in advance.",
    },
    sections: [
      {
        heading: {
          bg: "Сметнете крайната цена",
          en: "Calculate the landed cost",
        },
        body: {
          bg: "Сравнявайте оферти по крайна цена до България, а не само по цената в обявата. Транспорт, застраховка, такси, данъци и регистрационни разходи могат да променят избора.",
          en: "Compare offers by landed cost in Bulgaria, not only by the listing price. Transport, insurance, fees, taxes, and registration costs can change which vehicle is actually the better buy.",
        },
      },
      {
        heading: {
          bg: "Оставете резерв във времето",
          en: "Leave time contingency",
        },
        body: {
          bg: "Срокът зависи от държавата, транспорта и документите. Добрата оферта трябва да има реалистичен диапазон за доставка, а не обещание за точна дата без резерв.",
          en: "Timing depends on the origin country, transport, and paperwork. A credible offer should include a realistic delivery window rather than an exact date with no contingency.",
        },
      },
      {
        heading: {
          bg: "Проверете документите предварително",
          en: "Check paperwork early",
        },
        body: {
          bg: "Произход, фактура, експортни документи и данни за регистрация е по-добре да се проверят преди автомобилът да тръгне. Така проблемите се решават преди да станат скъпи.",
          en: "Origin, invoice, export papers, and registration information are best checked before the car moves. That gives you time to resolve problems before they become expensive.",
        },
      },
    ],
  },
  {
    slug: "financing-offer-questions",
    categoryId: "finance",
    image: "/images/lease/day-night-mobile-studio-v2.webp",
    published: "2026-08-29",
    category: { bg: "Финансиране", en: "Finance" },
    readTime: { bg: "4 мин четене", en: "4 min read" },
    title: {
      bg: "5 въпроса преди да приемете оферта за финансиране",
      en: "5 questions before accepting a vehicle finance offer",
    },
    excerpt: {
      bg: "Не гледайте само месечната вноска. Срокът, първоначалната сума и крайната цена са също толкова важни.",
      en: "Do not look only at the monthly payment. Term, deposit, and total payable matter just as much.",
    },
    sections: [
      {
        heading: {
          bg: "Каква е общата цена?",
          en: "What is the total payable?",
        },
        body: {
          bg: "Поискайте крайна сума за целия срок, включително такси и допълнителни плащания. Ниска месечна вноска може да изглежда добре, но да скрива по-висока обща цена.",
          en: "Ask for the total amount payable over the full term, including fees and additional payments. A low monthly payment can look attractive while hiding a higher overall cost.",
        },
      },
      {
        heading: {
          bg: "Какво става при промяна?",
          en: "What happens if plans change?",
        },
        body: {
          bg: "Уточнете предварително условията при предсрочно погасяване, забавяне или промяна на автомобила. Най-добрата оферта е тази, чиито правила са ясни още преди подписването.",
          en: "Clarify early repayment, late-payment, and vehicle-change terms in advance. The best offer is one whose rules are clear before you sign.",
        },
      },
      {
        heading: {
          bg: "Сравнявайте еднакви параметри",
          en: "Compare like with like",
        },
        body: {
          bg: "Когато сравнявате две оферти, използвайте еднакъв срок и еднаква първоначална вноска. Иначе месечните плащания не показват реалната разлика между вариантите.",
          en: "When comparing two offers, use the same term and deposit. Otherwise the monthly payments do not show the real difference between the options.",
        },
      },
    ],
  },
] as const;

export const getPublicBlogPost = (slug: string) =>
  publicBlogPosts.find((post) => post.slug === slug);
