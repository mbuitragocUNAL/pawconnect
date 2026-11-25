"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Notice } from "@/components/pawconnect/form"
import { CaseState } from "@/components/pawconnect/tags"
import { apiAssetUrl, apiFetch } from "@/lib/api"
import { useAuth } from "@/lib/auth"

type PublicReport = {
  id: string
  tipo: "perdido" | "encontrado" | "visto"
  especie: "perro" | "gato"
  nombre: string
  zona: { nombre: string }
  fotos: { recorte: string }[]
  estado: "activo" | "seguimiento" | "resuelto" | "cerrado"
  creado_en: string
}

type ContactRequest = {
  id: string
  estado: "esperando" | "abierto" | "rechazado"
  soy: "solicitante" | "receptor"
  acepto_receptor_en: string | null
  telefono_otra_parte: string
  mensaje_inicial: string
  reporte: {
    nombre: string
    especie: "perro" | "gato"
    tipo: "perdido" | "encontrado" | "visto"
    zona: string
  } | null
}

type PaginatedReports = { count: number; next: string | null; previous: string | null; results: PublicReport[] }

type Paginated<T> = { count: number; next: string | null; previous: string | null; results: T[] }

function reportLabel(report: NonNullable<ContactRequest["reporte"]>) {
  const species = report.especie === "perro" ? "Perro" : "Gato"
  const type =
    report.tipo === "perdido" ? "perdido" : report.tipo === "encontrado" ? "encontrado" : "visto en la calle"
  return report.nombre || `${species} ${type}`
}

export default function MyCasesPage() {
  const router = useRouter()
  const { user, ready, logout } = useAuth()
  const [reports, setReports] = useState<PublicReport[]>([])
  const [contacts, setContacts] = useState<ContactRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!ready) return
    if (!user) {
      setLoading(false)
      return
    }
    Promise.all([
      apiFetch<PaginatedReports | PublicReport[]>("/reportes/mios/").catch(() => []),
      apiFetch<Paginated<ContactRequest> | ContactRequest[]>("/contacto/").catch(() => []),
    ])
      .then((results) => {
        const reportResult = results[0] as PaginatedReports | PublicReport[]
        setReports(Array.isArray(reportResult) ? reportResult : reportResult.results)
        const contactResult = results[1] as Paginated<ContactRequest> | ContactRequest[]
        setContacts(Array.isArray(contactResult) ? contactResult : contactResult.results)
      })
      .catch((requestError) =>
        setError(requestError instanceof Error ? requestError.message : "No pudimos cargar tus casos.")
      )
      .finally(() => setLoading(false))
  }, [ready, user])

  const deleteAccount = async () => {
    if (!window.confirm("¿Eliminar tu cuenta y solicitar la eliminación de tus datos?")) return
    try {
      await apiFetch("/cuentas/yo/", { method: "DELETE" })
      logout()
      router.push("/")
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No pudimos solicitar la eliminación.")
    }
  }

  if (!ready) return null
  if (!user) {
    return (
      <section className="mx-auto max-w-[640px] px-4 pt-10 pb-28">
        <h1>Mis casos</h1>
        <Notice tone="privacy" className="mt-5" title="Ingresa para ver tus casos">
          Tus reportes, candidatos y solicitudes de contacto están protegidos.
        </Notice>
        <Button className="mt-5" onClick={() => router.push("/ingresar")}>Ingresar</Button>
      </section>
    )
  }

  const respond = async (id: string, action: "aceptar" | "rechazar") => {
    setError("")
    try {
      const updated = await apiFetch<ContactRequest>(`/contacto/${id}/${action}/`, { method: "POST" })
      setContacts((current) =>
        current.map((item) => (item.id === id ? updated : item))
      )
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No pudimos responder.")
    }
  }

  return (
    <section className="mx-auto max-w-[960px] px-4 pt-8 pb-28">
      <div className="flex items-end justify-between gap-4">
        <div>
          <span className="text-[13px] font-medium text-meta">Panel de usuario</span>
          <h1 className="mt-1">Hola{user.nombre_publico ? `, ${user.nombre_publico}` : ""}</h1>
        </div>
        <Button variant="outline" onClick={logout}>Salir</Button>
      </div>

      {error ? <Notice tone="danger" className="mt-5" title="Ocurrió un problema">{error}</Notice> : null}

      <div className="mt-6 grid grid-cols-2 gap-3 desk:grid-cols-4">
        <div className="rounded-tile border border-line bg-paper p-4"><strong className="text-3xl">{reports.filter((r) => r.estado !== "resuelto" && r.estado !== "cerrado").length}</strong><p className="text-sm text-meta">Casos activos</p></div>
        <div className="rounded-tile border border-line bg-paper p-4"><strong className="text-3xl">{contacts.length}</strong><p className="text-sm text-meta">Solicitudes</p></div>
        <div className="rounded-tile border border-line bg-paper p-4"><strong className="text-3xl">{reports.filter((r) => r.estado === "resuelto").length}</strong><p className="text-sm text-meta">Reencuentros</p></div>
        <div className="rounded-tile border border-line bg-paper p-4"><strong className="text-3xl">{user.nivel_verificacion}</strong><p className="text-sm text-meta">Nivel verificado</p></div>
      </div>

      <h2 className="mt-10">Tus reportes</h2>
      {loading ? <Notice className="mt-4" title="Cargando">Recuperando tus casos…</Notice> : null}
      {!loading && reports.length === 0 ? (
        <Notice className="mt-4" title="Todavía no tienes reportes">
          Publica una mascota perdida o encontrada para comenzar.
        </Notice>
      ) : null}
      <div className="mt-4 grid gap-3 desk:grid-cols-2">
        {reports.map((report) => (
          <article key={report.id} className="flex gap-3 rounded-panel border border-line bg-paper p-3">
            {report.fotos[0]?.recorte ? (
              <img
                className="size-24 rounded-tile object-cover"
                src={apiAssetUrl(report.fotos[0].recorte)}
                alt={report.nombre || `Reporte de ${report.especie}`}
              />
            ) : (
              <div className="size-24 rounded-tile bg-surface" />
            )}
            <div className="min-w-0 flex-1">
              <CaseState state={report.estado} />
              <h3 className="mt-2 text-xl">{report.nombre || `${report.especie === "perro" ? "Perro" : "Gato"} ${report.tipo}`}</h3>
              <p className="text-sm text-meta">{report.zona.nombre}</p>
              <Link className="mt-2 inline-block text-sm font-medium underline underline-offset-4" href={`/casos/${report.id}`}>
                Ver caso
              </Link>
              {report.estado !== "resuelto" && report.estado !== "cerrado" ? (
                <Link className="ml-4 mt-2 inline-block text-sm font-medium underline underline-offset-4" href={`/buscar?report=${report.id}`}>
                  Buscar candidatos
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <h2 className="mt-10">Solicitudes de contacto</h2>
      {contacts.length === 0 ? (
        <Notice className="mt-4" title="No tienes solicitudes">
          Cuando confirmes un candidato podrás iniciar el contacto.
        </Notice>
      ) : (
        <div className="mt-4 grid gap-3">
          {contacts.map((contact) => (
            <article key={contact.id} className="rounded-panel border border-line bg-paper p-4">
              <p className="text-sm font-medium">
                {contact.estado === "rechazado"
                  ? "Solicitud rechazada"
                  : contact.estado === "abierto"
                    ? "Las dos partes aceptaron"
                    : contact.soy === "receptor"
                      ? "Nueva solicitud: decide si aceptas el contacto"
                      : "Esperando la respuesta de la otra parte"}
              </p>
              {contact.reporte ? (
                <p className="mt-2 text-sm text-meta">
                  Reporte relacionado: <strong className="text-ink">{reportLabel(contact.reporte)}</strong>
                  {contact.reporte.zona ? ` · ${contact.reporte.zona}` : ""}
                </p>
              ) : null}
              {contact.mensaje_inicial ? <p className="mt-2">{contact.mensaje_inicial}</p> : null}
              {contact.estado === "abierto" ? (
                <p className="mt-2 font-mono text-sm">Contacto revelado: {contact.telefono_otra_parte}</p>
              ) : (
                <p className="mt-2 font-mono text-sm">Contacto protegido: {contact.telefono_otra_parte}</p>
              )}
              {contact.soy === "receptor" && contact.estado === "esperando" && !contact.acepto_receptor_en ? (
                <div className="mt-4 flex gap-2">
                  <Button variant="tonal" onClick={() => respond(contact.id, "rechazar")}>Rechazar</Button>
                  <Button onClick={() => respond(contact.id, "aceptar")}>Aceptar contacto</Button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}

      <h2 className="mt-10">Mi perfil</h2>
      <div className="mt-4 rounded-panel border border-line bg-paper p-5">
        <p><strong>Celular:</strong> {user.celular}</p>
        <p className="mt-1 text-sm text-meta">Número verificado. No se muestra públicamente.</p>
        <Button variant="danger" className="mt-5" onClick={deleteAccount}>Eliminar cuenta y datos</Button>
      </div>
    </section>
  )
}
