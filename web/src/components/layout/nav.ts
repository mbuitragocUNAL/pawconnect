import type { IconName } from "@/components/pawconnect/icon"

/** Web header (≥ 960px). */
export const webNav = [
  { href: "/reportes", label: "Reportes" },
  { href: "/buscar", label: "Buscar por foto" },
  { href: "/mapa", label: "Mapa" },
  { href: "/adopcion", label: "Adopción" },
  { href: "/guias", label: "Guías" },
  { href: "/servicios", label: "Servicios" },
] as const

/** Phone tab bar (< 960px). The middle tab is the publish action. */
export const phoneTabs: { href: string; label: string; icon: IconName; action?: boolean }[] = [
  { href: "/", label: "Inicio", icon: "home" },
  { href: "/mapa", label: "Mapa", icon: "zone" },
  { href: "/publicar", label: "Publicar reporte", icon: "plus", action: true },
  { href: "/mis-casos", label: "Mis casos", icon: "paw" },
  { href: "/mas", label: "Más", icon: "dots" },
]

/** Routes that exist in the canvas but are not built in React yet. */
export const pendingRoutes: Record<string, { title: string; canvas: string }> = {
  reportes: { title: "Reportes en el mapa", canvas: "Web-Reportes / Movil-Mapa" },
  adopcion: { title: "Adopción", canvas: "Web-Adopcion / Movil-Adopcion" },
  guias: { title: "Guías y trámites", canvas: "Web-Guias / Movil-Guia" },
  servicios: { title: "Servicios cercanos", canvas: "Web-Servicios / Movil-Servicios" },
  mas: { title: "Más", canvas: "Movil-Mas" },
  datos: { title: "Política de tratamiento de datos", canvas: "—" },
  terminos: { title: "Términos de uso", canvas: "—" },
}
