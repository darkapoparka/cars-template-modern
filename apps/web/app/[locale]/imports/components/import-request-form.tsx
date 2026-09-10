"use client";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@repo/design-system/components/ui/alert";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@repo/design-system/components/ui/card";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { cn } from "@repo/design-system/lib/utils";
import { leadSite } from "@repo/marketplace";
import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  Phone,
  Send,
} from "lucide-react";
import Link from "next/link";
import { type RefObject, useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { MobileFormDraft } from "../../components/mobile-form-draft";
import {
  type ContactActionState,
  submitContactRequest,
} from "../../contact/actions/contact";
import {
  ImportContactFields,
  ImportVehicleFields,
} from "./import-request-fields";
import { importRequestCopy } from "./import-request-policy";

interface ImportRequestFormProps {
  defaultOrigin: string;
  defaultSourceUrl: string;
  draft?: MobileFormDraft;
  embedded?: boolean;
  formRef?: RefObject<HTMLFormElement | null>;
  locale: "bg" | "en";
  privacyHref: string;
}

const initialState: ContactActionState = { status: "idle" };

const submitImportRequest = (
  previousState: ContactActionState,
  formData: FormData,
  locale: "bg" | "en"
) => {
  formData.set("locale", locale);
  formData.set("context", "import-request");
  formData.set("deliverTo", "BG");
  formData.set("topic", "importer");
  return submitContactRequest(previousState, formData);
};

const ImportRequestSubmitButton = ({ locale }: { locale: "bg" | "en" }) => {
  const { pending } = useFormStatus();
  const text = importRequestCopy[locale];

  return (
    <Button
      className="h-11 w-full gap-2 rounded-lg bg-[var(--lead-site-accent)] px-5 text-white shadow-none hover:bg-[var(--lead-site-accent-hover)] hover:text-white sm:w-auto"
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
      ) : (
        <Send aria-hidden="true" className="size-4" />
      )}
      {pending ? text.sending : text.send}
    </Button>
  );
};

const ImportRequestSuccess = ({
  locale,
  message,
}: {
  locale: "bg" | "en";
  message: string;
}) => {
  const text = importRequestCopy[locale];

  return (
    <Card
      className="rounded-xl border-0 bg-card py-0 shadow-none lg:border lg:border-border/80 lg:shadow-2xl lg:shadow-black/20"
      data-slot="import-request-success"
    >
      <CardContent className="flex min-h-[25rem] flex-col items-center justify-center p-6 text-center sm:p-10">
        <span className="grid size-14 place-items-center rounded-full bg-[var(--lead-site-accent-soft)] text-[var(--lead-site-accent)]">
          <CheckCircle2 aria-hidden="true" className="size-7" />
        </span>
        <h2 className="mt-5 font-semibold text-section-title tracking-tight">
          {text.successTitle}
        </h2>
        <p className="mt-2 max-w-md text-muted-foreground text-sm leading-6">
          {message} {text.successDescription}
        </p>
        <a
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[var(--lead-site-accent)] px-5 font-semibold text-sm text-white transition-colors hover:bg-[var(--lead-site-accent-hover)] focus-visible:outline-2 focus-visible:outline-[var(--lead-site-accent)] focus-visible:outline-offset-3"
          href={leadSite.phoneHref}
        >
          <Phone aria-hidden="true" className="size-4" />
          {leadSite.phoneDisplay}
        </a>
      </CardContent>
    </Card>
  );
};

export const ImportRequestForm = ({
  defaultOrigin,
  defaultSourceUrl,
  draft = {},
  embedded = false,
  formRef,
  locale,
  privacyHref,
}: ImportRequestFormProps) => {
  const text = importRequestCopy[locale];
  const [state, formAction] = useActionState(
    (previousState: ContactActionState, formData: FormData) =>
      submitImportRequest(previousState, formData, locale),
    initialState
  );

  if (state.status === "success") {
    return (
      <ImportRequestSuccess locale={locale} message={state.message ?? ""} />
    );
  }

  return (
    <Card
      className={cn(
        "rounded-xl border-0 bg-card py-0 shadow-none lg:border lg:border-border/80 lg:shadow-2xl lg:shadow-black/20",
        embedded && "gap-0 rounded-none"
      )}
      data-slot="import-request-form-card"
    >
      <CardHeader
        className={
          embedded
            ? "grid gap-2 px-4 pt-1 pb-4"
            : "grid gap-2 px-5 pt-5 pb-3 sm:px-7 sm:pt-7 sm:pb-4"
        }
      >
        <h2
          className={
            embedded
              ? "sr-only"
              : "font-semibold text-section-title tracking-tight sm:text-section-title-lg lg:text-center lg:text-page-title-lg"
          }
        >
          {text.formTitle}
        </h2>
        <CardDescription className="max-w-2xl text-sm leading-6 sm:text-base lg:mx-auto lg:text-center">
          {text.formDescription}
        </CardDescription>
      </CardHeader>

      <CardContent
        className={embedded ? "px-4 pb-4" : "px-5 pb-5 sm:px-7 sm:pb-7"}
      >
        <form
          action={formAction}
          className="grid gap-4"
          data-slot="import-request-form"
          ref={formRef}
        >
          <div
            aria-hidden="true"
            className="absolute -left-[10000px] h-px w-px overflow-hidden"
          >
            <Label htmlFor="import-website">Website</Label>
            <Input
              autoComplete="off"
              id="import-website"
              name="website"
              tabIndex={-1}
            />
          </div>

          {state.status === "error" ? (
            <Alert variant="destructive">
              <AlertCircle aria-hidden="true" />
              <AlertTitle>{text.errorTitle}</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <ImportVehicleFields
            defaultOrigin={draft.origin ?? defaultOrigin}
            defaultSourceUrl={draft.sourceUrl ?? defaultSourceUrl}
            draft={draft}
            locale={locale}
          />
          <ImportContactFields draft={draft} locale={locale} />

          <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-muted-foreground text-xs leading-5">
              {text.privacyPrefix}{" "}
              <Link
                className="font-medium text-foreground underline-offset-4 hover:underline"
                href={privacyHref}
              >
                {text.privacyText}
              </Link>
              .
            </p>
            <ImportRequestSubmitButton locale={locale} />
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
