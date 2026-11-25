"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Consent, Field, Notice, Steps } from "@/components/pawconnect/form"
import { PhotoSlots } from "@/components/pawconnect/photo-slots"
import { Icon } from "@/components/pawconnect/icon"
import { apiFetch } from "@/lib/api"
import { useAuth } from "@/lib/auth"

type ReportType = "perdido" | "encontrado" | "visto"

type ReportResponse = {
  id: string
  tipo: ReportType
  nombre?: string
}

export function ReportFlow({ initialType }: { initialType: ReportType }) {
  const router = useRouter()
  const { user, ready } = useAuth()
  const fileInput = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(1)
  const [photos, setPhotos] = useState<{ file: File; src: string; rejected?: boolean; reason?: string }[]>([])
  const [species, setSpecies] = useState<"perro" | "gato">("perro")
  const [name, setName] = useState("")
  const [date, setDate] = useState("")
  const [zone, setZone] = useState("")
  const [lat, setLat] = useState("")
  const [lng, setLng] = useState("")
  const [features, setFeatures] = useState("")
  const [size, setSize] = useState("")
  const [locationConsent, setLocationConsent] = useState(false)
  const [hour, setHour] = useState("")
  const [care, setCare] = useState("")
  const [injured, setInjured] = useState(false)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setDate(new Date().toISOString().slice(0, 10))
  }, [])

  const addPhotos = (files: FileList | null) => {
    if (!files) return
    const next = Array.from(files).slice(0, 5 - photos.length)
    setPhotos((current) => [
      ...current,
      ...next.map((file) => ({ file, src: URL.createObjectURL(file) })),
    ])
  }

  const locate = () => {
    setError("")
    if (!navigator.geolocation) {
      setError("Este navegador no permite obtener tu ubicación.")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toFixed(6))
        setLng(position.coords.longitude.toFixed(6))
      },
      () => setError("No pudimos obtener tu ubicación. Puedes escribirla manualmente."),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const publish = async () => {
    setError("")
    if (!lat || !lng || !zone) {
      setError("Completa el barrio o localidad y la ubicación.")
      return
    }
    if (!locationConsent) {
      setError("Debes autorizar específicamente el uso de la ubicación.")
      return
    }
    if (photos.length === 0) {
      setError("Agrega al menos una foto.")
      return
    }
    setBusy(true)
    try {
      const report = await apiFetch<ReportResponse>("/reportes/", {
        method: "POST",
        body: JSON.stringify({
          tipo: initialType,
          especie: species,
          nombre: name,
          rasgos: features,
          tamano: size,
          fecha_evento: date,
          zona_nombre: zone,
          lat: Number(lat),
          lng: Number(lng),
          autoriza_ubicacion: locationConsent,
          version_texto_ubicacion: "2026-11",
          hora_aproximada: initialType === "visto" ? hour : "",
          direccion_movimiento: "",
          puede_cuidarlo: initialType === "encontrado" ? care : "",
          herido: initialType === "encontrado" ? injured : false,
        }),
      })

      let acceptedPhotoCount = 0
      for (const photo of photos) {
        const form = new FormData()
        form.append("foto", photo.file)
        try {
          await apiFetch(`/reportes/${report.id}/fotos/`, { method: "POST", body: form })
          acceptedPhotoCount += 1
        } catch (photoError) {
          const message =
            photoError instanceof Error ? photoError.message : "No pudimos procesar una foto."
          setPhotos((current) =>
            current.map((item) =>
              item.file === photo.file
                ? { ...item, rejected: true, reason: message }
                : item
            )
          )
        }
      }

      if (acceptedPhotoCount === 0) {
        try {
          await apiFetch(`/reportes/${report.id}/cancelar/`, { method: "DELETE" })
          setError("Ninguna foto fue aceptada y el reporte no se publicó. Toma una foto más clara donde se vea el animal.")
        } catch (cleanupError) {
          const message =
            cleanupError instanceof Error ? cleanupError.message : "No pudimos limpiar el reporte incompleto."
          setError(`Ninguna foto fue aceptada. No pudimos eliminar el reporte incompleto: ${message}`)
        }
        return
      }

      const stored = JSON.parse(localStorage.getItem("pawconnect_reportes") || "[]") as string[]
      localStorage.setItem(
        "pawconnect_reportes",
        JSON.stringify([report.id, ...stored.filter((id) => id !== report.id)].slice(0, 20))
      )

      await apiFetch(`/reportes/${report.id}/candidatos/`, { method: "POST" })
      router.push(`/buscar?report=${report.id}`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No pudimos publicar el reporte.")
    } finally {
      setBusy(false)
    }
  }

  if (!ready) return null
  if (!user) {
    return (
      <section className="mx-auto max-w-[640px] px-4 pt-10 desk:pt-16">
        <Notice tone="privacy" title="Primero necesitas una cuenta">
          Verifica tu celular para publicar reportes y proteger el contacto.
        </Notice>
        <Button className="mt-4" onClick={() => router.push("/ingresar")}>
          Ingresar con celular
        </Button>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-[760px] px-4 pt-6 pb-28 desk:pt-12">
      <Steps current={step} total={3} />
      <h1 className="mt-4 text-[clamp(30px,4vw,48px)] tracking-[-0.04em]">
        {initialType === "perdido"
          ? "Perdí a mi mascota"
          : initialType === "encontrado"
            ? "Encontré un animal"
            : "Vi un animal en la calle"}
      </h1>

      {error ? <Notice tone="danger" className="mt-5" title="Revisa estos datos">{error}</Notice> : null}

      {step === 1 ? (
        <div className="mt-6 flex flex-col gap-5">
          <Notice tone="privacy" title="La foto como protagonista">
            Usa fotos claras donde se vean la cara y el pelaje. Puedes subir hasta cinco.
          </Notice>
          <PhotoSlots
            photos={photos.map((photo) => ({
              src: photo.src,
              alt: "Foto seleccionada para el reporte",
              rejected: photo.rejected,
              reason: photo.reason,
            }))}
            onAdd={() => fileInput.current?.click()}
            onRemove={(index) =>
              setPhotos((current) => current.filter((_, itemIndex) => itemIndex !== index))
            }
          />
          <input
            ref={fileInput}
            className="hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            multiple
            onChange={(event) => addPhotos(event.target.files)}
          />
          <Button block disabled={photos.length === 0} onClick={() => setStep(2)}>
            Continuar
          </Button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {initialType !== "visto" ? (
            <Field label="Nombre" help="Solo si lo conoces." className="sm:col-span-2">
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. Toby" />
            </Field>
          ) : null}
          <Field label="Especie">
            <div className="grid grid-cols-2 gap-2">
              {(["perro", "gato"] as const).map((item) => (
                <button
                  type="button"
                  key={item}
                  aria-pressed={species === item}
                  onClick={() => setSpecies(item)}
                  className="h-12 rounded-full border border-line-strong text-sm font-medium aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-ground"
                >
                  {item === "perro" ? "Perro" : "Gato"}
                </button>
              ))}
            </div>
          </Field>
          <Field label={initialType === "perdido" ? "Fecha de pérdida" : "Fecha del hallazgo"}>
            <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </Field>
          <Field label="Barrio o localidad" className="sm:col-span-2">
            <Input value={zone} onChange={(event) => setZone(event.target.value)} placeholder="Ej. Suba" />
          </Field>
          <Field label="Rasgos" className="sm:col-span-2">
            <textarea
              className="min-h-24 w-full rounded-tile border border-line-strong bg-paper px-3.5 py-3 text-base outline-none focus:border-ink"
              value={features}
              onChange={(event) => setFeatures(event.target.value)}
              placeholder="Color, collar, pelaje, señas particulares"
            />
          </Field>
          <Field label="Tamaño">
            <select
              className="h-12 w-full rounded-field border border-line-strong bg-paper px-3.5"
              value={size}
              onChange={(event) => setSize(event.target.value)}
            >
              <option value="">Selecciona</option>
              <option value="pequeno">Pequeño</option>
              <option value="mediano">Mediano</option>
              <option value="grande">Grande</option>
            </select>
          </Field>
          {initialType === "visto" ? (
            <Field label="Hora aproximada">
              <Input value={hour} onChange={(event) => setHour(event.target.value)} placeholder="Ej. 8:30 a. m." />
            </Field>
          ) : null}
          {initialType === "encontrado" ? (
            <>
              <Field label="¿Puedes cuidarlo temporalmente?">
                <Input value={care} onChange={(event) => setCare(event.target.value)} placeholder="Ej. Sí, en casa" />
              </Field>
              <Field label="¿Está herido?">
                <div className="grid grid-cols-2 gap-2">
                  {[false, true].map((item) => (
                    <button
                      type="button"
                      key={String(item)}
                      aria-pressed={injured === item}
                      onClick={() => setInjured(item)}
                      className="h-12 rounded-full border border-line-strong text-sm font-medium aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-ground"
                    >
                      {item ? "Sí" : "No"}
                    </button>
                  ))}
                </div>
              </Field>
            </>
          ) : null}
          <div className="flex gap-2 sm:col-span-2">
            <Button variant="tonal" onClick={() => setStep(initialType === "visto" ? 2 : 1)}>Atrás</Button>
            <Button block onClick={() => setStep(3)}>Continuar</Button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="mt-6 flex flex-col gap-5">
          <Notice tone="privacy" title="Tu ubicación queda protegida">
            El público verá un círculo aproximado de 500 m, nunca tu coordenada exacta.
          </Notice>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Latitud">
              <Input value={lat} onChange={(event) => setLat(event.target.value)} inputMode="decimal" placeholder="4.7410" />
            </Field>
            <Field label="Longitud">
              <Input value={lng} onChange={(event) => setLng(event.target.value)} inputMode="decimal" placeholder="-74.0840" />
            </Field>
          </div>
          <Button variant="tonal" onClick={locate}>
            <Icon name="zone" /> Usar mi ubicación actual
          </Button>
          <Consent
            title="Autorizo el uso de esta ubicación"
            checked={locationConsent}
            onCheckedChange={setLocationConsent}
          >
            Se guardará como dato privado y solo se mostrará el área aproximada.
          </Consent>
          <div className="flex gap-2">
            <Button variant="tonal" onClick={() => setStep(2)}>Atrás</Button>
            <Button block disabled={busy} onClick={publish}>
              {busy ? "Publicando…" : "Publicar y buscar coincidencias"}
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
