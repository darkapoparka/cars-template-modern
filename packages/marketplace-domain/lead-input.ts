import { z } from "zod";
import { isoCountryCodeSchema } from "./inventory-contract";

const publicLeadContactShape = {
  buyerCountryCode: isoCountryCodeSchema.optional(),
  buyerLocale: z
    .string()
    .trim()
    .min(2)
    .max(35)
    .regex(/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i)
    .toLowerCase()
    .optional(),
  buyerName: z.string().trim().min(2).max(120),
  email: z.email().max(254).optional().or(z.literal("")),
  intent: z
    .enum(["availability", "finance", "test_drive", "trade_in", "general"])
    .default("general"),
  inquiryDedupeKey: z.uuid().optional(),
  message: z.string().trim().min(5).max(3000),
  phone: z.string().trim().min(7).max(32).optional().or(z.literal("")),
} as const;

const hasContactMethod = (value: { email?: string; phone?: string }) =>
  Boolean(value.email || value.phone);

const contactMethodIssue = {
  message: "Email or phone is required",
  path: ["email"],
};

export const publicLeadFormInputSchema = z
  .object({
    ...publicLeadContactShape,
    website: z.string().trim().max(120).default(""),
  })
  .refine(hasContactMethod, contactMethodIssue);

export const publicLeadInputSchema = z
  .object({
    ...publicLeadContactShape,
    listingId: z.string().trim().min(1).max(128),
  })
  .refine(hasContactMethod, {
    message: "Email or phone is required",
    path: ["email"],
  });

export type PublicLeadFormInput = z.infer<typeof publicLeadFormInputSchema>;
export type PublicLeadInput = z.infer<typeof publicLeadInputSchema>;
