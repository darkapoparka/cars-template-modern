"use client";

import { MobileServiceHelp } from "../components/mobile-service-help";

export function LeaseInformationDrawer({
  faqs,
  locale,
}: {
  faqs: readonly { question: string; answer: string }[];
  locale: "bg" | "en";
}) {
  const title = locale === "bg" ? "Как работи лизингът" : "How financing works";
  const steps =
    locale === "bg"
      ? [
          ["Изберете автомобил", "Разгледайте наличните модели."],
          [
            "Задайте срок и вноска",
            "Това са предпочитания за заявката. Показаната месечна сума е ориентировъчна и не се преизчислява.",
          ],
          ["Обсъдете офертата", "Ще уточним възможностите и условията."],
        ]
      : [
          ["Choose a car", "Browse the available models."],
          [
            "Set your term and deposit",
            "These are request preferences. The displayed monthly estimate does not recalculate.",
          ],
          [
            "Discuss your offer",
            "We’ll discuss financing availability and terms.",
          ],
        ];

  return (
    <MobileServiceHelp
      description={
        locale === "bg"
          ? "Заявка, условия и необходими документи."
          : "Requests, terms and required documents."
      }
      faqs={faqs}
      locale={locale}
      steps={steps.map(([stepTitle, description]) => ({
        title: stepTitle,
        description,
      }))}
      title={title}
    />
  );
}
