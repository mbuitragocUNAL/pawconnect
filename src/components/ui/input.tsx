import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

/* 48px tall, 16px text (stops iOS from zooming the page on focus). */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-field border border-line-strong bg-paper px-3.5 text-base text-ink transition-colors outline-none placeholder:text-soft focus-visible:border-ink focus-visible:ring-3 focus-visible:ring-ink/15 disabled:cursor-not-allowed disabled:bg-surface disabled:opacity-60 aria-invalid:border-danger aria-invalid:ring-3 aria-invalid:ring-danger/15",
        className
      )}
      {...props}
    />
  )
}

export { Input }
