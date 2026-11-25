"use client"

import { useEffect, useRef, useState } from "react"
import * as maplibregl from "maplibre-gl"
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl"
import { Button } from "@/components/ui/button"
import { Notice } from "@/components/pawconnect/form"
import { apiAssetUrl, apiFetch } from "@/lib/api"
import { circleGeoJson } from "@/lib/map-geometry"

type ApiReport = {
  id: string
  tipo: "perdido" | "encontrado" | "visto"
  especie: "perro" | "gato"
  nombre: string
  fecha_evento: string
  zona: { lat: number; lng: number; radio_m: number; nombre: string }
  fotos: { recorte: string }[]
}

type Paginated<T> = { count: number; next: string | null; previous: string | null; results: T[] }

export default function MapPage() {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<MapLibreMap | null>(null)
  const [species, setSpecies] = useState("")
  const [type, setType] = useState("")
  const [reports, setReports] = useState<ApiReport[]>([])
  const [error, setError] = useState("")

  const loadReports = async () => {
    setError("")
    try {
      const query = new URLSearchParams()
      if (species) query.set("especie", species)
      if (type) query.set("tipo", type)
      const response = await apiFetch<Paginated<ApiReport> | ApiReport[]>(
        `/reportes/${query.size ? `?${query}` : ""}`
      )
      setReports(Array.isArray(response) ? response : response.results)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No pudimos cargar el mapa.")
    }
  }

  useEffect(() => {
    void loadReports()
  }, [species, type])

  useEffect(() => {
    if (!container.current || map.current) return

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
      center: [-74.0721, 4.711],
      zoom: 11,
      attributionControl: { compact: true },
    })
    map.current = instance

    instance.on("load", () => {
      instance.addSource("reportes-circulos", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      })
      instance.addLayer({
        id: "reportes-circulos-fill",
        type: "fill",
        source: "reportes-circulos",
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": 0.13,
        },
      })
      instance.addLayer({
        id: "reportes-circulos-line",
        type: "line",
        source: "reportes-circulos",
        paint: {
          "line-color": ["get", "color"],
          "line-width": 2,
          "line-dasharray": [3, 2],
        },
      })
    })

    return () => {
      instance.remove()
      map.current = null
    }
  }, [])

  useEffect(() => {
    const instance = map.current
    if (!instance) return

    const update = () => {
      const features = reports.map((report) => {
        const circle = circleGeoJson(
          report.zona.lat,
          report.zona.lng,
          report.zona.radio_m || 500
        )
        return {
          ...circle,
          properties: {
            color:
              report.tipo === "perdido"
                ? "#cc2f70"
                : report.tipo === "encontrado"
                  ? "#2d1659"
                  : "#57525e",
            id: report.id,
            title: report.nombre || `${report.especie} ${report.tipo}`,
            zone: report.zona.nombre,
            date: report.fecha_evento,
            photo: report.fotos[0]?.recorte ?? "",
            type: report.tipo,
          },
        }
      })
      const source = instance.getSource("reportes-circulos")
      if (source?.type === "geojson") {
        ;(source as GeoJSONSource).setData({ type: "FeatureCollection", features })
      }

      instance
        .getStyle()
        ?.layers?.filter((layer) => layer.id.startsWith("reportes-marker-"))
        .forEach((layer) => instance.removeLayer(layer.id))
      ;["reportes-marker-source", "reportes-marker-layer"].forEach((id) => {
        if (instance.getLayer(id)) instance.removeLayer(id)
        if (instance.getSource(id)) instance.removeSource(id)
      })
      if (features.length) {
        instance.addSource("reportes-marker-source", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: reports.map((report) => ({
              type: "Feature",
              properties: {
                id: report.id,
                title: report.nombre || `${report.especie} ${report.tipo}`,
                zone: report.zona.nombre,
                date: report.fecha_evento,
                photo: report.fotos[0]?.recorte ?? "",
                type: report.tipo,
              },
              geometry: {
                type: "Point",
                coordinates: [report.zona.lng, report.zona.lat],
              },
            })),
          },
        })
        instance.addLayer({
          id: "reportes-marker-layer",
          type: "circle",
          source: "reportes-marker-source",
          paint: {
            "circle-radius": 7,
            "circle-color": [
              "match",
              ["get", "type"],
              "perdido",
              "#cc2f70",
              "encontrado",
              "#2d1659",
              "#57525e",
            ],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        })
      }
    }

    if (instance.isStyleLoaded()) update()
    else instance.once("load", update)
  }, [reports])

  useEffect(() => {
    const instance = map.current
    if (!instance) return
    const handleClick = (event: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
      const feature = event.features?.[0]
      if (!feature) return
      const properties = feature.properties as Record<string, string>
      const coordinates = (feature.geometry as GeoJSON.Point).coordinates as [number, number]
      const photo = properties.photo ? apiAssetUrl(properties.photo) : ""
      new maplibregl.Popup({ closeButton: true, offset: 12 })
        .setLngLat(coordinates)
        .setHTML(
          `<div style="max-width:230px;color:#2d1659">
            ${photo ? `<img src="${photo}" style="width:100%;height:120px;object-fit:cover;border-radius:12px" />` : ""}
            <strong style="display:block;margin-top:8px">${properties.title}</strong>
            <span style="font-size:13px">${properties.zone} · ${properties.date}</span>
          </div>`
        )
        .addTo(instance)
    }
    instance.on("click", "reportes-marker-layer", handleClick)
    return () => {
      instance.off("click", "reportes-marker-layer", handleClick)
    }
  }, [reports])

  return (
    <section className="mx-auto max-w-[1280px] px-4 pt-8 pb-28 desk:px-8">
      <h1>Reportes en el mapa</h1>
      {error ? <Notice tone="danger" className="mt-5" title="No pudimos cargar">{error}</Notice> : null}
      <div className="mt-5 grid gap-3 rounded-panel border border-line bg-paper p-4 sm:grid-cols-[1fr_1fr_auto]">
        <select
          aria-label="Filtrar por especie"
          className="h-12 rounded-field border border-line-strong bg-paper px-3.5"
          value={species}
          onChange={(event) => setSpecies(event.target.value)}
        >
          <option value="">Todas las especies</option>
          <option value="perro">Perros</option>
          <option value="gato">Gatos</option>
        </select>
        <select
          aria-label="Filtrar por tipo"
          className="h-12 rounded-field border border-line-strong bg-paper px-3.5"
          value={type}
          onChange={(event) => setType(event.target.value)}
        >
          <option value="">Todos los tipos</option>
          <option value="perdido">Perdidos</option>
          <option value="encontrado">Encontrados</option>
          <option value="visto">Vistos en la calle</option>
        </select>
        <Button variant="tonal" onClick={loadReports}>Actualizar</Button>
      </div>
      <div
        ref={container}
        className="mt-5 h-[min(68vh,620px)] min-h-[420px] overflow-hidden rounded-panel border border-line"
      />
      <p className="mt-3 text-[13px] text-meta">
        Cada reporte se muestra como un área aproximada de 500 m. No se expone la ubicación exacta.
      </p>
    </section>
  )
}
