import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/lib/cn"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg text-body font-bold transition-colors duration-100 whitespace-nowrap outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-brand text-white hover:bg-brand-600 active:bg-brand-600 disabled:bg-gray-200 disabled:text-gray-500 disabled:opacity-100",
        brand: "bg-brand text-white hover:bg-brand-600 active:bg-brand-600",
        destructive: "bg-destructive text-white active:opacity-80",
        outline: "border border-gray-300 bg-white text-gray-900 active:bg-gray-100",
        secondary: "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 active:bg-gray-100",
        plain: "rounded-none font-normal text-brand hover:bg-gray-100",
        ghost: "font-semibold text-brand hover:bg-brand-50",
        link: "text-gray-600 underline underline-offset-4",
      },
      size: {
        default: "h-tap px-4 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 rounded-full px-3 text-sub has-[>svg]:px-2.5",
        lg: "h-cta rounded-lg px-6 text-body font-bold has-[>svg]:px-4",
        icon: "size-tap",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
