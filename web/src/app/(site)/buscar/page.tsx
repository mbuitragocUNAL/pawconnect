"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CandidateRow, SimilarityAxis } from "@/components/pawconnect/candidates"
import { CropFrame } from "@/components/pawconnect/crop-frame"
import { DecisionBar } from "@/components/pawconnect/decision-bar"
import { Consent, Field, Notice, Steps } from "@/components/pawconnect/form"
import { Icon } from "@/components/pawconnect/icon"
import { apiAssetUrl, apiFetch } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import type { Report, ReportType } from "@/lib/domain"

type ApiReport = {
  id: string
  tipo: ReportType
  especie: "perro" | "gato"
  nombre: string
  rasgos: string
  fecha_evento: string
  zona: { nombre: string; radio_m: number }
  fotos: { id: string; recorte: string }[]
  estado: string
}

type Candidate = {
  id: string
  posicion: number
  decision: string
  reporte: ApiReport
}

type OwnReport = ApiReport

function toReport(candidate: Candidate): Report {
  const report = candidate.reporte
  return {
    id: report.id,
    type: report.tipo,
    species: report.especie,
    title: report.nombre || `${report.especie === "perro" ? "Perro" : "Gato"} ${report.tipo}`,
    zone: report.zona.nombre,
    when: new Date(`${report.fecha_evento}T12:00:00`).toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
    }),
    photo: apiAssetUrl(report.fotos[0]?.recorte),
    alt: `Posible coincidencia ${candidate.posicion}`,
  }
}

function SearchContent() {
  const router = useRouter()
  const params = useSearchParams()
  const reportId = params.get("report")
  const { user, ready } = useAuth()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [selected, setSelected] = useState<Candidate | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [contactStep, setContactStep] = useState(false)
  const [message, setMessage] = useState("")
  const [consent, setConsent] = useState(false)
  const [sent, setSent] = useState(false)
  const [ownReports, setOwnReports] = useState<OwnReport[]>([])

  useEffect(() => {
    if (!ready || !user) return
    apiFetch<OwnReport[] | { results: OwnReport[] }>("/reportes/mios/")
      .then((result) =>
        setOwnReports(Array.isArray(result) ? result : result.results)
      )
      .catch(() => setOwnReports([]))
  }, [ready, user])

  const load = async () => {
    if (!reportId) return
    setLoading(true)
    setError("")
    try {
      const result = await apiFetch<Candidate[]>(`/reportes/${reportId}/candidatos/`)
      setCandidates(result)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No pudimos cargar candidatos.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (ready && user && reportId) void load()
  }, [ready, user, reportId])

  const decide = async (decision: "confirmado" | "descartado") => {
    if (!selected) return
    setLoading(true)
    setError("")
    try {
      await apiFetch(`/candidatos/${selected.id}/decision/`, {
        method: "POST",
        body: JSON.stringify({ decision }),
      })
      if (decision === "descartado") {
        setCandidates((current) => current.filter((item) => item.id !== selected.id))
        setSelected(null)
      } else {
        setContactStep(true)
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No pudimos guardar tu decisión.")
    } finally {
      setLoading(false)
    }
  }

  const sendContact = async () => {
    if (!selected) return
    setError("")
    if (!consent) {
      setError("Confirma que quieres compartir el contacto con la otra parte.")
      return
    }
    setLoading(true)
    try {
      await apiFetch("/contacto/", {
        method: "POST",
        body: JSON.stringify({
          candidato: selected.id,
          mensaje_inicial: message,
        }),
      })
      setSent(true)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No pudimos enviar la solicitud.")
    } finally {
      setLoading(false)
    }
  }

  if (!ready) return null
  if (!user) {
    return (
      <section className="mx-auto max-w-[640px] px-4 pt-10">
        <Notice tone="privacy" title="Ingresa para revisar candidatos">
          Solo quien publicó el reporte puede confirmar coincidencias.
        </Notice>
        <Button className="mt-4" onClick={() => router.push("/ingresar")}>Ingresar</Button>
      </section>
    )
  }
  if (!reportId) {
    return (
      <section className="mx-auto max-w-[760px] px-4 pt-8 pb-28">
        <h1>Buscar por foto</h1>
        {ownReports.length === 0 ? (
          <>
            <Notice className="mt-5" title="Primero publica un reporte">
              La búsqueda necesita una foto, especie y ubicación asociadas a tu reporte.
            </Notice>
            <Button className="mt-5" onClick={() => router.push("/publicar")}>
              Publicar reporte perdido
            </Button>
          </>
        ) : (
          <>
            <Notice className="mt-5" title="Selecciona uno de tus reportes">
              Ejecutarás la búsqueda con sus fotos y filtros de especie, fecha y zona.
            </Notice>
            <div className="mt-5 grid gap-3 desk:grid-cols-2">
              {ownReports.map((report) => (
                <article key={report.id} className="flex items-center gap-3 rounded-panel border border-line bg-paper p-3">
                  {report.fotos[0]?.recorte ? (
                    <img
                      src={apiAssetUrl(report.fotos[0].recorte)}
                      alt={report.nombre || `Reporte ${report.tipo}`}
                      className="size-20 rounded-tile object-cover"
                    />
                  ) : (
                    <div className="size-20 rounded-tile bg-surface" />
                  )}
                  <div className="min-w-0 flex-1">
                    <strong className="block">{report.nombre || `${report.especie} ${report.tipo}`}</strong>
                    <p className="text-sm text-meta">{report.zona.nombre} · {report.fecha_evento}</p>
                    <Button
                      size="sm"
                      variant="tonal"
                      className="mt-2"
                      onClick={() => router.push(`/buscar?report=${report.id}`)}
                    >
                      Buscar coincidencias
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    )
  }

  if (sent) {
    return (
      <section className="mx-auto max-w-[640px] px-4 pt-10 pb-28">
        <Notice tone="privacy" title="Solicitud enviada">
          La otra parte debe aceptar antes de revelar el teléfono.
        </Notice>
        <Button className="mt-5" onClick={() => router.push("/mis-casos")}>Ir a mis casos</Button>
      </section>
    )
  }

  if (contactStep && selected) {
    return (
      <section className="mx-auto max-w-[640px] px-4 pt-8 pb-28">
        <Steps current={3} total={3} />
        <h1 className="mt-4">Contacto protegido</h1>
        {error ? <Notice tone="danger" className="mt-4" title="No se pudo enviar">{error}</Notice> : null}
        <div className="mt-6 rounded-panel border border-line bg-paper p-5">
          <p className="text-sm text-meta">Primero, ambas partes aceptan</p>
          <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
            <div><Icon name="paw" className="mx-auto" /><strong>Tú</strong></div>
            <span className="h-px w-10 bg-line-strong" />
            <div><Icon name="paw" className="mx-auto" /><strong>La otra parte</strong></div>
          </div>
        </div>
        <Field label="Mensaje opcional" className="mt-5">
          <textarea
            className="min-h-28 w-full rounded-tile border border-line-strong bg-paper px-3.5 py-3"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Hola, creo que puedo aportar información sobre el animal."
          />
        </Field>
        <Consent
          className="mt-4"
          title="Quiero enviar la solicitud de contacto"
          checked={consent}
          onCheckedChange={setConsent}
        >
          El teléfono solo se revelará si ambas partes aceptan.
        </Consent>
        <Button block className="mt-5" disabled={loading} onClick={sendContact}>
          Enviar solicitud de contacto
        </Button>
      </section>
    )
  }

  if (selected) {
    const report = toReport(selected)
    return (
      <section className="mx-auto max-w-[760px] px-4 pt-6 pb-28">
        <Button variant="ghost" onClick={() => setSelected(null)}><Icon name="back" /> Volver a candidatos</Button>
        {error ? <Notice tone="danger" className="mt-4" title="No pudimos guardar tu decisión">{error}</Notice> : null}
        <CropFrame
          src={report.photo}
          alt={report.alt}
          badge={report.type === "perdido" ? "Perdido" : report.type === "visto" ? "Visto" : "Encontrado"}
          className="mt-4 h-[360px] rounded-panel"
          sizes="760px"
        />
        <div className="mt-5">
          <span className="font-mono text-sm text-meta">Posible coincidencia {String(selected.posicion).padStart(2, "0")}</span>
          <h1 className="mt-1">{report.title}</h1>
          <p className="mt-2 text-meta">{report.zone} · {report.when}</p>
          {selected.reporte.rasgos ? <p className="mt-3">{selected.reporte.rasgos}</p> : null}
        </div>
        <Notice className="mt-5" title="Tú decides, no el sistema">
          No mostramos porcentajes de certeza. Confirma únicamente si reconoces a tu mascota.
        </Notice>
        <DecisionBar hint="¿Puede ser tu animal?" className="mt-5">
          <Button variant="tonal" disabled={loading} onClick={() => decide("descartado")}>No es</Button>
          <Button disabled={loading} onClick={() => decide("confirmado")}>Sí, puede ser</Button>
        </DecisionBar>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-[760px] px-4 pt-8 pb-28">
      <h1>Posibles coincidencias</h1>
      {loading ? <Notice className="mt-5" title="Buscando candidatos">Estamos revisando los reportes cercanos.</Notice> : null}
      {error ? <Notice tone="danger" className="mt-5" title="No pudimos buscar">{error}</Notice> : null}
      {!loading && candidates.length === 0 ? (
        <Notice className="mt-5" title="Aún no hay coincidencias">
          Puedes volver más tarde o repetir la búsqueda.
        </Notice>
      ) : null}
      {candidates.length > 0 ? (
        <>
          <SimilarityAxis className="mt-5" />
          <div className="mt-2 rounded-panel border border-line bg-paper">
            {candidates.map((candidate) => (
              <CandidateRow
                key={candidate.id}
                position={candidate.posicion}
                report={toReport(candidate)}
                onSelect={() => setSelected(candidate)}
              />
            ))}
          </div>
        </>
      ) : null}
      <Button variant="tonal" className="mt-5" onClick={load}>Repetir búsqueda</Button>
    </section>
  )
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <section className="mx-auto max-w-[760px] px-4 pt-8 pb-28">
          <Notice title="Cargando búsqueda">Preparando los candidatos…</Notice>
        </section>
      }
    >
      <SearchContent />
    </Suspense>
  )
}
