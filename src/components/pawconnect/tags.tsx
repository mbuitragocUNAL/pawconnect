import { cn } from "cn"
import {
  caseStateLabel,
  reportTypeLabel,
  type CaseState as CaseStateValue,
  type ReportType,
} from "@/lib/domain"

const pill =
  "inline-flex h-[26px] items-center gap-[7px] rounded-full px-2.5 text-[13px] leading-none font-medium whitespace-nowrap"

/**
 * Report type. Its own code, separate from case state:
 * lost = magenta fill, found = ink fill, seen = ink outline (nobody has it).
 */
export function ReportTag({ type, className }: { type: ReportType; className?: string }) {
  return (
    <span
      data-type={type}
      className={cn(
        pill,
        type === "perdido" && "bg-lost text-ground",
        type === "encontrado" && "bg-found text-ground",
        type === "visto" && "bg-transparent text-ink shadow-[inset_0_0_0_1.5px_var(--ink)]",
        className
      )}
    >
      {reportTypeLabel[type]}
    </span>
  )
}

const stateStyle: Record<CaseStateValue | "urgente", string> = {
  activo: "bg-st-active-bg text-st-active",
  seguimiento: "bg-st-follow-bg text-st-follow",
  resuelto: "bg-st-solved-bg text-st-solved",
  cerrado: "bg-st-closed-bg text-st-closed",
  urgente: "bg-danger-bg text-danger",
}

/** Case state (RF-06): a tinted pill with a dot. "urgente" is only for 24 h emergencies. */
export function CaseState({
  state,
  children,
  className,
}: {
  state: CaseStateValue | "urgente"
  children?: React.ReactNode
  className?: string
}) {
  return (
    <span
      data-state={state}
      className={cn(
        pill,
        "before:size-[7px] before:rounded-full before:bg-current before:content-['']",
        stateStyle[state],
        className
      )}
    >
      {children ?? (state === "urgente" ? "Urgencias 24 h" : caseStateLabel[state])}
    </span>
  )
}
