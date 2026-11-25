"use client"

import { useEffect, useRef } from "react"
import * as maplibregl from "maplibre-gl"
import { circleGeoJson } from "@/lib/map-geometry"

type ReportZoneMapProps = {
  lat: number
  lng: number
  radiusMeters: number
  type: "perdido" | "encontrado" | "visto"
}

const colors = {
  perdido: "#cc2f70",
  encontrado: "#2d1659",
  visto: "#57525e",
}

export function ReportZoneMap({ lat, lng, radiusMeters, type }: ReportZoneMapProps) {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!container.current) return

    maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs")
    const instance = new maplibregl.Map({
      container: container.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
      center: [lng, lat],
      zoom: 14,
      attributionControl: { compact: true },
    })

    instance.on("load", () => {
      instance.addSource("reporte-zona", {
        type: "geojson",
        data: circleGeoJson(lat, lng, radiusMeters),
      })
      instance.addLayer({
        id: "reporte-zona-fill",
        type: "fill",
        source: "reporte-zona",
        paint: {
          "fill-color": colors[type],
          "fill-opacity": 0.16,
        },
      })
      instance.addLayer({
        id: "reporte-zona-line",
        type: "line",
        source: "reporte-zona",
        paint: {
          "line-color": colors[type],
          "line-width": 2,
          "line-dasharray": [3, 2],
        },
      })
    })

    return () => {
      instance.remove()
    }
  }, [lat, lng, radiusMeters, type])

  return (
    <div
      ref={container}
      role="img"
      aria-label={`Área aproximada del reporte: radio de ${radiusMeters} metros`}
      className="mt-5 h-[min(55vh,460px)] min-h-[320px] overflow-hidden rounded-panel border border-line"
    />
  )
}
