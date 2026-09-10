"use client";

import type { ModerationStatus } from "@repo/database";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/design-system/components/ui/alert-dialog";
import { Button } from "@repo/design-system/components/ui/button";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { transitionModerationReportAction } from "./actions";
import { moderationResolutionOptions } from "./moderation-transition-options";

interface ModerationTransitionControlsProperties {
  readonly reportId: string;
  readonly status: ModerationStatus;
}

interface PendingButtonProperties {
  readonly disabled?: boolean;
  readonly idleLabel: string;
  readonly variant?: "default" | "outline" | "secondary";
}

const PendingButton = ({
  disabled = false,
  idleLabel,
  variant = "default",
}: PendingButtonProperties) => {
  const { pending } = useFormStatus();

  return (
    <Button
      className="min-h-10 rounded-lg"
      disabled={disabled || pending}
      type="submit"
      variant={variant}
    >
      {pending ? "Записва се…" : idleLabel}
    </Button>
  );
};

const ReviewTransitionForm = ({ reportId }: { readonly reportId: string }) => (
  <form action={transitionModerationReportAction}>
    <input name="nextStatus" type="hidden" value="reviewing" />
    <input name="reportId" type="hidden" value={reportId} />
    <PendingButton idleLabel="Поеми прегледа" variant="secondary" />
  </form>
);

const PendingTerminalActions = ({
  confirmationLabel,
  resolutionSelected,
}: {
  readonly confirmationLabel: string;
  readonly resolutionSelected: boolean;
}) => {
  const { pending } = useFormStatus();

  return (
    <AlertDialogFooter>
      <AlertDialogCancel disabled={pending} type="button">
        Отказ
      </AlertDialogCancel>
      <Button
        className="min-h-10 rounded-lg"
        disabled={!resolutionSelected || pending}
        type="submit"
      >
        {pending ? "Записва се…" : confirmationLabel}
      </Button>
    </AlertDialogFooter>
  );
};

const TerminalTransitionDialog = ({
  nextStatus,
  reportId,
}: {
  readonly nextStatus: "dismissed" | "resolved";
  readonly reportId: string;
}) => {
  const [resolutionCode, setResolutionCode] = useState("");
  const reasonFieldId = useId();
  const isResolved = nextStatus === "resolved";
  const options = moderationResolutionOptions[nextStatus];
  const triggerLabel = isResolved ? "Маркирай като решен" : "Отхвърли сигнала";
  const confirmationLabel = isResolved
    ? "Потвърди решаването"
    : "Потвърди отхвърлянето";

  return (
    <AlertDialog
      onOpenChange={(open) => {
        if (!open) {
          setResolutionCode("");
        }
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          className="min-h-10 rounded-lg"
          type="button"
          variant={isResolved ? "default" : "outline"}
        >
          {triggerLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form action={transitionModerationReportAction} className="grid gap-4">
          <input name="nextStatus" type="hidden" value={nextStatus} />
          <input name="reportId" type="hidden" value={reportId} />
          <AlertDialogHeader>
            <AlertDialogTitle>{triggerLabel}?</AlertDialogTitle>
            <AlertDialogDescription>
              Това приключва сигнала и записва действието в одитния журнал.
              Изберете причина, преди да продължите.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2">
            <Label htmlFor={reasonFieldId}>Причина за решението</Label>
            <Select
              name="resolutionCode"
              onValueChange={setResolutionCode}
              required
              value={resolutionCode}
            >
              <SelectTrigger className="min-h-10 w-full" id={reasonFieldId}>
                <SelectValue placeholder="Изберете причина" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <PendingTerminalActions
            confirmationLabel={confirmationLabel}
            resolutionSelected={Boolean(resolutionCode)}
          />
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export const ModerationTransitionControls = ({
  reportId,
  status,
}: ModerationTransitionControlsProperties) => {
  if (status !== "new" && status !== "reviewing") {
    return null;
  }

  return (
    <>
      {status === "new" ? <ReviewTransitionForm reportId={reportId} /> : null}
      <TerminalTransitionDialog nextStatus="dismissed" reportId={reportId} />
      <TerminalTransitionDialog nextStatus="resolved" reportId={reportId} />
    </>
  );
};
