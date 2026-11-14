# PawConnect · web

Interfaz de PawConnect en **Next.js 16 (React 19)**, mobile-first, como pide la sección 7 del documento de requisitos. Aquí vive el sistema de diseño en código: tokens, componentes y las primeras pantallas.

```bash
npm install
npm run dev          # http://localhost:3000
```

- `/` es el inicio, responsive: en teléfono hay barra de pestañas abajo y en web cabecera con menú.
- `/sistema` muestra todos los componentes con datos de ejemplo. Es la referencia viva del lenguaje de diseño.
- Las demás rutas (`/reportes`, `/publicar`, `/encontre`…) muestran «Pantalla pendiente» con el nombre de su artboard en el canvas.

## Librería de componentes: shadcn/ui sobre Base UI

Los primitivos (botón, campos, casilla, interruptor, chips, hoja inferior, diálogo, avisos, código SMS) vienen de [shadcn/ui](https://ui.shadcn.com) con [Base UI](https://base-ui.com) por debajo.

- **El código es nuestro.** shadcn copia cada componente a `src/components/ui/`; no es una dependencia con un estilo propio que haya que pelear. Ya están repintados con nuestros tokens: botones en píldora de 48 px, campos de 48 px, casilla e interruptor en tinta y chips que se llenan de tinta.
- **Accesibilidad y teclado resueltos** por Base UI: foco, `aria-*`, Escape, atrapar el foco en diálogos.
- **Tailwind v4** con los tokens del lenguaje de diseño como utilidades: `bg-ink`, `text-meta`, `bg-action`, `rounded-tile`, `desk:` (≥ 960 px).

Agregar otro primitivo: `npx shadcn@latest add <nombre>` y luego ajustarlo a los tokens. Por ejemplo, cambiar `rounded-lg` por `rounded-field` y `bg-primary` por `bg-action`, solo si es la acción principal.

## Estructura

```
src/
  app/
    globals.css            tokens de marca + variables de shadcn apuntando a ellos
    layout.tsx             fuentes (Funnel Display, Funnel Sans, DM Mono), avisos
    (site)/layout.tsx      cabecera web, barra de pestañas móvil, pie
    (site)/page.tsx        inicio
    (site)/sistema/        vitrina del sistema de diseño
    (site)/[slug]/         pantallas pendientes (lista en components/layout/nav.ts)
  components/
    ui/                    primitivos shadcn ya con la marca
    pawconnect/            componentes propios del producto (abajo)
    layout/                marca, cabecera, pestañas, pie, rutas
  lib/
    domain.ts              tipos: tipo de reporte, estado del caso, niveles de sello
    sample.ts              datos de ejemplo
public/img/                fotos de ejemplo de Wikimedia Commons (créditos en CREDITS.md)
```

## Componentes propios (`src/components/pawconnect`)

| Componente | Qué resuelve |
|---|---|
| `Icon` | Set propio de 24 px, trazo 1,75. `<Icon name="zone" />` |
| `ReportTag` | Perdido (magenta), Encontrado (tinta), Visto en la calle (contorno) |
| `CaseState` | Activo, En seguimiento, Resuelto, Cerrado (RF-06); `urgente` solo para 24 h |
| `CropFrame` | Foto dentro de las cuatro esquinas (RN-04); estado rechazado (RF-03) |
| `PhotoSlots` | De 1 a 5 fotos, quitar, foto rechazada con motivo (RF-02) |
| `ZoneMap`, `zonePaint` | Reporte como círculo de 500 m, lugar fijo como punto (RF-15) |
| `ReportRow`, `ReportCard`, `ZoneMeta` | Reporte en lista o en cuadrícula; barrio, nunca dirección |
| `CandidateRow`, `SimilarityAxis` | Candidatos numerados, sin porcentaje (RN-02) |
| `DecisionBar` | Decisión fija abajo en teléfono, en línea en web (RN-01) |
| `ContactKeys`, `MaskedPhone` | Dos llaves; el número se revela solo con las dos (RN-05) |
| `Seal` | Sello nivel 1, 2 o 3, en revisión o retirado (RF-14) |
| `CaseTimeline` | Historial del caso con fecha en cada cambio (RF-06) |
| `Field`, `Consent`, `Steps`, `Notice` | Campo con ayuda o error, consentimiento que **nunca** viene marcado, «Paso n de m», avisos |

## Reglas que el código sostiene

1. **Un solo botón magenta por vista** (`variant="primary"`). El que lo acompaña es `tonal`.
2. **Ningún consentimiento empieza marcado.** `Consent` no acepta `defaultChecked`.
3. **Nunca un porcentaje de parecido.** Solo posición y `SimilarityAxis`.
4. **Ubicación como área.** El mapa real (MapLibre o Leaflet) debe dibujar círculos de `ZONE_RADIUS_M` con `zonePaint`.
5. **Rojo solo para errores y urgencias 24 h** (`danger`, `CaseState state="urgente"`).
6. **Textos de 16 px en campos**, para que iOS no haga zoom al enfocar.

## Siguiente

Pasar las pantallas del canvas por flujo, empezando por el Módulo 1 (es el funcional): `Flujo-Perdi`, luego `Flujo-Encontre`, luego `Movil-Caso` / `Web-Caso`. Cada pantalla nueva sale de la lista de `pendingRoutes` en `components/layout/nav.ts`.
