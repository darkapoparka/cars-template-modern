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
  ChevronDown,
  LoaderCircle,
  Phone,
  Send,
} from "lucide-react";
import Link from "next/link";
import {
  type RefObject,
  useActionState,
  useEffect,
  useId,
  useState,
} from "react";
import { useFormStatus } from "react-dom";
import type { MobileFormDraft } from "../../components/mobile-form-draft";
import { PublicContactUnavailable } from "../../components/public-contact-unavailable";
import {
  type ContactActionState,
  submitContactRequest,
} from "../../contact/actions/contact";
import {
  ImportContactFields,
  ImportVehicleFields,
} from "./import-request-fields";
import {
  importRequestCopy,
  importRequestInputClassName,
} from "./import-request-policy";

interface ImportRequestFormProps {
  defaultOrigin: string;
  defaultSourceUrl: string;
  draft?: MobileFormDraft;
  embedded?: boolean;
  formRef?: RefObject<HTMLFormElement | null>;
  locale: "bg" | "en";
  privacyHref: string;
  submissionAvailable: boolean;
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
        <p className="mt-2 max-w-md text-body text-muted-foreground">
          {message} {text.successDescription}
        </p>
        <a
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[var(--lead-site-accent)] px-5 font-semibold text-compact-control text-white transition-colors hover:bg-[var(--lead-site-accent-hover)] focus-visible:outline-2 focus-visible:outline-[var(--lead-site-accent)] focus-visible:outline-offset-3"
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
  submissionAvailable,
}: ImportRequestFormProps) => {
  const text = importRequestCopy[locale];
  const [sourceUrl, setSourceUrl] = useState(
    draft.sourceUrl ?? defaultSourceUrl
  );
  const hasSource = Boolean(sourceUrl.trim());
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [state, formAction] = useActionState(
    (previousState: ContactActionState, formData: FormData) =>
      submitImportRequest(previousState, formData, locale),
    initialState
  );

  const contactFields = submissionAvailable ? (
    <ImportContactFields draft={draft} key="contact" locale={locale} />
  ) : null;
  const vehicleFields = (
    <ImportVehicleSection
      defaultOrigin={defaultOrigin}
      draft={draft}
      key="vehicle"
      locale={locale}
      ready={ready}
      sourceUrl={sourceUrl}
    />
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
        {submissionAvailable ? (
          <CardDescription className="max-w-2xl text-body lg:mx-auto lg:text-center">
            {hasSource ? text.attachedDescription : text.formDescription}
          </CardDescription>
        ) : (
          <PublicContactUnavailable locale={locale} />
        )}
      </CardHeader>

      <CardContent
        className={embedded ? "px-4 pb-4" : "px-5 pb-5 sm:px-7 sm:pb-7"}
      >
        <form
          action={submissionAvailable ? formAction : undefined}
          className="flex flex-col gap-4"
          data-slot="import-request-form"
          onSubmit={(event) => {
            if (!submissionAvailable) {
              event.preventDefault();
            }
          }}
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

          <ImportAttachedLink
            locale={locale}
            onChange={setSourceUrl}
            ready={ready}
            sourceUrl={sourceUrl}
          />
          {hasSource
            ? [contactFields, vehicleFields]
            : [vehicleFields, contactFields]}

          {submissionAvailable ? (
            <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-xl text-meta text-muted-foreground">
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
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
};

const ImportAttachedLink = ({
  locale,
  onChange,
  ready,
  sourceUrl,
}: {
  locale: "bg" | "en";
  onChange: (value: string) => void;
  ready: boolean;
  sourceUrl: string;
}) => {
  const text = importRequestCopy[locale];
  const [editingSource, setEditingSource] = useState(false);
  const sourceId = useId();
  const hasSource = Boolean(sourceUrl.trim());
  return (
    <div className="grid gap-1.5" data-slot="import-attached-link">
      {hasSource && !editingSource ? (
        <div className="flex min-w-0 items-center gap-2 rounded-xl bg-zinc-100 px-3">
          <div className="min-w-0 flex-1 py-2">
            <p className="text-micro text-zinc-600">{text.attachedLink}</p>
            <p className="truncate text-meta text-zinc-950" title={sourceUrl}>
              {sourceUrl}
            </p>
          </div>
          <button
            className="min-h-11 shrink-0 rounded-lg px-2 font-semibold text-compact-control underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
            disabled={!ready}
            onClick={() => {
              setEditingSource(true);
              requestAnimationFrame(() =>
                document.getElementById(sourceId)?.focus()
              );
            }}
            type="button"
          >
            {text.editLink}
          </button>
        </div>
      ) : null}
      <div className={hasSource && !editingSource ? "hidden" : "grid gap-1.5"}>
        <Label className="text-meta" htmlFor={sourceId}>
          {text.sourceUrl}
        </Label>
        <Input
          className={importRequestInputClassName}
          id={sourceId}
          inputMode="url"
          maxLength={500}
          name="sourceUrl"
          onChange={(event) => {
            setEditingSource(true);
            onChange(event.target.value);
          }}
          onInvalid={() => setEditingSource(true)}
          placeholder={text.sourceUrlPlaceholder}
          readOnly={!ready}
          type="url"
          value={sourceUrl}
        />
      </div>
    </div>
  );
};

const ImportVehicleSection = ({
  defaultOrigin,
  draft,
  locale,
  ready,
  sourceUrl,
}: {
  defaultOrigin: string;
  draft: MobileFormDraft;
  locale: "bg" | "en";
  ready: boolean;
  sourceUrl: string;
}) => {
  const text = importRequestCopy[locale];
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsId = useId();
  const hasSource = Boolean(sourceUrl.trim());
  return (
    <div>
      {hasSource ? (
        <button
          aria-controls={detailsId}
          aria-expanded={detailsOpen}
          className="flex min-h-11 w-full items-center justify-between rounded-lg text-left font-medium text-compact-control focus-visible:outline-2 focus-visible:outline-ring lg:hidden"
          disabled={!ready}
          onClick={() => setDetailsOpen((value) => !value)}
          type="button"
        >
          {text.additionalDetails}
          <ChevronDown
            aria-hidden="true"
            className={`size-4 shrink-0 ${detailsOpen ? "rotate-180" : ""}`}
          />
        </button>
      ) : (
        <p className="mb-3 text-meta text-zinc-600">
          {text.vehicleRequirement}
        </p>
      )}
      <div
        className={hasSource && !detailsOpen ? "hidden lg:block" : "block"}
        id={detailsId}
        onInvalidCapture={(event) => {
          if (hasSource && !detailsOpen) {
            const field = event.target as HTMLInputElement;
            setDetailsOpen(true);
            requestAnimationFrame(() => {
              field.focus();
              field.reportValidity();
            });
          }
        }}
      >
        <ImportVehicleFields
          defaultOrigin={draft.origin ?? defaultOrigin}
          draft={draft}
          locale={locale}
          sourceUrl={sourceUrl}
        />
      </div>
    </div>
  );
};
