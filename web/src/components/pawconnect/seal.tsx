import { cn } from "cn"
import type { SealLevel } from "@/lib/domain"
import { Icon } from "./icon"

const levelText: Record<SealLevel, string> = {
  1: "Celular verificado",
  2: "Fundación verificada",
  3: "Prestador verificado",
}

/**
 * Verification seal (RF-14). Levels 1–3, plus "pending" while an admin
 * reviews the documents and "removed" when the seal was withdrawn (RF-16).
 */
export function Seal({
  level,
  status = "active",
  showLevel,
  className,
}: {
  level: SealLevel
  status?: "active" | "pending" | "removed"
  showLevel?: boolean
  className?: string
}) {
  const text =
    status === "pending"
      ? "Verificación en revisión"
      : status === "removed"
        ? "Sello retirado"
        : levelText[level]

  return (
    <span
      data-status={status}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full border border-line bg-ground pr-2.5 pl-1.5 text-[13px] leading-none font-medium whitespace-nowrap",
        status === "pending" && "border-dashed border-line-strong text-meta",
        status === "removed" && "border-danger/30 bg-danger-bg text-danger line-through decoration-1",
        className
      )}
    >
      <Icon
        name={status === "pending" ? "clock" : status === "removed" ? "x" : level === 1 ? "check" : "seal"}
        className="size-[18px]"
      />
      {text}
      {showLevel && status === "active" ? <small className="font-normal text-meta">nivel {level}</small> : null}
    </span>
  )
}
