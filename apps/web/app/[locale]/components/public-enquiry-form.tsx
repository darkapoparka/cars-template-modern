"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Label } from "@repo/design-system/components/ui/label";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { useActionState, useId } from "react";
import {
  type ContactActionState,
  submitContactRequest,
} from "../contact/actions/contact";
import { PublicContactFields } from "./public-contact-fields";

const initialState: ContactActionState = { status: "idle" };
const copy = {
  bg: {
    name: "Име",
    namePlaceholder: "Вашето име",
    phone: "Телефон",
    phonePlaceholder: "Телефон за обратна връзка",
    email: "Имейл (по желание)",
    emailPlaceholder: "name@email.com",
    message: "Вашето запитване",
    send: "Изпратете запитване",
    sending: "Изпращане…",
    title: "Пишете на екипа",
    description:
      "Оставете данни за връзка и опишете с какво можем да помогнем.",
  },
  en: {
    name: "Name",
    namePlaceholder: "Your name",
    phone: "Phone",
    phonePlaceholder: "Contact phone number",
    email: "Email (optional)",
    emailPlaceholder: "name@email.com",
    message: "Your enquiry",
    send: "Send enquiry",
    sending: "Sending…",
    title: "Contact the team",
    description: "Leave your contact details and tell us how we can help.",
  },
} as const;

/** Rendered only when the server has a configured delivery channel. No simulated success. */
export function PublicEnquiryForm({
  locale,
  intent = "general",
  initialMessage = "",
}: {
  locale: "bg" | "en";
  intent?: "general" | "finance" | "trade_in";
  initialMessage?: string;
}) {
  const [state, action, pending] = useActionState(
    submitContactRequest,
    initialState
  );
  const id = useId();
  const text = copy[locale];
  if (state.status === "success") {
    return (
      <output className="block rounded-xl border bg-card p-5 text-body text-foreground">
        {state.message}
      </output>
    );
  }
  return (
    <section
      aria-labelledby={`${id}-title`}
      className="rounded-2xl border bg-card p-5 text-foreground sm:p-6"
      data-slot="public-enquiry-form"
    >
      <h2
        className="font-semibold text-section-title tracking-heading"
        id={`${id}-title`}
      >
        {text.title}
      </h2>
      <p className="mt-2 text-body text-muted-foreground">{text.description}</p>
      <form action={action} className="mt-5 grid gap-4">
        <input name="locale" type="hidden" value={locale} />
        <input name="intent" type="hidden" value={intent} />
        <input name="topic" type="hidden" value="buyer" />
        <input name="company" type="hidden" value="" />
        <div aria-hidden="true" className="hidden">
          <label>
            Website
            <input
              autoComplete="off"
              name="website"
              tabIndex={-1}
              type="text"
            />
          </label>
        </div>
        <PublicContactFields
          copy={text}
          idPrefix={id}
          inputClassName="h-12 rounded-xl bg-control text-body"
          labelClassName="font-medium text-meta"
        />
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-message`}>{text.message}</Label>
          <Textarea
            className="min-h-28 rounded-xl bg-control text-body"
            defaultValue={initialMessage}
            id={`${id}-message`}
            maxLength={3000}
            minLength={20}
            name="message"
            required
          />
        </div>
        {state.status === "error" && (
          <p className="text-body text-destructive" role="alert">
            {state.message}
          </p>
        )}
        <Button
          className="h-12 rounded-xl bg-brand text-brand-foreground hover:bg-[var(--lead-site-accent-hover)] hover:text-[var(--brand-hover-foreground)]"
          disabled={pending}
          type="submit"
        >
          {pending ? text.sending : text.send}
        </Button>
      </form>
    </section>
  );
}
