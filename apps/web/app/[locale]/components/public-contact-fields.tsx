import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { publicContactLimits } from "../../../lib/public-contact-contract";

const contactFields = [
  { name: "name", type: "text", autoComplete: "name", required: true,
    minLength: publicContactLimits.name.min, maxLength: publicContactLimits.name.max },
  { name: "phone", type: "tel", autoComplete: "tel", required: true,
    minLength: publicContactLimits.phone.min, maxLength: publicContactLimits.phone.max },
  { name: "email", type: "email", autoComplete: "email", required: false,
    maxLength: publicContactLimits.email.max },
] as const;
type ContactField = (typeof contactFields)[number]["name"];

/** Shared contact controls; each form owns its layout, copy, state and submission. */
export function PublicContactFields({ copy, draft = {}, idPrefix, inputClassName, labelClassName }: {
  copy: Readonly<Record<ContactField | `${ContactField}Placeholder`, string>>;
  draft?: Readonly<Partial<Record<ContactField, string>>>;
  idPrefix: string;
  inputClassName: string;
  labelClassName: string;
}) {
  return contactFields.map((field) => (
    <div className="grid gap-1.5" key={field.name}>
      <Label className={labelClassName} htmlFor={`${idPrefix}-${field.name}`}>
        {copy[field.name]}
      </Label>
      <Input
        {...field}
        className={inputClassName}
        defaultValue={draft[field.name]}
        id={`${idPrefix}-${field.name}`}
        placeholder={copy[`${field.name}Placeholder`]}
      />
    </div>
  ));
}
