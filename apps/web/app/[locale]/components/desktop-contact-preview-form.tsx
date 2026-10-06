"use client";

import { withBasePath } from "@repo/internationalization/paths";
import { leadSite } from "@repo/marketplace";
import { ArrowUpRight } from "lucide-react";
import { useId, useState } from "react";
import styles from "./boxcar-desktop-pages.module.css";

/** Static desktop enquiry keeps the source form geometry without simulating delivery. */
export function DesktopContactPreviewForm({
  locale,
  initialMessage = "",
  intent,
  subject,
}: {
  locale: "bg" | "en";
  initialMessage?: string;
  intent: "general" | "finance";
  subject?: "viewing" | "sell";
}) {
  const id = useId();
  const [previewed, setPreviewed] = useState(false);
  const bg = locale === "bg";
  const text = (bulgarian: string, english: string) =>
    bg ? bulgarian : english;
  return (
    <form
      className={styles.form}
      data-slot="desktop-contact-preview-form"
      onChange={() => setPreviewed(false)}
      onSubmit={(event) => {
        event.preventDefault();
        setPreviewed(true);
      }}
    >
      <div className={styles.fields}>
        <label htmlFor={`${id}-name`}>
          <span>{text("Име и фамилия", "Full name")}</span>
          <input
            autoComplete="name"
            id={`${id}-name`}
            maxLength={120}
            name="name"
            placeholder={text("Вашето име", "Your name")}
            required
          />
        </label>
        <label htmlFor={`${id}-email`}>
          <span>{text("Имейл адрес", "Email address")}</span>
          <input
            autoComplete="email"
            id={`${id}-email`}
            maxLength={200}
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
        </label>
        <label htmlFor={`${id}-phone`}>
          <span>{text("Телефон (по желание)", "Phone (optional)")}</span>
          <input
            autoComplete="tel"
            id={`${id}-phone`}
            maxLength={32}
            name="phone"
            placeholder={text("Вашият телефон", "Your phone number")}
            type="tel"
          />
        </label>
        <label htmlFor={`${id}-interest`}>
          <span>{text("Интересувам се от", "I'm interested in")}</span>
          <select
            defaultValue={subject ?? (intent === "finance" ? "finance" : "car")}
            id={`${id}-interest`}
            name="interest"
          >
            <option value="car">
              {text("Покупка на автомобил", "Buying a car")}
            </option>
            <option value="viewing">
              {text("Оглед на автомобил", "Arranging a viewing")}
            </option>
            <option value="finance">{text("Финансиране", "Financing")}</option>
            <option value="sell">
              {text("Продажба на автомобил", "Selling a car")}
            </option>
          </select>
        </label>
      </div>
      <label className={styles.message} htmlFor={`${id}-message`}>
        <span>{text("Вашето съобщение", "Your message")}</span>
        <textarea
          defaultValue={initialMessage}
          id={`${id}-message`}
          maxLength={3000}
          name="message"
          placeholder={text("Как можем да помогнем?", "How can we help?")}
          required
        />
      </label>
      <button className={styles.submit} type="submit">
        {text("Преглед на запитването", "Preview enquiry")}
        <ArrowUpRight aria-hidden size={20} />
      </button>
      {previewed && (
        <output className={styles.previewResult}>
          {text(
            "Това е преглед. Съобщение не е изпратено. За разговор с екипа: ",
            "This is a preview. No message was sent. Speak to our team: "
          )}
          <a href={withBasePath(leadSite.phoneHref)}>{leadSite.phoneDisplay}</a>
        </output>
      )}
    </form>
  );
}
