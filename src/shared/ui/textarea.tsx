import * as React from "react"
import { cn } from "@/shared/lib/cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-xl border border-transparent bg-gray-50 px-4 py-3 text-input-safe transition-[color,box-shadow] outline-none placeholder:text-gray-400 focus-visible:border-brand focus-visible:bg-white focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
