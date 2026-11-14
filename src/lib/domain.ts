/*
 * Domain vocabulary shared by the components. Mirrors the requirements
 * document (RF-02, RF-06, RF-14) and the proposed "visto" report type.
 */

/** Report type. "visto" = seen alone in the street; nobody has the animal. */
export type ReportType = "perdido" | "encontrado" | "visto"

/** Case life cycle (RF-06). */
export type CaseState = "activo" | "seguimiento" | "resuelto" | "cerrado"

export type Species = "perro" | "gato"

/**
 * Trust levels (section 2 of the requirements).
 * 1 = phone verified, 2 = foundation, 3 = provider (RUES + RUT).
 */
export type SealLevel = 1 | 2 | 3

export type Report = {
  id: string
  type: ReportType
  species: Species
  title: string
  /** Neighbourhood only. Never an exact address (RF-15). */
  zone: string
  /** Human relative time, e.g. "hace 2 días". */
  when: string
  photo: string
  alt: string
}

export const reportTypeLabel: Record<ReportType, string> = {
  perdido: "Perdido",
  encontrado: "Encontrado",
  visto: "Visto en la calle",
}

export const caseStateLabel: Record<CaseState, string> = {
  activo: "Activo",
  seguimiento: "En seguimiento",
  resuelto: "Resuelto",
  cerrado: "Cerrado",
}
