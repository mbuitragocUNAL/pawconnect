import { cn } from "cn"
import { Icon } from "./icon"

/**
 * A phone number with only the last two digits visible, until both
 * parties accept (RN-05, RF-07). Pass `revealed` with the full number after that.
 */
export function MaskedPhone({
  lastDigits,
  revealed,
  className,
}: {
  /** Last two digits, e.g. "47". */
  lastDigits: string
  /** Full number, shown only when both keys are turned. */
  revealed?: string
  className?: string
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-mono text-base leading-none font-medium tracking-[.02em] whitespace-nowrap", className)}>
      <Icon name={revealed ? "check" : "lock"} className="size-4" />
      {revealed ?? (
        <span aria-label={`Número oculto, termina en ${lastDigits}`}>+57 3•• ••• ••{lastDigits}</span>
      )}
    </span>
  )
}

export type KeyParty = {
  name: string
  role: string
  accepted: boolean
}

/**
 * The two keys: the contact opens only when both sides turn theirs.
 * Shows who has accepted and who we are waiting for.
 */
export function ContactKeys({
  me,
  other,
  className,
}: {
  me: KeyParty
  other: KeyParty
  className?: string
}) {
  return (
    <ol className={cn("flex flex-col gap-2", className)} aria-label="Aceptación del contacto">
      {[me, other].map((p) => (
        <li key={p.role} className="flex items-center gap-3 rounded-tile border border-line bg-paper px-3.5 py-3">
          {p.accepted ? (
            <span className="grid size-[30px] shrink-0 place-items-center rounded-full bg-ink text-ground">
              <Icon name="check" className="size-4" />
            </span>
          ) : (
            <span className="grid size-[30px] shrink-0 place-items-center rounded-full border-[1.5px] border-dashed border-line-strong text-meta">
              <Icon name="clock" className="size-4" />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <strong className="block font-medium">{p.name}</strong>
            <span className="text-sm text-meta">{p.role}</span>
          </span>
          <span className={cn("text-sm font-medium", p.accepted ? "text-ink" : "text-meta")}>
            {p.accepted ? "Aceptó" : "Esperando"}
          </span>
        </li>
      ))}
    </ol>
  )
}
