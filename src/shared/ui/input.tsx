import * as React from "react"
import { cn } from "@/shared/lib/cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 text-body shadow-[0_1px_2px_rgb(24_25_27/0.04)] transition-[border-color,box-shadow] outline-none placeholder:text-gray-400 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/15 focus-visible:outline-none",
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15",
        className
      )}
      {...props}
    />
  )
}

export { Input }
