import { cn } from "cn"
import type { CaseState } from "@/lib/domain"

const stateColour: Record<CaseState, string> = {
  activo: "text-st-active",
  seguimiento: "text-st-follow",
  resuelto: "text-st-solved",
  cerrado: "text-st-closed",
}

export type CaseEvent = {
  title: string
  /** Shown in mono: "12 nov · 18:40". */
  at: string
  /** ISO date for the <time> element. */
  dateTime?: string
  detail?: string
  state?: CaseState
  /** Filled dot = a change of state; hollow = activity. */
  milestone?: boolean
}

/** Case history (RF-06): every change carries its date. Newest first. */
export function CaseTimeline({ events, className }: { events: CaseEvent[]; className?: string }) {
  return (
    <ol className={cn("m-0 flex list-none flex-col p-0", className)}>
      {events.map((e, i) => (
        <li
          key={i}
          className="relative flex gap-3 pb-[18px] before:absolute before:top-5 before:bottom-0 before:left-2 before:w-px before:bg-line-strong before:content-[''] last:before:hidden"
        >
          <span
            aria-hidden
            className={cn(
              "mt-[3px] size-[17px] shrink-0 rounded-full border-2 border-current bg-ground",
              e.state ? stateColour[e.state] : "text-ink",
              e.milestone && "bg-current"
            )}
          />
          <div className="min-w-0">
            <strong className="block text-[15px] font-medium">{e.title}</strong>
            {e.detail ? <p className="text-sm text-meta">{e.detail}</p> : null}
            <time dateTime={e.dateTime} className="font-mono text-[13px] text-meta">
              {e.at}
            </time>
          </div>
        </li>
      ))}
    </ol>
  )
}
