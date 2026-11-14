import type { Report } from "./domain"

/** Sample data for prototypes (modules 2–4 are navigable with example data). */
export const sampleReports: Report[] = [
  {
    id: "toby",
    type: "perdido",
    species: "perro",
    title: "Toby, mestizo dorado",
    zone: "Suba",
    when: "hace 2 días",
    photo: "/img/toby.jpg",
    alt: "Toby, perro mestizo de pelo largo y dorado parado sobre el andén",
  },
  {
    id: "gato-bn",
    type: "encontrado",
    species: "gato",
    title: "Gato blanco y negro",
    zone: "Teusaquillo",
    when: "hace 5 h",
    photo: "/img/gato-bn.jpg",
    alt: "Gato blanco y negro sentado en la calle",
  },
  {
    id: "negra",
    type: "perdido",
    species: "perro",
    title: "Negra, perra mestiza",
    zone: "Galerías",
    when: "hace 1 día",
    photo: "/img/negra.jpg",
    alt: "Perra negra caminando por el asfalto",
  },
  {
    id: "lucas",
    type: "visto",
    species: "perro",
    title: "Perro canela, sin collar",
    zone: "Niza",
    when: "hace 1 hora",
    photo: "/img/lucas.jpg",
    alt: "Perro canela caminando solo por una calle",
  },
  {
    id: "anden",
    type: "encontrado",
    species: "perro",
    title: "Perro café, collar negro",
    zone: "Chapinero",
    when: "hace 1 día",
    photo: "/img/perro-anden.jpg",
    alt: "Perro dormido en un andén con la cabeza sobre una piedra",
  },
  {
    id: "mora",
    type: "perdido",
    species: "gato",
    title: "Mora, gata atigrada",
    zone: "Usaquén",
    when: "hace 3 días",
    photo: "/img/mora.jpg",
    alt: "Gata atigrada echada sobre adoquines",
  },
]

export const byId = (id: string) => sampleReports.find((r) => r.id === id)!
