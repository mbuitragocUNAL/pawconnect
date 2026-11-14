"use client"

import { useState } from "react"
import { toast } from "sonner"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { CandidateRow, SimilarityAxis } from "@/components/pawconnect/candidates"
import { CaseTimeline } from "@/components/pawconnect/case-timeline"
import { ContactKeys, MaskedPhone } from "@/components/pawconnect/contact"
import { CropFrame } from "@/components/pawconnect/crop-frame"
import { DecisionBar } from "@/components/pawconnect/decision-bar"
import { Consent, Field, Notice, Steps } from "@/components/pawconnect/form"
import { Icon, iconNames } from "@/components/pawconnect/icon"
import { PhotoSlots, type SlotPhoto } from "@/components/pawconnect/photo-slots"
import { ReportCard, ReportRow } from "@/components/pawconnect/report-card"
import { Seal } from "@/components/pawconnect/seal"
import { CaseState, ReportTag } from "@/components/pawconnect/tags"
import { ZoneMap } from "@/components/pawconnect/zone-map"
import { byId, sampleReports } from "@/lib/sample"

function Block({
  id,
  title,
  lead,
  children,
  className,
}: {
  id: string
  title: string
  lead?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-line pt-8 pb-12">
      <div className="mb-6 flex max-w-[44em] flex-col gap-2">
        <h2 className="text-[clamp(24px,1vw+18px,32px)]">{title}</h2>
        {lead ? <p className="text-meta">{lead}</p> : null}
      </div>
      <div className={className}>{children}</div>
    </section>
  )
}

function Spec({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-xs text-meta">{children}</span>
}

const swatches: { name: string; token: string; hex: string; use: string; dark?: boolean }[] = [
  { name: "Tinta", token: "ink", hex: "#2d1659", use: "Texto, encontrado, foco", dark: true },
  { name: "Acción", token: "action", hex: "#cc2f70", use: "Una acción por vista, perdido", dark: true },
  { name: "Fondo", token: "ground", hex: "#fbf9f7", use: "Fondo de la app" },
  { name: "Superficie", token: "surface", hex: "#efedef", use: "Botón tonal, avisos" },
  { name: "Papel", token: "paper", hex: "#ffffff", use: "Tarjetas y campos" },
  { name: "Meta", token: "meta", hex: "#574b7d", use: "Texto secundario", dark: true },
]

const states: { name: string; fg: string; bg: string; use: string }[] = [
  { name: "Activo", fg: "#1f4f99", bg: "#e6eefa", use: "Caso abierto" },
  { name: "En seguimiento", fg: "#7a4f00", bg: "#f8ecd2", use: "Hay un candidato o contacto" },
  { name: "Resuelto", fg: "#1b6b43", bg: "#e1f0e6", use: "Reencuentro confirmado" },
  { name: "Cerrado", fg: "#57525e", bg: "#ebe9ee", use: "Sin resultado" },
  { name: "Error / urgencias", fg: "#a8231b", bg: "#fbe6e3", use: "Solo errores y 24 h" },
]

const principles = [
  ["La ubicación es un círculo", "Un reporte siempre es un área de 500 m. Un lugar fijo es un punto sólido."],
  ["Solo queda el recorte", "Toda foto de un animal va dentro de las cuatro esquinas."],
  ["El orden es la única señal", "Los candidatos van numerados. Nunca un porcentaje ni una barra."],
  ["La persona decide", "La decisión va fija abajo, al alcance del pulgar."],
  ["Dos llaves para el contacto", "El teléfono se ve solo cuando las dos partes aceptan."],
  ["Nada viene marcado", "Ningún consentimiento ni permiso empieza marcado."],
] as const

const nav = [
  ["principios", "Principios"],
  ["color", "Color"],
  ["tipo", "Tipografía"],
  ["botones", "Botones"],
  ["etiquetas", "Etiquetas"],
  ["formularios", "Formularios"],
  ["fotos", "Fotos"],
  ["mapa", "Mapa"],
  ["tarjetas", "Tarjetas"],
  ["candidatos", "Candidatos"],
  ["contacto", "Contacto"],
  ["sellos", "Sellos"],
  ["caso", "Caso"],
  ["capas", "Capas"],
  ["iconos", "Iconos"],
] as const

export function Showcase() {
  const [species, setSpecies] = useState<string[]>(["perro"])
  const [when, setWhen] = useState<string[]>(["ahora"])
  const [consent, setConsent] = useState(false)
  const [alerts, setAlerts] = useState(true)
  const [photos, setPhotos] = useState<SlotPhoto[]>([
    { src: "/img/toby.jpg", alt: "Toby de frente" },
    { src: "/img/dorado.jpg", alt: "Toby sobre el pasto" },
    { src: "/img/oscura.jpg", alt: "Foto oscura sin animal visible", rejected: true, reason: "Muy oscura" },
  ])
  const extra = ["/img/canela.jpg", "/img/lucas.jpg"]
  const [picked, setPicked] = useState(1)
  const [gone, setGone] = useState<string[]>([])
  const [otherAccepted, setOtherAccepted] = useState(false)

  const candidates = sampleReports.filter((r) => r.type !== "perdido" && !gone.includes(r.id))

  return (
    <div className="mx-auto max-w-[1280px] px-4 desk:px-8">
      <header className="flex flex-col gap-4 pt-8 pb-10 desk:pt-14">
        <span className="text-[13px] font-medium text-meta">Lenguaje de diseño v0.1 · React</span>
        <h1 className="max-w-[16em] text-[clamp(34px,2.6vw+22px,64px)] leading-[1.02] tracking-[-0.04em]">
          Sistema de diseño de PawConnect
        </h1>
        <p className="max-w-[40em] text-lg">
          Todos los componentes de la app, con datos de ejemplo. Los primitivos vienen de shadcn/ui sobre Base
          UI, pintados con nuestros tokens; los motivos (recorte, zona, dos llaves, sello) son propios.
        </p>
        <nav aria-label="Secciones" className="flex flex-wrap gap-2 pt-2">
          {nav.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="inline-flex h-9 items-center rounded-full border border-line-strong px-3.5 text-sm font-medium no-underline hover:bg-surface"
            >
              {label}
            </a>
          ))}
        </nav>
      </header>

      <Block id="principios" title="Seis principios" className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-x-6 gap-y-8">
        {principles.map(([t, d], i) => (
          <div key={t} className="flex flex-col gap-2 border-t-2 border-ink pt-4">
            <span className="font-mono text-[13px] text-meta">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="text-[22px]">{t}</h3>
            <p>{d}</p>
          </div>
        ))}
      </Block>

      <Block
        id="color"
        title="Color"
        lead="Tinta y magenta de la marca. El magenta es la acción: una sola vez por vista. Los estados del caso tienen su propio código y no se mezclan con el tipo de reporte."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 desk:grid-cols-6">
          {swatches.map((s) => (
            <div key={s.token} className="overflow-hidden rounded-tile border border-line bg-paper">
              <div className="h-24" style={{ background: s.hex }} />
              <div className="flex flex-col gap-0.5 p-3">
                <strong className="font-medium">{s.name}</strong>
                <Spec>
                  {s.token} · {s.hex}
                </Spec>
                <span className="text-[13px] text-meta">{s.use}</span>
              </div>
            </div>
          ))}
        </div>
        <h3 className="mt-8 mb-3 text-lg">Estados del caso</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 desk:grid-cols-5">
          {states.map((s) => (
            <div key={s.name} className="flex items-center gap-3 rounded-tile p-3" style={{ background: s.bg, color: s.fg }}>
              <span className="size-3 rounded-full bg-current" />
              <span className="min-w-0">
                <strong className="block font-medium">{s.name}</strong>
                <span className="text-[13px] text-ink">{s.use}</span>
              </span>
            </div>
          ))}
        </div>
      </Block>

      <Block id="tipo" title="Tipografía" lead="Funnel Display para títulos, Funnel Sans para el texto y DM Mono para datos: fechas, posiciones, números ocultos." className="flex flex-col gap-6">
        {[
          ["Display · 64 / 1.02 · −4 %", "text-[clamp(36px,2.6vw+22px,64px)] font-heading leading-[1.02] tracking-[-0.04em]", "¿Perdiste o encontraste un perro o un gato?"],
          ["Display · 42 / 1.08 · −3 %", "text-[clamp(28px,1.4vw+20px,42px)] font-heading leading-[1.08] tracking-[-0.03em]", "Reportes recientes en Bogotá"],
          ["Display · 22", "text-[22px] font-heading tracking-[-0.03em]", "Revisas cinco candidatos"],
          ["Sans · 16 / 1.55", "text-base", "Publica su foto. PawConnect la compara con los reportes de la zona y te muestra cinco posibles coincidencias."],
          ["Sans · 13 medium", "text-[13px] font-medium text-meta", "Paso 2 de 4"],
          ["Mono · 13", "font-mono text-[13px]", "12 nov · 18:40 · 01 02 03"],
        ].map(([spec, cls, sample]) => (
          <div key={spec} className="grid gap-1 desk:grid-cols-[220px_1fr] desk:items-baseline desk:gap-6">
            <Spec>{spec}</Spec>
            <p className={cls}>{sample}</p>
          </div>
        ))}
      </Block>

      <Block id="botones" title="Botones" lead="Píldoras de 48 px. Un primario magenta por vista y un tonal a su lado; el resto es contorno, fantasma o enlace." className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Publicar reporte</Button>
          <Button variant="tonal">Ingresar</Button>
          <Button variant="outline">Ver en el mapa</Button>
          <Button variant="ghost">Cancelar</Button>
          <Button variant="ink">Enviar solicitud</Button>
          <Button variant="link">Términos de uso</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg">
            <Icon name="camera" />
            Subir fotos
          </Button>
          <Button size="sm" variant="tonal">
            Filtrar
          </Button>
          <Button size="icon" variant="tonal" aria-label="Notificaciones">
            <Icon name="bell" />
          </Button>
          <Button disabled>Publicar (desactivado)</Button>
          <Button variant="danger">Eliminar mi cuenta</Button>
        </div>
      </Block>

      <Block id="etiquetas" title="Etiquetas y filtros" className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Spec>Tipo de reporte</Spec>
          <div className="flex flex-wrap gap-2">
            <ReportTag type="perdido" />
            <ReportTag type="encontrado" />
            <ReportTag type="visto" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Spec>Estado del caso (RF-06)</Spec>
          <div className="flex flex-wrap gap-2">
            <CaseState state="activo" />
            <CaseState state="seguimiento" />
            <CaseState state="resuelto" />
            <CaseState state="cerrado" />
            <CaseState state="urgente" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Spec>Chips · varios a la vez</Spec>
          <ToggleGroup multiple value={species} onValueChange={(v) => setSpecies(v as string[])} aria-label="Especie">
            <ToggleGroupItem value="perro">Perros</ToggleGroupItem>
            <ToggleGroupItem value="gato">Gatos</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="flex flex-col gap-2">
          <Spec>Chips · una respuesta</Spec>
          <ToggleGroup value={when} onValueChange={(v) => setWhen(v as string[])} aria-label="¿Cuándo lo viste?">
            <ToggleGroupItem value="ahora">Ahora</ToggleGroupItem>
            <ToggleGroupItem value="hora">Hace 1 hora</ToggleGroupItem>
            <ToggleGroupItem value="hoy">Hoy más temprano</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </Block>

      <Block id="formularios" title="Formularios" className="grid gap-10 desk:grid-cols-2">
        <div className="flex flex-col gap-5">
          <Steps current={3} total={4} />
          <Field label="Nombre del animal" htmlFor="f-nombre" help="Si no lo sabes, déjalo vacío.">
            <Input id="f-nombre" placeholder="Toby" />
          </Field>
          <Field label="Barrio donde se perdió" htmlFor="f-zona" error="Escribe un barrio o elige en el mapa.">
            <Input id="f-zona" aria-invalid placeholder="Suba" />
          </Field>
          <Field label="Rasgos" htmlFor="f-rasgos">
            <Textarea id="f-rasgos" placeholder="Collar rojo, una oreja caída, cojea un poco." />
          </Field>
          <Consent
            title="Autorizo mostrar un área aproximada de 500 m"
            checked={consent}
            onCheckedChange={setConsent}
          >
            Nunca mostramos la dirección exacta. Puedes retirar el permiso cuando quieras.
          </Consent>
          <Button block disabled={!consent}>
            Publicar y buscar coincidencias
          </Button>
        </div>
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4 rounded-tile border border-line bg-paper p-4">
            <span>
              <strong className="block font-medium">Alertas en mi zona</strong>
              <span className="text-sm text-meta">Suba, a menos de 5 km</span>
            </span>
            <Switch checked={alerts} onCheckedChange={setAlerts} aria-label="Alertas en mi zona" />
          </div>
          <Field label="Código que te enviamos por SMS" help="Vence en 01:42.">
            <InputOTP maxLength={6} autoComplete="one-time-code" aria-label="Código de 6 dígitos">
              <InputOTPGroup>
                {Array.from({ length: 6 }, (_, i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </Field>
          <Notice tone="privacy" title="Tu ubicación está protegida">
            Mostramos solo un área de 500 m. Nadie ve tu dirección.
          </Notice>
          <Notice title="Tú decides, no el sistema.">
            Te mostramos los más parecidos primero, sin porcentajes.
          </Notice>
          <Notice tone="danger" title="¿Está herido?">
            Hay 3 veterinarias de urgencias 24 h a menos de 4 km.
          </Notice>
        </div>
      </Block>

      <Block
        id="fotos"
        title="Fotos dentro del recorte"
        lead="Toda foto de un animal va dentro de las cuatro esquinas: guardamos solo el recorte (RN-04). Una foto rechazada se queda a la vista con el motivo (RF-03)."
        className="flex flex-col gap-8"
      >
        <div className="flex flex-wrap gap-4">
          <CropFrame src="/img/toby.jpg" alt="Toby" className="size-40" large badge={<><Icon name="check" className="size-4" />Animal detectado</>} sizes="160px" />
          <CropFrame src="/img/oscura.jpg" alt="Foto oscura" className="size-40" large rejected sizes="160px" />
          <CropFrame src="/img/mora.jpg" alt="Mora" className="size-24" sizes="96px" />
          <CropFrame src="/img/negra.jpg" alt="Negra" className="size-16 rounded-[12px]" sizes="64px" />
        </div>
        <div className="max-w-[560px]">
          <Spec>De 1 a 5 fotos (RF-02)</Spec>
          <PhotoSlots
            className="mt-2"
            photos={photos}
            onRemove={(i) => setPhotos((p) => p.filter((_, j) => j !== i))}
            onAdd={() =>
              setPhotos((p) =>
                p.length >= 5 ? p : [...p, { src: extra[p.length % 2], alt: "Foto agregada" }]
              )
            }
          />
        </div>
      </Block>

      <Block
        id="mapa"
        title="La ubicación es un círculo"
        lead="Un reporte es un área punteada de 500 m, nunca un punto exacto (RF-15). Un lugar fijo, como una veterinaria, sí es un punto sólido. La app real usará MapLibre con los mismos colores (zonePaint)."
      >
        <ZoneMap
          className="h-[340px] rounded-panel border border-line desk:h-[420px]"
          zones={[
            { x: 0.25, y: 0.29, type: "perdido" },
            { x: 0.7, y: 0.43, type: "encontrado" },
            { x: 0.43, y: 0.71, type: "visto" },
          ]}
          places={[
            { x: 0.12, y: 0.62 },
            { x: 0.9, y: 0.16, urgent: true },
          ]}
        >
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <ReportTag type="perdido" />
            <ReportTag type="encontrado" />
            <ReportTag type="visto" className="bg-ground" />
          </div>
        </ZoneMap>
      </Block>

      <Block id="tarjetas" title="Tarjetas de reporte" className="grid gap-8 desk:grid-cols-[1fr_1.4fr]">
        <div className="flex flex-col gap-2.5">
          <Spec>Fila · listas y mapa</Spec>
          <ReportRow report={byId("anden")} href="#tarjetas" />
          <ReportRow report={byId("lucas")} href="#tarjetas" />
          <ReportRow report={byId("mora")} href="#tarjetas" />
        </div>
        <div className="flex flex-col gap-2.5">
          <Spec>Tarjeta · cuadrículas</Spec>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
            <ReportCard report={byId("toby")} href="#tarjetas" />
            <ReportCard report={byId("gato-bn")} href="#tarjetas" />
          </div>
        </div>
      </Block>

      <Block
        id="candidatos"
        title="El orden es la única señal"
        lead="Cinco candidatos numerados, del más parecido al menos. Sin porcentajes (RN-02). Descartar uno lo quita de la lista (HU-05)."
        className="max-w-[640px]"
      >
        <SimilarityAxis className="mb-2" />
        <div role="list">
          {candidates.map((r, i) => (
            <div role="listitem" key={r.id}>
              <CandidateRow position={i + 1} report={r} selected={picked === i} onSelect={() => setPicked(i)} />
            </div>
          ))}
        </div>
        <DecisionBar hint="Revisa la foto con calma. Puedes volver a la lista." className="mt-4">
          <Button
            variant="tonal"
            onClick={() => {
              const r = candidates[picked]
              if (!r) return
              setGone((g) => [...g, r.id])
              setPicked(0)
              toast(`Descartaste a “${r.title}”`, {
                action: { label: "Deshacer", onClick: () => setGone((g) => g.filter((x) => x !== r.id)) },
              })
            }}
          >
            No es
          </Button>
          <Button onClick={() => toast.success("Le pedimos el contacto a quien lo encontró.")}>Sí, puede ser</Button>
        </DecisionBar>
      </Block>

      <Block id="contacto" title="Dos llaves para el contacto" lead="El número se revela solo cuando las dos partes aceptan (RN-05)." className="grid max-w-[640px] gap-4">
        <ContactKeys
          me={{ name: "Tú", role: "Buscas a Toby", accepted: true }}
          other={{ name: "Quien lo encontró", role: "Reporte en Chapinero", accepted: otherAccepted }}
        />
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-tile bg-surface p-4">
          <MaskedPhone lastDigits="47" revealed={otherAccepted ? "+57 312 555 0147" : undefined} />
          <Button variant="outline" size="sm" onClick={() => setOtherAccepted((v) => !v)}>
            {otherAccepted ? "Volver a ocultar" : "Simular: la otra parte acepta"}
          </Button>
        </div>
      </Block>

      <Block id="sellos" title="Sellos de verificación" lead="Tres niveles (RF-14). Un sello puede estar en revisión o ser retirado." className="flex flex-wrap gap-2">
        <Seal level={1} showLevel />
        <Seal level={2} showLevel />
        <Seal level={3} showLevel />
        <Seal level={2} status="pending" />
        <Seal level={3} status="removed" />
      </Block>

      <Block id="caso" title="Historial del caso" lead="Cada cambio con su fecha (RF-06). Punto lleno: cambio de estado." className="grid gap-8 desk:grid-cols-[1fr_1fr]">
        <div className="rounded-panel border border-line bg-paper p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-[22px]">Toby</h3>
            <CaseState state="seguimiento" />
          </div>
          <CaseTimeline
            events={[
              { title: "Solicitud de contacto aceptada", at: "14 nov · 09:12", state: "seguimiento", milestone: true },
              { title: "Confirmaste el candidato 01", detail: "Perro café, collar negro · Chapinero", at: "13 nov · 21:05" },
              { title: "Descartaste 2 candidatos", at: "13 nov · 20:58" },
              { title: "Reporte publicado", detail: "5 posibles coincidencias", at: "12 nov · 18:40", state: "activo", milestone: true },
            ]}
          />
        </div>
      </Block>

      <Block id="capas" title="Capas" lead="En el teléfono, los pasos secundarios suben como hoja inferior. Las confirmaciones irreversibles van en un diálogo." className="flex flex-wrap gap-3">
        <Sheet>
          <SheetTrigger render={<Button variant="tonal" />}>
            <Icon name="sliders" />
            Filtros
          </SheetTrigger>
          <SheetContent side="bottom" className="p-5">
            <SheetHeader className="p-0">
              <SheetTitle className="font-heading text-2xl font-normal">Filtrar reportes</SheetTitle>
              <SheetDescription>Misma especie, a menos de 15 km, últimos 60 días.</SheetDescription>
            </SheetHeader>
            <ToggleGroup multiple defaultValue={["perro"]} aria-label="Especie">
              <ToggleGroupItem value="perro">Perros</ToggleGroupItem>
              <ToggleGroupItem value="gato">Gatos</ToggleGroupItem>
            </ToggleGroup>
            <ToggleGroup multiple defaultValue={["perdido", "encontrado", "visto"]} aria-label="Tipo">
              <ToggleGroupItem value="perdido">Perdidos</ToggleGroupItem>
              <ToggleGroupItem value="encontrado">Encontrados</ToggleGroupItem>
              <ToggleGroupItem value="visto">Vistos en la calle</ToggleGroupItem>
            </ToggleGroup>
            <Button block>Ver 24 reportes</Button>
          </SheetContent>
        </Sheet>
        <Dialog>
          <DialogTrigger render={<Button variant="outline" />}>Eliminar mi cuenta</DialogTrigger>
          <DialogContent className="gap-5 p-6 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl font-normal">¿Eliminar tu cuenta y tus datos?</DialogTitle>
              <DialogDescription className="text-base text-meta">
                Borramos tus reportes, fotos y conversaciones en un plazo de 15 días hábiles (RF-13). No se puede
                deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="m-0 flex-row gap-2 border-0 bg-transparent p-0 sm:justify-end">
              <DialogClose render={<Button variant="tonal" />}>Cancelar</DialogClose>
              <DialogClose render={<Button variant="danger" />} onClick={() => toast("Solicitud de borrado enviada.")}>
                Eliminar
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button variant="ghost" onClick={() => toast("Alerta: un perro parecido a Toby, visto en Suba hace 10 min.")}>
          Mostrar un aviso
        </Button>
      </Block>

      <Block id="iconos" title="Iconos" lead="Propios: cuadrícula de 24 px, trazo de 1,75." className="grid grid-cols-4 gap-2 sm:grid-cols-6 desk:grid-cols-12">
        {iconNames.map((n) => (
          <div key={n} className={cn("flex flex-col items-center gap-2 rounded-tile border border-line bg-paper py-4")}>
            <Icon name={n} />
            <span className="font-mono text-[11px] text-meta">{n}</span>
          </div>
        ))}
      </Block>
    </div>
  )
}
