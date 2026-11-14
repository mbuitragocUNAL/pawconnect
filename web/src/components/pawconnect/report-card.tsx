import Link from "next/link"
import { cn } from "cn"
import type { Report } from "@/lib/domain"
import { CropFrame } from "./crop-frame"
import { Icon } from "./icon"
import { ReportTag } from "./tags"

/** "Chapinero · hace 1 día", with the zone icon. Never an address. */
export function ZoneMeta({ zone, when, className }: { zone: string; when?: string; className?: string }) {
  return (
    <span
      className={cn(
        "flex min-w-0 items-center gap-1.5 text-sm text-meta",
        className
      )}
    >
      <Icon name="zone" className="size-4" />
      <span className="truncate">
        {zone}
        {when ? ` · ${when}` : null}
      </span>
    </span>
  )
}

const lift =
  "transition-[transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"

/** Compact row: thumbnail left, text right. For lists and map overlays. */
export function ReportRow({ report, href, className }: { report: Report; href: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3.5 rounded-tile border border-line bg-paper p-2.5 no-underline",
        lift,
        className
      )}
    >
      <CropFrame src={report.photo} alt={report.alt} className="size-[72px] rounded-[12px]" sizes="72px" />
      <span className="flex min-w-0 flex-col gap-1">
        <span>
          <ReportTag type={report.type} />
        </span>
        <span className="font-heading text-[17px] leading-tight tracking-[-0.01em]">{report.title}</span>
        <ZoneMeta zone={report.zone} when={report.when} />
      </span>
    </Link>
  )
}

/** Tall card: big photo on top. For grids. */
export function ReportCard({ report, href, className }: { report: Report; href: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col overflow-hidden rounded-panel border border-line bg-paper no-underline",
        lift,
        className
      )}
    >
      <CropFrame
        src={report.photo}
        alt={report.alt}
        large
        className="h-[200px] w-full rounded-none [&_img]:transition-transform [&_img]:duration-300 group-hover:[&_img]:scale-[1.03]"
        sizes="(min-width: 960px) 300px, 50vw"
      />
      <span className="flex flex-col gap-1.5 p-4">
        <span>
          <ReportTag type={report.type} />
        </span>
        <span className="font-heading text-xl leading-tight tracking-[-0.02em]">{report.title}</span>
        <ZoneMeta zone={report.zone} when={report.when} />
      </span>
    </Link>
  )
}
