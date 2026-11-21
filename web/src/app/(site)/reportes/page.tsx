"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ReportCard } from "@/components/pawconnect/report-card"
import { Notice } from "@/components/pawconnect/form"
import { apiAssetUrl, apiFetch } from "@/lib/api"
import type { Report } from "@/lib/domain"

type ApiReport = {
  id: string
  tipo: "perdido" | "encontrado" | "visto"
  especie: "perro" | "gato"
  nombre: string
  fecha_evento: string
  zona: { nombre: string }
  fotos: { recorte: string }[]
}

type Paginated<T> = { count: number; next: string | null; previous: string | null; results: T[] }

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [species, setSpecies] = useState("")
  const [zone, setZone] = useState("")

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const query = new URLSearchParams()
      if (species) query.set("especie", species)
      if (zone) query.set("zona", zone)
      const response = await apiFetch<Paginated<ApiReport> | ApiReport[]>(
        `/reportes/${query.size ? `?${query}` : ""}`
      )
      const data = Array.isArray(response) ? response : response.results
      setReports(
        data.map((item) => ({
          id: item.id,
          type: item.tipo,
          species: item.especie,
          title: item.nombre || `${item.especie === "perro" ? "Perro" : "Gato"} ${item.tipo}`,
          zone: item.zona.nombre,
          when: new Date(`${item.fecha_evento}T12:00:00`).toLocaleDateString("es-CO", {
            day: "numeric",
            month: "short",
          }),
          photo: apiAssetUrl(item.fotos[0]?.recorte),
          alt: `Reporte ${item.nombre || item.especie}`,
        }))
      )
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No pudimos cargar los reportes.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <section className="mx-auto max-w-[1280px] px-4 pt-8 pb-28 desk:px-8">
      <h1>Reportes recientes</h1>
      <div className="mt-5 grid gap-3 rounded-panel border border-line bg-paper p-4 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <label className="mb-1 block text-sm font-medium">Especie</label>
          <select
            className="h-12 w-full rounded-field border border-line-strong bg-paper px-3.5"
            value={species}
            onChange={(event) => setSpecies(event.target.value)}
          >
            <option value="">Todas</option>
            <option value="perro">Perros</option>
            <option value="gato">Gatos</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Zona</label>
          <Input value={zone} onChange={(event) => setZone(event.target.value)} placeholder="Ej. Suba" />
        </div>
        <Button className="sm:self-end" onClick={load}>Filtrar</Button>
      </div>
      {loading ? <Notice className="mt-5" title="Cargando reportes">Consultando el mapa público…</Notice> : null}
      {error ? <Notice tone="danger" className="mt-5" title="No pudimos cargar">{error}</Notice> : null}
      {!loading && reports.length === 0 ? (
        <Notice className="mt-5" title="No hay reportes con esos filtros">
          Cambia la zona o la especie.
        </Notice>
      ) : null}
      <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
        {reports.map((report) => (
          <ReportCard key={report.id} report={report} href={`/reportes/${report.id}`} />
        ))}
      </div>
    </section>
  )
}
