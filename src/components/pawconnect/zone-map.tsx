import { cn } from "cn"
import type { ReportType } from "@/lib/domain"

/**
 * Colours of a report's zone circle. Export them so the real map layer
 * (MapLibre or Leaflet, see section 7 of the requirements) draws exactly the
 * same thing: a 500 m circle, never a pin (RF-15).
 */
export const zonePaint: Record<ReportType, { fill: string; stroke: string; dot: string }> = {
  perdido: { fill: "rgb(204 47 112 / .12)", stroke: "rgb(204 47 112 / .55)", dot: "#cc2f70" },
  encontrado: { fill: "rgb(45 22 89 / .10)", stroke: "rgb(45 22 89 / .5)", dot: "#2d1659" },
  visto: { fill: "transparent", stroke: "rgb(45 22 89 / .6)", dot: "#2d1659" },
}

/** Radius of a report on the map, in metres. */
export const ZONE_RADIUS_M = 500

export type MapZone = {
  /** 0–1 across the map. */
  x: number
  /** 0–1 down the map. */
  y: number
  type: ReportType
}

export type MapPlace = { x: number; y: number; label?: string; urgent?: boolean }

const W = 600
const H = 420
const BLOCKS: [number, number, number, number][] = [
  [16, 16, 120, 86], [152, 16, 140, 86], [308, 16, 120, 86], [444, 16, 140, 86],
  [16, 118, 120, 96], [308, 118, 120, 96], [444, 118, 140, 96],
  [16, 230, 120, 86], [152, 230, 140, 86], [444, 230, 140, 86],
  [16, 332, 120, 76], [152, 332, 140, 76], [308, 332, 120, 76], [444, 332, 140, 76],
]
const PARKS: [number, number, number, number][] = [
  [152, 118, 140, 96],
  [308, 230, 120, 86],
]

/**
 * Illustrative map for prototypes and marketing: city blocks, a main road,
 * reports as dashed 500 m circles and fixed places (clinics, shelters) as
 * solid dots. The product map should use MapLibre with `zonePaint`.
 */
export function ZoneMap({
  zones = [],
  places = [],
  radius = 58,
  className,
  children,
  label = "Mapa de reportes cercanos. Cada reporte es un área de 500 metros.",
}: {
  zones?: MapZone[]
  places?: MapPlace[]
  /** Circle radius in SVG units (the map is 600×420). */
  radius?: number
  className?: string
  /** Overlays (legend, report cards) positioned over the map. */
  children?: React.ReactNode
  label?: string
}) {
  return (
    <div className={cn("relative overflow-hidden bg-map-ground", className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 size-full"
        role="img"
        aria-label={label}
      >
        <rect width={W} height={H} fill="var(--map-ground)" />
        <g fill="var(--map-block)">
          {BLOCKS.map(([x, y, w, h]) => (
            <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} rx={4} />
          ))}
        </g>
        <g fill="var(--map-park)">
          {PARKS.map(([x, y, w, h]) => (
            <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} rx={4} />
          ))}
        </g>
        <path d={`M0 380 L${W} 70`} stroke="#fff" strokeWidth={12} />
        <g strokeWidth={1.5} strokeDasharray="5 5">
          {zones.map((z, i) => (
            <circle
              key={i}
              cx={z.x * W}
              cy={z.y * H}
              r={radius}
              fill={zonePaint[z.type].fill}
              stroke={zonePaint[z.type].stroke}
            />
          ))}
        </g>
        {zones.map((z, i) => (
          <circle key={i} cx={z.x * W} cy={z.y * H} r={5} fill={zonePaint[z.type].dot} />
        ))}
        {places.map((p, i) => (
          <g key={i}>
            <circle cx={p.x * W} cy={p.y * H} r={9} fill={p.urgent ? "var(--danger)" : "var(--ink)"} />
            <circle cx={p.x * W} cy={p.y * H} r={3.2} fill="#fff" />
          </g>
        ))}
      </svg>
      {children}
    </div>
  )
}
