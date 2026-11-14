import Link from "next/link"
import { cn } from "cn"
import { Icon, type IconName } from "@/components/pawconnect/icon"
import { ReportCard, ReportRow } from "@/components/pawconnect/report-card"
import { ZoneMap } from "@/components/pawconnect/zone-map"
import { byId, sampleReports } from "@/lib/sample"

const wrap = "mx-auto max-w-[1280px] px-4 desk:px-8"
const h2 = "text-[clamp(26px,1.4vw+18px,42px)]"

function EntryCard({
  href,
  icon,
  tone,
  title,
  text,
}: {
  href: string
  icon: IconName
  tone: "action" | "ink"
  title: string
  text: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3.5 rounded-panel border border-line bg-paper p-4 no-underline transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-line-strong desk:p-[18px]"
    >
      <span
        className={cn(
          "grid size-13 shrink-0 place-items-center rounded-tile text-white",
          tone === "action" ? "bg-action" : "bg-ink"
        )}
      >
        <Icon name={icon} className="size-7" />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block font-heading text-[21px] leading-[1.15] font-normal tracking-[-0.02em]">{title}</strong>
        <span className="mt-0.5 block text-sm leading-snug text-meta">{text}</span>
      </span>
      <Icon name="chev" className="transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

const steps = [
  ["Subes de 1 a 5 fotos", "Guardamos solo el recorte del animal. La foto original se descarta."],
  ["Filtramos antes de comparar", "Misma especie, a menos de 15 km y de los últimos 60 días."],
  ["Revisas cinco candidatos", "En orden de parecido, sin porcentajes. Descartas los que no son."],
  ["Los dos aceptan el contacto", "Hasta entonces, ningún número aparece en pantalla."],
] as const

const more: { href: string; icon: IconName; title: string; text: string }[] = [
  {
    href: "/guias",
    icon: "book",
    title: "Guías y trámites",
    text: "Tenencia, vacunas, viajes y transporte, cada guía con su fuente oficial y fecha de actualización.",
  },
  {
    href: "/adopcion",
    icon: "heart",
    title: "Adopción",
    text: "Animales publicados por fundaciones verificadas, con sus requisitos a la vista.",
  },
  {
    href: "/servicios",
    icon: "clock",
    title: "Servicios cercanos",
    text: "Veterinarias, guarderías y paseadores con sello de verificación, y urgencias 24 horas.",
  },
]

export default function HomePage() {
  return (
    <>
      <section className={cn(wrap, "flex flex-wrap items-stretch gap-12 pt-4 pb-10 desk:pt-16 desk:pb-18")}>
        <div className="flex min-w-0 flex-[1_1_600px] flex-col justify-center gap-4 desk:gap-6">
          <span className="hidden text-[13px] font-medium text-meta desk:block">
            Perros y gatos perdidos y encontrados · Bogotá y la Sabana
          </span>
          <h1 className="text-[clamp(32px,2.6vw+22px,64px)] leading-[1.02] tracking-[-0.04em]">
            ¿Perdiste o encontraste un perro o un gato?
          </h1>
          <p className="hidden max-w-[34em] text-[19px] desk:block">
            Publica su foto. PawConnect la compara con los reportes de la zona y te muestra cinco posibles
            coincidencias. Tú decides si es tu animal.
          </p>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
            <EntryCard
              href="/publicar"
              icon="search"
              tone="action"
              title="Perdí a mi mascota"
              text="La comparamos con los animales encontrados."
            />
            <EntryCard
              href="/encontre"
              icon="heart"
              tone="ink"
              title="Encontré un animal"
              text="Lo tienes contigo o lo viste solo en la calle."
            />
          </div>
          <p className="flex items-center gap-2 text-sm text-meta">
            <Icon name="lock" className="size-4" />
            Tu teléfono no se muestra hasta que las dos partes aceptan el contacto.
          </p>
        </div>

        <div className="hidden min-w-0 flex-[1_1_420px] desk:flex">
          <ZoneMap
            className="h-[420px] w-full rounded-panel border border-line"
            zones={[
              { x: 0.25, y: 0.29, type: "perdido" },
              { x: 0.7, y: 0.43, type: "encontrado" },
              { x: 0.43, y: 0.71, type: "visto" },
              { x: 0.85, y: 0.81, type: "perdido" },
            ]}
          >
            <span className="absolute top-4 left-4 inline-flex h-8 items-center gap-1.5 rounded-full bg-ground px-3 text-[13px] leading-none font-medium">
              <Icon name="zone" className="size-4" />
              Cada reporte es un área de 500 m, nunca un punto
            </span>
            <div className="absolute inset-x-4 bottom-4 grid grid-cols-2 gap-2.5">
              <ReportRow report={byId("anden")} href="/reportes" />
              <ReportRow report={byId("mora")} href="/reportes" />
            </div>
          </ZoneMap>
        </div>
      </section>

      {/* Phone: nearby list */}
      <section className={cn(wrap, "flex flex-col gap-3 desk:hidden")}>
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl">Cerca de Suba</h2>
          <Link href="/mapa" className="text-sm font-medium underline decoration-line-strong underline-offset-[3px]">
            Ver en el mapa
          </Link>
        </div>
        <ReportRow report={byId("anden")} href="/reportes" />
        <ReportRow report={byId("lucas")} href="/reportes" />
        <ReportRow report={byId("negra")} href="/reportes" />
      </section>

      {/* Web: recent grid */}
      <section className={cn(wrap, "hidden pt-6 desk:block")}>
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <h2 className={h2}>Reportes recientes en Bogotá y la Sabana</h2>
          <Link href="/reportes" className="font-medium underline decoration-line-strong underline-offset-[3px]">
            Ver todos en el mapa
          </Link>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
          {sampleReports.slice(0, 4).map((r) => (
            <ReportCard key={r.id} report={r} href="/reportes" />
          ))}
        </div>
      </section>

      <section className={cn(wrap, "pt-14 desk:pt-22")}>
        <h2 className={cn(h2, "mb-7")}>Cómo funciona la búsqueda por foto</h2>
        <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 p-0">
          {steps.map(([title, text], i) => (
            <li key={title} className="flex flex-col gap-2 border-t-2 border-ink pt-4">
              <span className="font-mono text-[13px] text-meta">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="text-[22px]">{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={cn(wrap, "pt-14 desk:pt-22")}>
        <h2 className={cn(h2, "mb-7")}>Información para cuidar a tu animal</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
          {more.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="flex flex-col gap-2.5 rounded-panel border border-line bg-paper p-6 no-underline transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-line-strong"
            >
              <Icon name={m.icon} className="size-7" />
              <h3 className="text-2xl">{m.title}</h3>
              <p>{m.text}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
