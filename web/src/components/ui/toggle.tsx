"use client"

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/*
 * In PawConnect a toggle is a "chip": an outlined pill that fills with ink
 * when pressed. Used for filters (especie, perdido/encontrado) and quick
 * answers (cuándo lo viste, hacia dónde iba).
 */
const toggleVariants = cva(
  "group/toggle inline-flex items-center justify-center gap-1.5 rounded-full font-medium whitespace-nowrap transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        chip: "border border-line-strong bg-transparent text-ink hover:bg-surface aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-ground data-pressed:border-ink data-pressed:bg-ink data-pressed:text-ground",
        ghost: "bg-transparent text-ink hover:bg-surface aria-pressed:bg-surface data-pressed:bg-surface",
      },
      size: {
        default: "h-9 px-3.5 text-sm",
        lg: "h-11 px-4 text-[15px]",
      },
    },
    defaultVariants: {
      variant: "chip",
      size: "default",
    },
  }
)

function Toggle({
  className,
  variant = "chip",
  size = "default",
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
