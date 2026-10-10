import "server-only";
import { publicBlogPosts } from "./public-blog-posts";
import { contentFilters, type PublicContentCard } from "./public-content";
import { vehicleGuides } from "./vehicle-guides";

const desktopCardTitles: Record<string, { bg: string; en: string }> = {
  "premium-used-car-checklist": {
    bg: "Какво да проверите преди покупка",
    en: "Buying a premium car: what to check",
  },
  "import-costs-and-timing": {
    bg: "Внос на автомобил: разходи и срокове",
    en: "Car imports: costs and timelines",
  },
  "financing-offer-questions": {
    bg: "Въпроси преди офертата за финансиране",
    en: "Questions before a finance offer",
  },
  "ev-hybrid-ownership-checklist": {
    bg: "Проверки при EV и хибрид",
    en: "Checks for EVs and hybrids",
  },
  "dealer-listing-transparency": {
    bg: "Как да оцените една обява",
    en: "How to assess a car listing",
  },
  "buying-used-car-bulgaria": {
    bg: "Покупка на употребяван автомобил",
    en: "Buying a used car in Bulgaria",
  },
};

const relatedCardTitles: Record<string, { bg: string; en: string }> = {
  "premium-used-car-checklist": {
    bg: "Проверки преди покупка",
    en: "Premium car checks",
  },
  "import-costs-and-timing": {
    bg: "Разходи и срокове",
    en: "Costs and timelines",
  },
  "financing-offer-questions": {
    bg: "Въпроси за финансиране",
    en: "Finance offer questions",
  },
  "ev-hybrid-ownership-checklist": {
    bg: "EV и хибрид: проверки",
    en: "EV and hybrid checks",
  },
  "dealer-listing-transparency": {
    bg: "Проверка на обява",
    en: "Checking a listing",
  },
  "buying-used-car-bulgaria": {
    bg: "Покупка на автомобил",
    en: "Buying a used car",
  },
};

const mobileHeroTitles: Record<string, { bg: string; en: string }> = {
  ...relatedCardTitles,
  "import-costs-and-timing": {
    bg: "Разходи при внос",
    en: "Import costs",
  },
};

const articleHeroArtwork: Record<
  string,
  { image: string; takeaway: { bg: string; en: string } }
> = {
  "premium-used-car-checklist": {
    image: "/images/editorial/article-inspection-v1.webp",
    takeaway: { bg: "Проверете преди капаро.", en: "Check before a deposit." },
  },
  "import-costs-and-timing": {
    image: "/images/services/desktop-imports-v1.webp",
    takeaway: {
      bg: "Сметнете крайната цена.",
      en: "Calculate the total cost.",
    },
  },
  "financing-offer-questions": {
    image: "/images/services/desktop-finance-v1.webp",
    takeaway: { bg: "Сравнявайте общата цена.", en: "Compare the total cost." },
  },
  "buying-used-car-bulgaria": {
    image: "/images/services/desktop-sell-v1.webp",
    takeaway: { bg: "Направете оглед.", en: "Inspect before buying." },
  },
  "ev-hybrid-ownership-checklist": {
    image: "/images/editorial/article-charging-v1.webp",
    takeaway: { bg: "Проверете батерията.", en: "Check the battery." },
  },
  "dealer-listing-transparency": {
    image: "/images/editorial/article-listing-v1.webp",
    takeaway: { bg: "Търсете ясни условия.", en: "Look for clear terms." },
  },
};

const desktopCardArtwork: Record<string, string> = {
  "premium-used-car-checklist": "/images/desktop/cutout-m4-v1.webp",
  "import-costs-and-timing": "/images/services/desktop-imports-v1.webp",
  "financing-offer-questions": "/images/services/desktop-finance-v1.webp",
  "buying-used-car-bulgaria": "/images/desktop/cutout-golf-v1.webp",
  "ev-hybrid-ownership-checklist":
    "/images/categories/day-night-category-car-v2.png",
  "dealer-listing-transparency": "/images/services/desktop-sell-v1.webp",
};

export const getPublicContentArtwork = (slug: string, fallbackImage: string) =>
  desktopCardArtwork[slug] ?? fallbackImage;

const articleCovers: Record<string, { image?: string; position: string }> = {
  "premium-used-car-checklist": { position: "center 80%" },
  "buying-used-car-bulgaria": { position: "center 80%" },
  "ev-hybrid-ownership-checklist": { position: "center 70%" },
  "financing-offer-questions": {
    image: "/images/lease/mobile-pdp-finance-studio-v2.webp",
    position: "right center",
  },
  "import-costs-and-timing": { position: "right center" },
  "dealer-listing-transparency": {
    image: "/images/lease/mobile-pdp-showroom-blue-hour-v1.webp",
    position: "center",
  },
};

export const getPublicContentCover = (slug: string, fallbackImage: string) => ({
  image: articleCovers[slug]?.image ?? fallbackImage,
  position: articleCovers[slug]?.position ?? "center",
});

export const getDesktopContentCardTitle = (
  card: Pick<PublicContentCard, "slug" | "title">,
  locale: "bg" | "en"
) => desktopCardTitles[card.slug]?.[locale] ?? card.title;

export const getRelatedContentCardTitle = (
  card: Pick<PublicContentCard, "slug" | "title">,
  locale: "bg" | "en"
) => relatedCardTitles[card.slug]?.[locale] ?? card.title;

export const getMobileContentHeroTitle = (
  card: Pick<PublicContentCard, "slug" | "title">,
  locale: "bg" | "en"
) => mobileHeroTitles[card.slug]?.[locale] ?? card.title;

export const getContentHeroArtwork = (slug: string, locale: "bg" | "en") => {
  const hero = articleHeroArtwork[slug];
  return hero
    ? { image: hero.image, takeaway: hero.takeaway[locale] }
    : undefined;
};

/** Only serializable card summaries cross the client boundary, never article bodies. */
export const getPublicContentCards = (
  locale: "bg" | "en"
): PublicContentCard[] =>
  [
    ...publicBlogPosts.map(
      (post): PublicContentCard => ({
        category: post.category[locale],
        description: post.excerpt[locale],
        filter: post.categoryId,
        image: post.image,
        meta: post.readTime[locale],
        slug: post.slug,
        title: post.title[locale],
        type: "article",
      })
    ),
    ...vehicleGuides.map(
      (guide): PublicContentCard => ({
        category:
          contentFilters.find(({ id }) => id === guide.categoryId)?.[locale] ??
          "",
        description: guide.description[locale],
        filter: guide.categoryId,
        image: guide.image,
        meta: locale === "bg" ? "Ръководство" : "Guide",
        slug: guide.slug,
        title: guide.title[locale],
        type: "guide",
      })
    ),
  ].map((card) => ({
    ...card,
    desktopImage: getPublicContentArtwork(card.slug, card.image),
    desktopTitle: getDesktopContentCardTitle(card, locale),
  }));

export interface DesktopEditorialReading {
  checklist: readonly string[];
  paragraphs: readonly string[];
  readTime: string;
}

const desktopEditorialCopy: Record<
  string,
  {
    checklist: readonly Record<"bg" | "en", string>[];
    paragraphs: readonly Record<"bg" | "en", string>[];
  }
> = {
  "premium-used-car-checklist": {
    paragraphs: [
      {
        bg: "Подредете наличните записи по дата и пробег, вместо да разчитате само на общото описание „пълна история“. Поискайте документите за последното обслужване и задайте конкретни въпроси за липсващите периоди. Съгласуваната история помага да решите какво трябва да се провери при огледа.",
        en: "Put the available records in order by date and mileage rather than relying on a broad claim of “full history”. Ask for the paperwork behind the most recent service and specific explanations for any gaps. A coherent history helps you decide what the inspection needs to establish.",
      },
      {
        bg: "Запишете какво вече е сменено и какво предстои според документите и огледа. Разделете козметичните забележки от техническите въпроси и поискайте отделна оценка за необходимата работа. Така сравнявате автомобили със сходно състояние, а не само две цени в обявите.",
        en: "Write down what has already been replaced and what still needs attention according to the records and inspection. Separate cosmetic observations from technical questions, and ask for an itemised estimate for any work. That lets you compare vehicles in similar condition instead of comparing two asking prices alone.",
      },
      {
        bg: "Уговорете условията за независимия оглед със собственика предварително. Помолете проверяващия да опише установеното, препоръчаните действия и въпросите, които остават отворени. Използвайте този списък за разговора със продавача и поискайте обещаното отстраняване на проблеми да бъде описано писмено.",
        en: "Agree the arrangements for an independent inspection with the seller in advance. Ask the inspector to record the findings, recommended work, and questions that remain open. Use that list in your conversation with the seller, and have any promised remedial work described in writing.",
      },
    ],
    checklist: [
      {
        bg: "Поискайте VIN и документи за последното обслужване.",
        en: "Request the VIN and records of the latest service.",
      },
      {
        bg: "Оценете необходимата работа преди да оставите капаро.",
        en: "Estimate outstanding work before leaving a deposit.",
      },
      {
        bg: "Уговорете независим оглед и запишете условията.",
        en: "Arrange an independent inspection and record the agreed terms.",
      },
    ],
  },
  "import-costs-and-timing": {
    paragraphs: [
      {
        bg: "Поискайте разбивка на офертата и отбележете кои суми са потвърдени и кои са ориентировъчни. Уточнете какво е включено в транспорта, подготовката и предаването на автомобила. Сравнявайте крайните предложения при еднакъв обхват, за да не остават важни услуги извън сметката.",
        en: "Ask for an itemised quote and mark which amounts are confirmed and which are estimates. Clarify what the transport, preparation, and handover include. Compare the final proposals on the same scope so an apparently lower price does not leave important services outside the calculation.",
      },
      {
        bg: "Разделете процеса на ясни стъпки: потвърждение на покупката, готовност на документите, транспорт и предаване. За всяка стъпка уточнете отговорното лице и кога ще получите информация. Ако автомобилът ви е необходим до определена дата, обсъдете това преди да потвърдите поръчката.",
        en: "Break the process into clear stages: purchase confirmation, paperwork readiness, transport, and handover. For each stage, establish who is responsible and when you will receive an update. If you need the vehicle by a particular date, discuss that before confirming the order.",
      },
      {
        bg: "Поискайте списък с документите, които ще получите, и проверете дали данните за автомобила и продавача съвпадат. Уточнете кой организира всяка следваща стъпка и към кого се обръщате при липсваща информация. Добрата подготовка започва преди транспорта, а не при пристигането.",
        en: "Request a list of the documents you will receive and check that the vehicle and seller details agree. Clarify who arranges each subsequent step and who to contact if information is missing. Good preparation starts before transport rather than when the vehicle arrives.",
      },
    ],
    checklist: [
      {
        bg: "Поискайте крайна оферта с разбивка на включените услуги.",
        en: "Request an itemised quote for the complete agreed scope.",
      },
      {
        bg: "Уточнете етапите, отговорностите и сроковете за информация.",
        en: "Agree the stages, responsibilities, and update schedule.",
      },
      {
        bg: "Проверете документите преди организиране на транспорта.",
        en: "Review the paperwork before arranging transport.",
      },
    ],
  },
  "financing-offer-questions": {
    paragraphs: [
      {
        bg: "Подредете предложението в три части: какво плащате сега, какви са редовните вноски и какво остава за плащане накрая. Поискайте да бъдат посочени включените и допълнителните услуги. Ако дадена сума липсва, задайте въпроса преди да сравнявате офертата с друга.",
        en: "Put the proposal into three parts: what you pay now, the regular instalments, and anything payable at the end. Ask which services are included and which carry an additional charge. If a figure is missing, resolve that question before comparing the proposal with another offer.",
      },
      {
        bg: "Поискайте писмено обяснение на вариантите, ако решите да приключите договора по-рано или обстоятелствата ви се променят. Уточнете към кого се обръщате и как се получава конкретна сметка за вашия договор. Използвайте условията на самата оферта, а не общо рекламно описание.",
        en: "Ask for a written explanation of the options if you want to finish the agreement early or your circumstances change. Establish who handles the request and how to obtain a calculation for your specific agreement. Work from the terms of the actual offer rather than a general advertising description.",
      },
      {
        bg: "Сравнете една и съща цена на автомобила, първоначална вноска и срок. След това отбележете разликите в таксите, последното плащане и включените услуги. Ясната таблица с параметри е по-полезна от една отделна месечна сума.",
        en: "Compare the same vehicle price, deposit, and term. Then note the differences in fees, the final payment, and included services. A clear table of the proposal’s terms is more useful than one monthly figure viewed in isolation.",
      },
    ],
    checklist: [
      {
        bg: "Поискайте общата сума и всички отделни плащания.",
        en: "Request the total payable and each individual payment.",
      },
      {
        bg: "Сравнявайте еднаква първоначална вноска и срок.",
        en: "Compare offers using the same deposit and term.",
      },
      {
        bg: "Прочетете писмените условия за промяна или приключване.",
        en: "Read the written terms for changing or ending the agreement.",
      },
    ],
  },
  "buying-used-car-bulgaria": {
    paragraphs: [
      {
        bg: "Преди да уговорите посещение, изпратете кратък списък с въпроси и поискайте актуални снимки на важните за вас детайли. Уточнете кой ще присъства на огледа и кои документи могат да бъдат показани. Така пристигате с конкретен план и използвате времето за реална проверка.",
        en: "Before arranging a visit, send a short list of questions and request current photographs of the details that matter to you. Establish who will attend the viewing and which documents can be shown. You can then arrive with a clear plan and use the time for a practical inspection.",
      },
      {
        bg: "Носете списъка с предварителните въпроси и отбележете кои отговори са потвърдени на място. След огледа отделете време да сравните документите, установеното състояние и обещаната подготовка. Нерешените въпроси заслужават допълнителна проверка, преди да вземете окончателно решение.",
        en: "Bring your original questions and note which answers are confirmed at the viewing. Afterwards, take time to compare the documents, observed condition, and promised preparation. Unresolved questions deserve another check before you make a final decision.",
      },
    ],
    checklist: [
      {
        bg: "Подгответе конкретни въпроси преди посещението.",
        en: "Prepare specific questions before the visit.",
      },
      {
        bg: "Сравнете автомобила с документите и описанието.",
        en: "Compare the vehicle with its documents and description.",
      },
      {
        bg: "Изяснете оставащите въпроси след независим оглед.",
        en: "Resolve outstanding questions after an independent inspection.",
      },
    ],
  },
  "ev-hybrid-ownership-checklist": {
    paragraphs: [
      {
        bg: "Когато има отчет за батерията, проверете датата му и какво точно е измерено. Поискайте информация за конкретната версия на автомобила и включените кабели. Разгледайте собствените си възможности за зареждане, вместо да разчитате само на една стойност за пробег в обявата.",
        en: "When a battery report is available, check its date and what was actually measured. Request information for the specific vehicle version and the cables supplied with it. Consider your own charging arrangements rather than relying on a single range figure in the listing.",
      },
      {
        bg: "Съберете условията за гаранция и обслужване на едно място. Уточнете към кого се обръщате за проверка, части или гаранционен въпрос и кои документи трябва да представите. Това превръща общото обещание за поддръжка в конкретен план след покупката.",
        en: "Keep the warranty and servicing terms together. Establish who you contact for an inspection, parts, or a warranty question, and which documents you need to provide. That turns a broad promise of support into a practical plan for ownership.",
      },
    ],
    checklist: [
      {
        bg: "Проверете наличния отчет за батерията и датата му.",
        en: "Check the available battery report and its date.",
      },
      {
        bg: "Уточнете версията, кабелите и собственото си зареждане.",
        en: "Confirm the version, supplied cables, and your charging setup.",
      },
      {
        bg: "Запазете писмените условия за гаранция и обслужване.",
        en: "Keep the written warranty and servicing terms.",
      },
    ],
  },
  "dealer-listing-transparency": {
    paragraphs: [
      {
        bg: "Запазете обявата и запишете кои детайли още липсват: точната версия, местоположението, включените услуги или крайната сума. Поискайте от продавача потвърждение за конкретния автомобил. Снимките и описанието са начало на проверката, а не заместител на отговорите.",
        en: "Save the listing and note what is still missing: the exact version, location, included services, or final amount. Ask the seller to confirm the details for the particular vehicle. Photographs and a description are the start of your checks rather than a substitute for clear answers.",
      },
      {
        bg: "За всяко важно обещание поискайте документ или ясно писмено описание. Ако се предлага гаранция или подготовка преди предаване, уточнете обхвата и кой отговаря за изпълнението. Конкретните условия ви помагат да сравнявате оферти по съдържание, а не по рекламни формулировки.",
        en: "For each important promise, request supporting paperwork or a clear written description. If a warranty or preparation before handover is offered, establish its scope and who is responsible for it. Specific terms help you compare what is included rather than comparing advertising language.",
      },
    ],
    checklist: [
      {
        bg: "Потвърдете продавача, местоположението и крайното предложение.",
        en: "Confirm the seller, location, and complete proposal.",
      },
      {
        bg: "Поискайте доказателства за важните твърдения.",
        en: "Request evidence for the claims that matter to you.",
      },
      {
        bg: "Уточнете писмено подготовката и условията след продажбата.",
        en: "Clarify preparation and aftersales terms in writing.",
      },
    ],
  },
};

const editorialWordSeparator = /\s+/;

export function getDesktopEditorialReading(
  slug: string,
  language: "bg" | "en"
): DesktopEditorialReading | undefined {
  const copy = desktopEditorialCopy[slug];
  const entry =
    publicBlogPosts.find((post) => post.slug === slug) ??
    vehicleGuides.find((guide) => guide.slug === slug);
  if (!(copy && entry)) {
    return undefined;
  }
  const paragraphs = copy.paragraphs.map((paragraph) => paragraph[language]);
  const checklist = copy.checklist.map((point) => point[language]);
  const words = [
    ...entry.sections.map((section) => section.body[language]),
    ...paragraphs,
    ...checklist,
  ]
    .join(" ")
    .trim()
    .split(editorialWordSeparator).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return {
    checklist,
    paragraphs,
    readTime:
      language === "bg" ? `${minutes} мин четене` : `${minutes} min read`,
  };
}
