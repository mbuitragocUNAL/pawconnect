"use client"

import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { CropFrame } from "./crop-frame"
import { Icon } from "./icon"

export type SlotPhoto = { src: string; alt: string; rejected?: boolean; reason?: string }

/**
 * 1 to 5 photos for a report (RF-02). Filled slots show the crop; a
 * rejected photo (RF-03) stays visible with its reason so the person knows
 * what to retake. The next empty slot is the add button.
 */
export function PhotoSlots({
  photos,
  max = 5,
  onAdd,
  onRemove,
  className,
}: {
  photos: SlotPhoto[]
  max?: number
  onAdd?: () => void
  onRemove?: (index: number) => void
  className?: string
}) {
  const empty = Math.max(0, max - photos.length)
  return (
    <div className={cn("grid grid-cols-3 gap-2 sm:grid-cols-5", className)}>
      {photos.map((p, i) => (
        <div key={i} className="relative aspect-square">
          <CropFrame
            src={p.src}
            alt={p.alt}
            rejected={p.rejected}
            badge={p.rejected ? (p.reason ?? "Sin animal") : i === 0 ? "Principal" : undefined}
            className="size-full rounded-[14px] [&>span:last-child]:max-w-[calc(100%-20px)] [&>span:last-child]:truncate"
            sizes="140px"
          />
          {onRemove ? (
            <Button
              variant="tonal"
              size="icon-sm"
              onClick={() => onRemove(i)}
              className="absolute top-1.5 right-1.5 size-8 bg-ground/90"
              aria-label={`Quitar foto ${i + 1}`}
            >
              <Icon name="x" className="size-4" />
            </Button>
          ) : null}
        </div>
      ))}
      {Array.from({ length: empty }, (_, i) =>
        i === 0 ? (
          <button
            key={i}
            type="button"
            onClick={onAdd}
            className="grid aspect-square place-items-center rounded-[14px] border-[1.5px] border-dashed border-line-strong text-center text-[13px] leading-snug font-medium text-ink transition-colors hover:border-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <span className="flex flex-col items-center gap-1">
              <Icon name="camera" />
              {photos.length === 0 ? "Agregar foto" : "Otra foto"}
            </span>
          </button>
        ) : (
          <span
            key={i}
            aria-hidden
            className="aspect-square rounded-[14px] border-[1.5px] border-dashed border-line"
          />
        )
      )}
    </div>
  )
}
