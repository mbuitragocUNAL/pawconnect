import { cn } from "cn"
import type { Report } from "@/lib/domain"
import { CropFrame } from "./crop-frame"
import { ZoneMeta } from "./report-card"
import { ReportTag } from "./tags"

/**
 * Order is the only signal of similarity (RN-02): a position number and an
 * axis "más parecido → menos". Never a percentage, score or bar.
 */
export function SimilarityAxis({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 text-[13px] leading-none font-medium text-meta", className)}>
      Más parecido
      <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-ink to-line" />
      Menos
    </div>
  )
}

export function CandidateRow({
  position,
  report,
  selected,
  onSelect,
  className,
}: {
  /** 1 to 5. */
  position: number
  report: Report
  selected?: boolean
  onSelect?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected || undefined}
      className={cn(
        "flex w-full items-center gap-3 border-b border-line py-2.5 pr-2 pl-1 text-left transition-colors hover:bg-ink/[.03] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink",
        selected && "bg-action/[.06] shadow-[inset_3px_0_0_var(--action)]",
        className
      )}
    >
      <span className="w-[30px] shrink-0 text-center font-mono text-xl leading-none">
        {String(position).padStart(2, "0")}
      </span>
      <CropFrame src={report.photo} alt={report.alt} className="size-16 rounded-[12px]" sizes="64px" />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-heading text-[17px] leading-tight tracking-[-0.01em]">{report.title}</span>
        <ZoneMeta zone={report.zone} when={report.when} />
      </span>
      <ReportTag type={report.type} className="hidden sm:inline-flex" />
    </button>
  )
}
