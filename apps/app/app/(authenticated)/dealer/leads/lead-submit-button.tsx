"use client";
import { Button } from "@repo/design-system/components/ui/button";
import { useFormStatus } from "react-dom";

export const LeadSubmitButton = () => {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit">
      {pending ? "Запазване…" : "Запази промените"}
    </Button>
  );
};
