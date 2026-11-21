import { NextRequest } from "next/server"

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ reporteId: string; fotoId: string }> }
) {
  const { reporteId, fotoId } = await context.params
  const response = await fetch(
    `http://api:8000/api/reportes/${reporteId}/fotos/${fotoId}/contenido/`,
    { cache: "no-store" }
  )

  if (!response.ok) {
    return new Response("Imagen no disponible", { status: response.status })
  }

  const bytes = await response.arrayBuffer()
  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "private, max-age=3600",
    },
  })
}
