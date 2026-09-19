import { cva, type VariantProps } from "class-variance-authority";

export const typographyVariants = cva("", {
  variants: {
    role: {
      body: "font-normal text-body",
      cardTitle:
        "font-semibold text-card-title tracking-heading lg:text-card-title-lg",
      compactControl: "font-medium text-compact-control",
      display: "font-semibold text-display tracking-heading lg:text-display-lg",
      eyebrow: "font-semibold text-micro uppercase tracking-label",
      meta: "font-normal text-meta",
      micro: "font-medium text-micro",
      pageTitle:
        "font-semibold text-page-title tracking-heading lg:text-page-title-lg",
      price: "font-semibold text-price tracking-heading lg:text-price-lg",
      sectionTitle:
        "font-semibold text-section-title tracking-heading lg:text-section-title-lg",
    },
    tone: {
      default: "text-foreground",
      inherit: "text-inherit",
      muted: "text-muted-foreground",
    },
    wrap: {
      balance: "text-balance",
      normal: "",
      pretty: "text-pretty",
      truncate: "truncate",
    },
  },
  defaultVariants: {
    role: "body",
    tone: "default",
    wrap: "normal",
  },
});

export type TypographyVariantProps = VariantProps<typeof typographyVariants>;

export type TypographyRole = NonNullable<TypographyVariantProps["role"]>;
