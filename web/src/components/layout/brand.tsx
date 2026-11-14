import Link from "next/link"
import { cn } from "cn"
import { Icon } from "@/components/pawconnect/icon"

/** Paw mark in an ink tile + wordmark. */
export function Brand({ compact, className }: { compact?: boolean; className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2.5 font-heading leading-none font-medium tracking-[-0.02em] whitespace-nowrap text-ink no-underline",
        compact ? "text-lg" : "text-xl",
        className
      )}
    >
      <span
        className={cn(
          "grid shrink-0 place-items-center bg-ink text-ground",
          compact ? "size-[30px] rounded-[9px]" : "size-[34px] rounded-[10px]"
        )}
      >
        <Icon name="paw" className={compact ? "size-[19px]" : "size-[22px]"} />
      </span>
      PawConnect
    </Link>
  )
}
