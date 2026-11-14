import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/*
 * PawConnect buttons are pills.
 * - primary: magenta, ONE per view (the main action).
 * - tonal: the quiet partner next to primary.
 * - outline / ghost / link: everything else.
 * - danger: only for destructive confirmations (delete account, reject photo).
 * Default height is 48px so it is a comfortable thumb target on phones.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-transparent font-medium whitespace-nowrap outline-none select-none transition-[transform,background-color,color] duration-200 ease-out hover:-translate-y-px active:not-aria-[haspopup]:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:pointer-events-none disabled:opacity-45 aria-invalid:border-danger [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        primary: "bg-action text-action-ink hover:bg-action-hover",
        tonal: "bg-surface text-ink hover:bg-surface-hover",
        outline: "border-line-strong bg-transparent text-ink hover:bg-surface",
        ghost: "bg-transparent text-ink hover:bg-surface",
        ink: "bg-ink text-ground hover:bg-ink/90",
        danger: "bg-danger text-white hover:bg-danger/90",
        link: "h-auto rounded-none px-0 text-ink underline decoration-line-strong underline-offset-4 hover:translate-y-0 hover:decoration-ink",
      },
      size: {
        default: "h-12 px-[22px] text-base",
        sm: "h-10 px-4 text-[15px]",
        lg: "h-14 px-7 text-[17px]",
        icon: "size-11 p-0",
        "icon-sm": "size-9 p-0 [&_svg:not([class*='size-'])]:size-4",
      },
      block: {
        true: "w-full",
      },
    },
    compoundVariants: [{ variant: "link", className: "h-auto px-0" }],
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "primary",
  size = "default",
  block,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, block, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
