"use client"

import { Suspense } from "react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CropFrame } from "@/components/pawconnect/crop-frame"
import { ReportTag } from "@/components/pawconnect/tags"
import { Notice } from "@/components/pawconnect/form"
import { ReportZoneMap } from "@/components/pawconnect/report-zone-map"
import { apiAssetUrl, apiFetch } from "@/lib/api"

type ApiReport = {
  tipo: "perdido" | "encontrado" | "visto"
  especie: "perro" | "gato"
  nombre: string
  rasgos: string
  fecha_evento: string
  zona: { nombre: string; lat: number; lng: number; radio_m: number }
  fotos: { recorte: string }[]
  estado: string
}

function ReportDetailContent() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [report, setReport] = useState<ApiReport | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    apiFetch<ApiReport>(`/reportes/${params.id}/`)
      .then(setReport)
      .catch((requestError) =>
        setError(requestError instanceof Error ? requestError.message : "No pudimos cargar el reporte.")
      )
  }, [params.id])

  return (
    <section className="mx-auto max-w-[760px] px-4 pt-8 pb-28">
      <Button variant="ghost" onClick={() => router.push("/reportes")}>← Todos los reportes</Button>
      {error ? <Notice tone="danger" className="mt-5" title="No encontramos el reporte">{error}</Notice> : null}
      {report ? (
        <>
          <CropFrame
            src={apiAssetUrl(report.fotos[0]?.recorte)}
            alt={report.nombre || `Reporte de ${report.especie}`}
            className="mt-5 h-[420px] rounded-panel"
            sizes="760px"
          />
          <div className="mt-5">
            <ReportTag type={report.tipo} />
            <h1 className="mt-3">{report.nombre || `${report.especie === "perro" ? "Perro" : "Gato"} ${report.tipo}`}</h1>
            <p className="mt-2 text-meta">
              {report.zona.nombre} · {new Date(`${report.fecha_evento}T12:00:00`).toLocaleDateString("es-CO")}
            </p>
            {report.rasgos ? <p className="mt-4">{report.rasgos}</p> : null}
            <Notice tone="privacy" className="mt-5" title="Ubicación protegida">
              El círculo muestra un área aproximada de {report.zona.radio_m} m. No se muestra la ubicación exacta.
            </Notice>
            <ReportZoneMap
              lat={report.zona.lat}
              lng={report.zona.lng}
              radiusMeters={report.zona.radio_m}
              type={report.tipo}
            />
          </div>
        </>
      ) : null}
    </section>
  )
}

export default function ReportDetailPage() {
  return (
    <Suspense
      fallback={
        <section className="mx-auto max-w-[760px] px-4 pt-8 pb-28">
          Cargando el reporte…
        </section>
      }
    >
      <ReportDetailContent />
    </Suspense>
  )
}
