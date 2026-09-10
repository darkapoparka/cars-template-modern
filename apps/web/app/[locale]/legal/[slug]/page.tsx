import { Button } from "@repo/design-system/components/ui/button";
import { getLocalizedPath, normalizeSeoLocale } from "@repo/seo/metadata";
import { ArrowLeft, FileText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createPublicLocalizedMetadata } from "@/lib/public-metadata";
import { getPublicWebBaseUrl } from "@/lib/public-url";
import { PublicMarketplaceFrame } from "../../components/public-marketplace-frame";

interface LegalPageProperties {
  readonly params: Promise<{
    locale: string;
    slug: string;
  }>;
}

interface FallbackLegalPage {
  description: string;
  sections: readonly {
    body: string;
    heading: string;
  }[];
  title: string;
}

const fallbackLegalSlugs = ["privacy", "terms"] as const;

const getPrivacyFallback = (isBg: boolean): FallbackLegalPage => ({
  title: isBg ? "Политика за поверителност" : "Privacy policy",
  description: isBg
    ? "Как Day & Night Auto Group използва и защитава данните, които предоставяте при запитване за автомобил, внос, лизинг или продажба."
    : "How Day & Night Auto Group uses and protects information you provide when asking about a vehicle, import, leasing, or selling your car.",
  sections: isBg
    ? [
        {
          heading: "Какви данни обработваме",
          body: "Можем да обработваме име, телефон, имейл, съдържание на запитването и данни за автомобил, които доброволно ни предоставяте. Сайтът може да обработва и ограничени технически данни, необходими за сигурност и предпочитания за бисквитки.",
        },
        {
          heading: "Защо ги използваме",
          body: "Използваме данните, за да отговорим, да организираме оглед или оферта, да обсъдим внос, лизинг или изкупуване на автомобил, да предотвратяваме злоупотреби и да изпълняваме законови задължения. Незадължителни анализи се активират само след съгласие.",
        },
        {
          heading: "Споделяне и съхранение",
          body: "Споделяме само необходимите данни с доставчици, които поддържат сайта и комуникацията, както и с транспортен, финансов или друг партньор, когато това е нужно за изрично поисканата услуга. Не продаваме лични данни и ги пазим само за необходимия срок.",
        },
        {
          heading: "Вашите права",
          body: "Можете да поискате достъп, корекция, изтриване, ограничаване, възражение или преносимост, когато съответното право се прилага. Използвайте страницата за контакт; можете също да подадете жалба до компетентния надзорен орган.",
        },
      ]
    : [
        {
          heading: "Data we process",
          body: "We may process your name, phone number, email address, enquiry content, and vehicle details you voluntarily provide. The site may also process limited technical information required for security and cookie preferences.",
        },
        {
          heading: "Why we use it",
          body: "We use the information to reply, arrange a viewing or quotation, discuss imports, leasing, or purchasing your vehicle, prevent abuse, and meet legal obligations. Optional analytics activate only after consent.",
        },
        {
          heading: "Sharing and retention",
          body: "We share only necessary information with providers that support the website and communications, and with a transport, finance, or other partner when required for a service you explicitly request. We do not sell personal data and retain it only for as long as necessary.",
        },
        {
          heading: "Your rights",
          body: "You may request access, correction, deletion, restriction, objection, or portability where the relevant right applies. Use the contact page; you may also complain to the competent supervisory authority.",
        },
      ],
});

const getTermsFallback = (isBg: boolean): FallbackLegalPage => ({
  title: isBg ? "Условия за ползване" : "Terms of use",
  description: isBg
    ? "Основните правила за използване на сайта на Day & Night Auto Group и информацията за автомобили, внос и лизинг."
    : "The core rules for using the Day & Night Auto Group website and its vehicle, import, and leasing information.",
  sections: isBg
    ? [
        {
          heading: "Роля на Day & Night",
          body: "Day & Night Auto Group представя собствени наличности и услуги за внос, лизинг и изкупуване на автомобили. Сайтът служи за информация и контакт; конкретните търговски условия се потвърждават в индивидуална писмена оферта или договор.",
        },
        {
          heading: "Информация за автомобилите",
          body: "Полагаме разумни усилия снимките, описанията, пробегът, оборудването и цените да са актуални. Възможни са промени или технически грешки, затова наличността, състоянието, документите и крайната цена се потвърждават преди сделка.",
        },
        {
          heading: "Внос и лизинг",
          body: "Срокове, транспорт, регистрация, гаранция, първоначална вноска и месечни плащания зависят от конкретния автомобил и избраната услуга. Те са валидни само след изрично потвърждение; финансиране може да се предоставя от отделен партньор при негово одобрение.",
        },
        {
          heading: "Цени и наличност",
          body: "Цените, ориентировъчните месечни плащания, сроковете за доставка и наличността могат да се променят. Крайната цена, включените данъци и такси, гаранцията и доставката се потвърждават писмено от Day & Night.",
        },
        {
          heading: "Използване на сайта",
          body: "Не използвайте сайта за незаконни действия, автоматизирано извличане, намеса в сигурността или злоупотреба с формите за контакт. За въпрос относно тези условия използвайте страницата за контакт.",
        },
      ]
    : [
        {
          heading: "Day & Night's role",
          body: "Day & Night Auto Group presents its vehicle stock and services for imports, leasing, and purchasing vehicles. The website provides information and contact options; specific commercial terms are confirmed in an individual written quotation or agreement.",
        },
        {
          heading: "Vehicle information",
          body: "We take reasonable care to keep photos, descriptions, mileage, equipment, and prices current. Changes or technical errors can occur, so availability, condition, documents, and the final price are confirmed before a transaction.",
        },
        {
          heading: "Imports and leasing",
          body: "Timelines, transport, registration, warranty, deposits, and monthly payments depend on the selected vehicle and service. They apply only after explicit confirmation; finance may be provided by a separate partner subject to that partner's approval.",
        },
        {
          heading: "Prices and availability",
          body: "Prices, indicative monthly payments, delivery times, and availability can change. Day & Night will confirm the final price, included taxes and fees, warranty, and delivery in writing.",
        },
        {
          heading: "Use of the website",
          body: "Do not use the site for unlawful activity, automated extraction, interference with security, or abuse of contact forms. Use the contact page for questions about these terms.",
        },
      ],
});

const getFallbackLegalPage = (
  slug: string,
  isBg: boolean
): FallbackLegalPage | null => {
  if (slug === "privacy") {
    return getPrivacyFallback(isBg);
  }

  return slug === "terms" ? getTermsFallback(isBg) : null;
};

export const generateMetadata = async ({
  params,
}: LegalPageProperties): Promise<Metadata> => {
  const { locale, slug } = await params;
  const normalizedLocale = normalizeSeoLocale(locale);
  const isBg = normalizedLocale === "bg";
  const fallbackPage = getFallbackLegalPage(slug, isBg);
  if (!fallbackPage) {
    return {};
  }

  return createPublicLocalizedMetadata({
    baseUrl: getPublicWebBaseUrl(),
    description: fallbackPage.description,
    locale: normalizedLocale,
    path: `/legal/${slug}`,
    title: fallbackPage.title,
  });
};

export const generateStaticParams = (): { slug: string }[] =>
  fallbackLegalSlugs.map((slug) => ({ slug }));

const LegalPage = async ({ params }: LegalPageProperties) => {
  const { locale, slug } = await params;
  const normalizedLocale = normalizeSeoLocale(locale);
  const isBg = normalizedLocale === "bg";
  const fallbackPage = getFallbackLegalPage(slug, isBg);

  if (!fallbackPage) {
    notFound();
  }

  const { description, sections, title } = fallbackPage;

  return (
    <PublicMarketplaceFrame locale={normalizedLocale}>
      <main className="mx-auto min-h-[60dvh] max-w-5xl px-4 py-8 lg:px-6 lg:py-10">
        <Button
          asChild
          className="min-h-11 rounded-lg lg:min-h-0"
          size="sm"
          variant="secondary"
        >
          <Link href={getLocalizedPath(normalizedLocale, "/")}>
            <ArrowLeft aria-hidden="true" className="size-4" />
            {isBg ? "Към Day & Night" : "Back to Day & Night"}
          </Link>
        </Button>

        <article className="mt-3 rounded-xl border border-border bg-card p-5 sm:p-8">
          <header className="max-w-3xl border-border border-b pb-6">
            <span className="grid size-10 place-items-center rounded-full bg-secondary text-muted-foreground">
              <FileText aria-hidden="true" className="size-5" />
            </span>
            <h1 className="mt-4 text-balance font-semibold text-page-title tracking-tight sm:text-page-title-lg">
              {title}
            </h1>
            <p className="mt-3 text-muted-foreground leading-7">
              {description}
            </p>
          </header>

          <div className="mt-7 max-w-3xl space-y-7">
            {sections.map((section) => (
              <section key={section.heading}>
                <h2 className="font-semibold text-dialog-title">
                  {section.heading}
                </h2>
                <p className="mt-2 text-foreground/80 leading-7">
                  {section.body}
                </p>
              </section>
            ))}
            <p className="rounded-lg bg-secondary p-4 text-muted-foreground text-sm leading-6">
              {isBg
                ? "За въпрос относно поверителност, условията или конкретна заявка използвайте страницата за контакт."
                : "For a question about privacy, these terms, or a specific request, use the contact page."}{" "}
              <Link
                className="font-semibold text-foreground underline underline-offset-4"
                href={getLocalizedPath(normalizedLocale, "/contact")}
              >
                {isBg ? "Контакти" : "Contact"}
              </Link>
            </p>
          </div>
        </article>
      </main>
    </PublicMarketplaceFrame>
  );
};

export default LegalPage;
