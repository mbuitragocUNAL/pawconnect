import Image from "next/image"
import { cn } from "cn"
import { Icon } from "./icon"

type CropFrameProps = {
  src: string
  alt: string
  /** Fills the parent; give the parent (or className) a size. */
  className?: string
  /** Rendered size hint for next/image. */
  sizes?: string
  /** Bigger corners for large photos. */
  large?: boolean
  /** Photo was rejected (no dog or cat, too dark…). */
  rejected?: boolean
  /** Small pill on the photo, e.g. "Animal detectado". */
  badge?: React.ReactNode
  priority?: boolean
}

/**
 * The crop frame: four corners over the photo. It is the visual promise of
 * RN-04 ("we keep only the crop of the animal"), so every animal photo in
 * the product sits inside one.
 */
export function CropFrame({
  src,
  alt,
  className,
  sizes = "200px",
  large,
  rejected,
  badge,
  priority,
}: CropFrameProps) {
  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-tile bg-map-block",
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn(
          "object-cover text-transparent",
          rejected && "brightness-75 grayscale-[.6]"
        )}
      />
      <span
        aria-hidden
        className={cn("pc-frame", large && "pc-frame-lg", rejected && "text-[#ffd9d4]")}
      />
      {badge || rejected ? (
        <span
          className={cn(
            "absolute bottom-2.5 left-2.5 inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[13px] leading-none font-medium",
            rejected ? "bg-danger text-white" : "bg-ground text-ink"
          )}
        >
          {rejected ? (
            <>
              <Icon name="alert" className="size-4" />
              {badge ?? "No vemos un perro o un gato"}
            </>
          ) : (
            badge
          )}
        </span>
      ) : null}
    </span>
  )
}
