import * as React from "react"
import { cn } from "@/shared/lib/cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-body shadow-[0_1px_2px_rgb(24_25_27/0.04)] transition-[border-color,box-shadow] outline-none placeholder:text-gray-400 focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/15 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
