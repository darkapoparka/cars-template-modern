"use server";

import { getReliableEmailDelivery } from "@repo/email";
import { ContactTemplate } from "@repo/email/templates/contact";
import { log } from "@repo/observability/log";
import { headers } from "next/headers";
import { env } from "@/env";
import { isPublicContactSubmissionAvailable } from "@/lib/public-contact-readiness";
import { getPublicRequestContext } from "@/lib/public-form-security";
import { enforcePublicSupportRateLimit } from "@/lib/public-support-rate-limit";
import {
  type PublicSupportRequest,
  submitPublicSupportRequest,
} from "@/lib/public-support-submission";

const topicLabels = {
  buyer: { bg: "Въпрос от купувач", en: "Buyer question" },
  dealer: {
    bg: "Запитване за автомобил",
    en: "Vehicle enquiry",
  },
  importer: { bg: "Запитване за внос", en: "Import request" },
  other: { bg: "Друг въпрос", en: "Other question" },
} as const;

export interface ContactActionState {
  message?: string;
  status: "error" | "idle" | "success";
}

const getCopy = (isBg: boolean, isImportRequest: boolean) => {
  const localized = (bg: string, en: string) => (isBg ? bg : en);
  return {
    invalid: isImportRequest
      ? localized(
          "Проверете телефона и добавете линк към обявата или данни за автомобила.",
          "Check the phone number and add a listing link or vehicle details."
        )
      : localized(
          "Проверете полетата и опишете запитването си с поне 20 знака.",
          "Check the fields and describe your request in at least 20 characters."
        ),
    notConfigured: isImportRequest
      ? localized(
          "Формата е готова, но каналът за съобщения още не е конфигуриран. Обадете се директно на Day & Night.",
          "The form is ready, but message delivery is not configured yet. Call Day & Night directly."
        )
      : localized(
          "Каналът за съобщения още не е конфигуриран. Обадете се директно на Day & Night.",
          "Message delivery is not configured yet. Call Day & Night directly."
        ),
    rateLimited: localized(
      "Достигнахте лимита за запитвания. Опитайте отново по-късно.",
      "You have reached the request limit. Please try again later."
    ),
    sendFailed: localized(
      "Съобщението не беше изпратено. Опитайте отново по-късно.",
      "The message could not be sent. Please try again later."
    ),
    success: localized(
      isImportRequest
        ? "Заявката е изпратена до екипа на Day & Night."
        : "Запитването е изпратено до екипа на Day & Night.",
      "Your request has been sent to the Day & Night team."
    ),
  };
};

const getImportDetailLines = (
  request: PublicSupportRequest,
  isBg: boolean
): string[] => {
  const localized = (bg: string, en: string) => (isBg ? bg : en);
  const lines: string[] = [];

  if (request.phone) {
    lines.push(`${localized("Телефон", "Phone")}: ${request.phone}`);
  }
  if (request.origin) {
    lines.push(`${localized("Произход", "Origin")}: ${request.origin}`);
  }
  if (request.sourceUrl) {
    lines.push(
      `${localized("Линк към обявата", "Listing URL")}: ${request.sourceUrl}`
    );
  }
  if (request.make) {
    lines.push(`${localized("Марка", "Make")}: ${request.make}`);
  }
  if (request.model) {
    lines.push(`${localized("Модел", "Model")}: ${request.model}`);
  }
  if (request.year) {
    lines.push(`${localized("Година", "Year")}: ${request.year}`);
  }
  if (request.mileage !== undefined) {
    lines.push(`${localized("Пробег", "Mileage")}: ${request.mileage} km`);
  }
  if (request.budget) {
    lines.push(`${localized("Бюджет", "Budget")}: ${request.budget}`);
  }

  return lines;
};

const getContactDetailLines = (
  request: PublicSupportRequest,
  isBg: boolean
): string[] => {
  const localized = (bg: string, en: string) => (isBg ? bg : en);
  const topic = topicLabels[request.topic];
  const lines = [
    `${localized("Тема", "Topic")}: ${localized(topic.bg, topic.en)}`,
  ];

  if (request.company) {
    lines.push(`${localized("Фирма", "Company")}: ${request.company}`);
  }
  if (request.context === "listing-delivery" && request.listing) {
    lines.push(`${localized("Обява", "Listing")}: ${request.listing}`);
  }
  if (request.context === "listing-delivery" && request.deliverTo) {
    lines.push(
      `${localized("Доставка до", "Deliver to")}: ${request.deliverTo}`
    );
  }
  if (request.context === "import-request") {
    lines.push(...getImportDetailLines(request, isBg));
  }

  lines.push(
    "",
    request.message ||
      localized("Няма допълнителни бележки.", "No additional notes.")
  );
  return lines;
};

export const submitContactRequest = async (
  _previousState: ContactActionState,
  formData: FormData
): Promise<ContactActionState> => {
  const isBg = formData.get("locale") === "bg";
  const isImportRequest = formData.get("context") === "import-request";
  const copy = getCopy(isBg, isImportRequest);
  const requestHeaders = await headers();
  const requestContext = getPublicRequestContext(requestHeaders);
  const result = await submitPublicSupportRequest(formData, requestContext, {
    available: isPublicContactSubmissionAvailable(),
    deliver: async (request, context) => {
      if (!env.RESEND_FROM) {
        throw new Error("Email provider is not configured");
      }
      const topic = topicLabels[request.topic];
      const detailLines = getContactDetailLines(
        request,
        request.locale === "bg"
      );
      return await getReliableEmailDelivery().deliver({
        ...context,
        payload: {
          from: env.RESEND_FROM,
          react: (
            <ContactTemplate
              email={request.email}
              message={detailLines.join("\n")}
              name={request.name}
            />
          ),
          ...(request.email ? { replyTo: request.email } : {}),
          subject: `Day & Night: ${topic.en}`,
          to: env.RESEND_FROM,
        },
      });
    },
    rateLimit: enforcePublicSupportRateLimit,
    report: (event, fields) => {
      if (event.endsWith("_sent") || event.endsWith("_suppressed")) {
        log.info(event, fields);
      } else if (
        event.endsWith("_rejected") ||
        event.endsWith("_rate_limited")
      ) {
        log.warn(event, fields);
      } else {
        log.error(event, fields);
      }
    },
  });

  if (result.status === "sent" || result.status === "suppressed") {
    return { message: copy.success, status: "success" };
  }
  if (result.status === "invalid") {
    return { message: copy.invalid, status: "error" };
  }
  if (result.status === "rate-limited") {
    return { message: copy.rateLimited, status: "error" };
  }
  if (result.status === "unavailable") {
    return { message: copy.notConfigured, status: "error" };
  }
  return { message: copy.sendFailed, status: "error" };
};
