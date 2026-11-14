import type { Metadata } from "next"
import { Showcase } from "./showcase"

export const metadata: Metadata = {
  title: "Sistema de diseño",
  description: "Componentes, tokens y motivos del lenguaje de diseño de PawConnect.",
}

export default function SystemPage() {
  return <Showcase />
}
