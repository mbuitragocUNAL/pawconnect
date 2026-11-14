import { cn } from "cn"

/**
 * The person decides (RN-01). The decision sits fixed at the bottom of the
 * phone screen, always in reach of the thumb, and inline on wide screens.
 * Put a tonal "No es" and ONE primary action inside.
 */
export function DecisionBar({
  children,
  hint,
  className,
}: {
  children: React.ReactNode
  hint?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 -mx-4 flex flex-col gap-2 border-t border-line bg-ground px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] desk:static desk:mx-0 desk:border-0 desk:bg-transparent desk:p-0",
        className
      )}
    >
      {hint ? <p className="text-center text-[13px] text-meta desk:text-left">{hint}</p> : null}
      <div className="grid grid-cols-2 gap-2 desk:flex desk:justify-start">{children}</div>
    </div>
  )
}
