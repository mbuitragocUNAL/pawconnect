"use client"

import { useId } from "react"
import { cn } from "cn"
import { Icon } from "./icon"

/** Label + control + help text, stacked. */
export function Field({
  label,
  help,
  error,
  children,
  htmlFor,
  className,
}: {
  label: string
  help?: string
  error?: string
  htmlFor?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm leading-snug font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p className="flex items-center gap-1.5 text-[13px] text-danger" role="alert">
          <Icon name="alert" className="size-4" />
          {error}
        </p>
      ) : help ? (
        <p className="text-[13px] text-meta">{help}</p>
      ) : null}
    </div>
  )
}

/**
 * Consent card (section 4.1, RNF-04). Always starts unchecked: there is no
 * `defaultChecked` on purpose. Pass `checked` + `onCheckedChange` to control it.
 */
export function Consent({
  title,
  children,
  checked,
  onCheckedChange,
  className,
}: {
  title: string
  children?: React.ReactNode
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
}) {
  const id = useId()
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-tile border border-line-strong bg-paper p-3.5 has-data-checked:border-ink",
        className
      )}
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onClick={(event) => onCheckedChange?.(event.currentTarget.checked)}
        className="mt-px size-[22px] shrink-0 accent-[var(--ink)]"
      />
      <span className="min-w-0">
        <strong className="block font-medium">{title}</strong>
        {children ? <small className="mt-0.5 block text-sm leading-[1.45] text-meta">{children}</small> : null}
      </span>
    </label>
  )
}

/** "Paso 2 de 4" with a segmented bar. */
export function Steps({ current, total, className }: { current: number; total: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className="text-[13px] font-medium text-meta">
        Paso {current} de {total}
      </span>
      <div className="flex gap-1" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={cn("h-1 flex-1 rounded-full", i < current ? "bg-ink" : "bg-line")} />
        ))}
      </div>
    </div>
  )
}

/** Inline message. "danger" only for errors and 24 h emergencies. */
export function Notice({
  tone = "plain",
  title,
  children,
  icon,
  className,
}: {
  tone?: "plain" | "danger" | "privacy"
  title?: string
  children?: React.ReactNode
  icon?: React.ComponentProps<typeof Icon>["name"]
  className?: string
}) {
  const iconName = icon ?? (tone === "danger" ? "alert" : tone === "privacy" ? "lock" : "paw")
  return (
    <div
      role={tone === "danger" ? "alert" : undefined}
      className={cn(
        "flex gap-3 rounded-tile p-3.5 text-[15px] leading-normal",
        tone === "plain" && "bg-surface",
        tone === "privacy" && "border border-line bg-paper",
        tone === "danger" && "bg-danger-bg text-danger",
        className
      )}
    >
      <Icon name={iconName} className="mt-0.5" />
      <div className="min-w-0">
        {title ? <strong className="block font-medium">{title}</strong> : null}
        {children ? <div className={cn(tone === "danger" && "text-ink")}>{children}</div> : null}
      </div>
    </div>
  )
}
