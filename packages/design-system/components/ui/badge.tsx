"use client"

import * as React from "react"
import { Slot as SlotPrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@repo/design-system/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-destructive/15 bg-destructive-surface text-destructive [a&]:hover:bg-destructive-surface/75 focus-visible:ring-destructive/20 dark:text-destructive-foreground dark:focus-visible:ring-destructive/40",
        success:
          "border-success/15 bg-success-surface text-success-foreground [a&]:hover:bg-success-surface/75",
        warning:
          "border-warning/20 bg-warning-surface text-warning-foreground [a&]:hover:bg-warning-surface/75",
        info:
          "border-info/15 bg-info-surface text-info-foreground [a&]:hover:bg-info-surface/75",
        outline:
          "border-border bg-card text-foreground [a&]:hover:bg-control-hover [a&]:hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? SlotPrimitive.Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
