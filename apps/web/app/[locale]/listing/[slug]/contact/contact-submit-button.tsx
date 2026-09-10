"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

interface ContactSubmitButtonProps {
  readonly describedBy: string;
  readonly idleLabel: string;
  readonly pendingLabel: string;
}

export const ContactSubmitButton = ({
  describedBy,
  idleLabel,
  pendingLabel,
}: ContactSubmitButtonProps) => {
  const { pending } = useFormStatus();

  return (
    <Button
      aria-busy={pending}
      aria-describedby={describedBy}
      className="h-11 w-full gap-2 sm:w-fit"
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <LoaderCircle
          aria-hidden="true"
          className="size-4 animate-spin motion-reduce:animate-none"
        />
      ) : null}
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
};
