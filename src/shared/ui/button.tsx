import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/lib/cn"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full text-sub font-semibold transition-[background-color,transform,box-shadow] duration-150 active:scale-[0.97] whitespace-nowrap outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // 잉크 알약: 위쪽 빛 + 아래 깊이로 두툼하게
        default:
          "bg-gray-900 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.14),inset_0_-2px_0_rgb(0_0_0/0.35),0_2px_6px_-1px_rgb(24_25_27/0.3)] hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none disabled:opacity-100",
        brand: "bg-brand text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18),inset_0_-2px_0_rgb(0_0_40/0.25)] hover:bg-brand-600",
        destructive: "bg-gray-100 text-destructive hover:bg-red-50",
        outline: "bg-white text-gray-900 shadow-[inset_0_0_0_1px_var(--color-gray-200)] hover:bg-gray-50",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
        plain: "rounded-none font-normal text-brand hover:bg-gray-100",
        ghost: "text-gray-700 hover:bg-gray-100 active:bg-gray-200",
        link: "text-gray-600 underline underline-offset-4",
      },
      size: {
        default: "h-10 px-4 has-[>svg]:px-3.5",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 px-3 text-caption has-[>svg]:px-2.5",
        lg: "h-cta px-5 text-body font-semibold has-[>svg]:px-4",
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
