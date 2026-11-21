"use client"

import { Suspense, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Field, Notice } from "@/components/pawconnect/form"
import { CaseState } from "@/components/pawconnect/tags"
import { CaseTimeline } from "@/components/pawconnect/case-timeline"
import { apiFetch } from "@/lib/api"
import { useAuth } from "@/lib/auth"

type CaseData = {
  estado: "activo" | "seguimiento" | "resuelto" | "cerrado"
  reencuentro_confirmado_en: string | null
  cerrado_en: string | null
  eventos: {
    estado_anterior: string
    estado_nuevo: string
    nota: string
    en: string
  }[]
}

function CaseContent() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user, ready } = useAuth()
  const [caso, setCaso] = useState<CaseData | null>(null)
  const [state, setState] = useState<CaseData["estado"]>("activo")
  const [note, setNote] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ready || !user) return
    apiFetch<CaseData>(`/reportes/${params.id}/caso/`)
      .then((data) => {
        setCaso(data)
        setState(data.estado)
      })
      .catch((requestError) =>
        setError(requestError instanceof Error ? requestError.message : "No pudimos cargar el caso.")
      )
      .finally(() => setLoading(false))
  }, [ready, user, params.id])

  const changeState = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await apiFetch<CaseData>(`/reportes/${params.id}/caso/`, {
        method: "POST",
        body: JSON.stringify({ estado: state, nota: note }),
      })
      setCaso(data)
      setNote("")
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No pudimos cambiar el estado.")
    } finally {
      setLoading(false)
    }
  }

  if (!ready) return null
  if (!user) {
    return (
      <section className="mx-auto max-w-[760px] px-4 pt-10">
        <Notice tone="privacy" title="Ingresa para ver el caso">Solo la persona autora puede gestionarlo.</Notice>
        <Button className="mt-4" onClick={() => router.push("/ingresar")}>Ingresar</Button>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-[760px] px-4 pt-8 pb-28">
      <Button variant="ghost" onClick={() => router.push("/mis-casos")}>← Mis casos</Button>
      {loading ? <Notice className="mt-5" title="Cargando el caso">Recuperando el historial…</Notice> : null}
      {error ? <Notice tone="danger" className="mt-5" title="No pudimos cargar">{error}</Notice> : null}
      {caso ? (
        <>
          <div className="mt-5 flex items-center justify-between gap-4">
            <h1>Ficha del caso</h1>
            <CaseState state={caso.estado} />
          </div>
          <div className="mt-6 rounded-panel border border-line bg-paper p-5">
            <Field label="Estado del caso">
              <select
                className="h-12 w-full rounded-field border border-line-strong bg-paper px-3.5"
                value={state}
                onChange={(event) => setState(event.target.value as CaseData["estado"])}
              >
                <option value="activo">Activo</option>
                <option value="seguimiento">En seguimiento</option>
                <option value="resuelto">Resuelto</option>
                <option value="cerrado">Cerrado</option>
              </select>
            </Field>
            <Field label="Nota del cambio" className="mt-4">
              <input
                className="h-12 w-full rounded-field border border-line-strong bg-paper px-3.5"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Ej. Confirmamos el reencuentro"
              />
            </Field>
            <Button className="mt-4" disabled={loading} onClick={changeState}>
              Actualizar estado
            </Button>
          </div>
          {caso.estado === "resuelto" ? (
            <Notice tone="privacy" className="mt-5" title="Reencuentro confirmado">
              Este caso cuenta en la tasa de reencuentros.
            </Notice>
          ) : null}
          <h2 className="mt-8">Historial</h2>
          <CaseTimeline
            className="mt-4"
            events={caso.eventos.map((event) => ({
              title: event.estado_nuevo ? `Estado: ${event.estado_nuevo}` : "Actividad del caso",
              detail: event.nota,
              at: new Date(event.en).toLocaleString("es-CO"),
            }))}
          />
        </>
      ) : null}
    </section>
  )
}

export default function CasePage() {
  return (
    <Suspense
      fallback={
        <section className="mx-auto max-w-[760px] px-4 pt-8 pb-28">
          Cargando el caso…
        </section>
      }
    >
      <CaseContent />
    </Suspense>
  )
}
