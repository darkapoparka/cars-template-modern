"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Label } from "@repo/design-system/components/ui/label";
import { leadSite } from "@repo/marketplace/lead-site";
import { getMobileQuickPillClassName } from "@repo/marketplace-ui";
import {
  CarFront,
  CheckCircle2,
  ChevronRight,
  LoaderCircle,
  Phone,
} from "lucide-react";
import { type RefObject, useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { toFinancingContactFormData } from "../../../lib/financing-contact-payload";
import {
  type ContactActionState,
  submitContactRequest,
} from "../contact/actions/contact";
import {
  buildFinancingContactMessage,
  type FinancingRequest,
  financingDepositOptions,
  financingRequestCopy,
  financingTermOptions,
} from "./mobile-financing-policy";
import type { MobileFormDraft } from "./mobile-form-draft";
import { PublicContactFields } from "./public-contact-fields";
import { PublicContactUnavailable } from "./public-contact-unavailable";

const initialState: ContactActionState = { status: "idle" };
const submitFinancingRequest = (
  previous: ContactActionState,
  draft: FormData
) => submitContactRequest(previous, toFinancingContactFormData(draft));

const SubmitButton = ({ locale }: { locale: "bg" | "en" }) => {
  const { pending } = useFormStatus();
  const copy = financingRequestCopy[locale];

  return (
    <Button
      className="h-12 w-full rounded-xl bg-[var(--lead-site-accent)] font-semibold text-[15px] text-white shadow-none hover:bg-[var(--lead-site-accent-hover)] active:bg-[var(--lead-site-accent-hover)]"
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <LoaderCircle aria-hidden="true" className="size-[18px] animate-spin" />
      ) : null}
      {pending ? copy.sending : copy.send}
      {pending ? null : <ChevronRight aria-hidden="true" className="size-4" />}
    </Button>
  );
};

export const FinancingRequestForm = ({
  draft,
  formRef,
  locale,
  request,
  submissionAvailable,
}: {
  draft: MobileFormDraft;
  formRef: RefObject<HTMLFormElement | null>;
  locale: "bg" | "en";
  request: FinancingRequest;
  submissionAvailable: boolean;
}) => {
  const copy = financingRequestCopy[locale];
  const [deposit, setDeposit] = useState(
    draft.deposit ?? request.deposit ?? "flexible"
  );
  const [term, setTerm] = useState(draft.term ?? request.term);
  const [note, setNote] = useState(draft.note ?? "");
  const [state, formAction] = useActionState(
    submitFinancingRequest,
    initialState
  );
  const message = buildFinancingContactMessage({
    deposit,
    locale,
    note,
    request: { ...request, term },
  });

  if (!submissionAvailable) {
    return (
      <div className="overflow-y-auto px-4 pb-6">
        <p className="mb-4 font-semibold text-[16px]">{request.vehicle}</p>
        <PublicContactUnavailable locale={locale} />
      </div>
    );
  }

  if (state.status === "success") {
    return (
      <div
        className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center"
        data-slot="mobile-financing-success"
      >
        <span className="grid size-12 place-items-center rounded-full bg-zinc-950 text-white">
          <CheckCircle2 aria-hidden="true" className="size-6" />
        </span>
        <h3 className="mt-4 font-semibold text-[20px] leading-6">
          {copy.success}
        </h3>
        <p className="mt-2 max-w-xs text-[15px] text-zinc-600 leading-6">
          {copy.successBody}
        </p>
        <Button
          asChild
          className="mt-5 h-11 rounded-xl bg-zinc-950 px-5 text-white shadow-none hover:bg-black"
        >
          <a href={leadSite.phoneHref}>
            <Phone aria-hidden="true" className="size-4" />
            {copy.call}
          </a>
        </Button>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      data-slot="mobile-financing-form"
      ref={formRef}
    >
      <input name="locale" type="hidden" value={locale} />
      <input name="company" type="hidden" value="" />
      <input name="topic" type="hidden" value="buyer" />
      <input name="website" type="hidden" value="" />
      <input name="message" type="hidden" value={message} />
      <input name="term" type="hidden" value={term} />
      <input name="deposit" type="hidden" value={deposit} />

      <div className="rounded-2xl bg-zinc-100 p-3.5">
        <p className="font-medium text-[12px] text-zinc-600">{copy.vehicle}</p>
        <div className="mt-2 flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-zinc-700">
            <CarFront aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 break-words font-semibold text-[16px] text-zinc-950 leading-5">
              {request.vehicle}
            </p>
          </div>
        </div>
      </div>

      <fieldset className="mt-5" data-slot="financing-term-options">
        <legend className="font-medium text-[13px] text-zinc-800">
          {locale === "bg" ? "Предпочитан срок" : "Preferred term"}
        </legend>
        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto overscroll-x-contain">
          {financingTermOptions.map((value) => (
            <button
              aria-pressed={term === value}
              className={getMobileQuickPillClassName(term === value)}
              key={value}
              onClick={() => setTerm(value)}
              type="button"
            >
              {value === "flexible"
                ? copy.flexible
                : `${value} ${locale === "bg" ? "мес." : "mo."}`}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5" data-slot="financing-deposit-options">
        <legend className="font-medium text-[13px] text-zinc-800">
          {copy.deposit}
        </legend>
        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto overscroll-x-contain">
          {financingDepositOptions.map((value) => {
            const active = deposit === value;
            const label = value === "flexible" ? copy.flexible : `${value}%`;

            return (
              <button
                aria-pressed={active}
                className={getMobileQuickPillClassName(active)}
                key={value}
                onClick={() => setDeposit(value)}
                type="button"
              >
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-5 grid gap-4">
        <PublicContactFields
          copy={copy}
          draft={draft}
          idPrefix="finance"
          inputClassName="h-12 rounded-xl border-0 bg-zinc-100 px-3.5 text-[16px] shadow-none focus-visible:ring-zinc-900/25"
          labelClassName="font-medium text-[13px]"
        />

        <div className="grid gap-1.5">
          <Label className="font-medium text-[13px]" htmlFor="finance-note">
            {copy.note}
          </Label>
          <textarea
            className="min-h-24 resize-none rounded-xl border-0 bg-zinc-100 px-3.5 py-3 text-[16px] leading-6 outline-none placeholder:text-zinc-500 focus:ring-[3px] focus:ring-zinc-900/20"
            id="finance-note"
            maxLength={500}
            name="note"
            onChange={(event) => setNote(event.target.value)}
            placeholder={copy.notePlaceholder}
            value={note}
          />
        </div>
      </div>

      {state.status === "error" ? (
        <p
          className="mt-4 rounded-xl bg-red-50 px-3.5 py-3 text-[13px] text-red-800 leading-5"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}

      <div className="mt-6">
        <SubmitButton locale={locale} />
        <a
          className="mt-2 flex h-11 items-center justify-center gap-2 rounded-xl font-semibold text-[14px] text-zinc-700 transition-colors active:bg-zinc-100"
          href={leadSite.phoneHref}
        >
          <Phone aria-hidden="true" className="size-4" />
          {copy.call}
        </a>
      </div>
    </form>
  );
};
