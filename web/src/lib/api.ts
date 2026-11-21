"use client"

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"

export function apiAssetUrl(path: string | undefined): string {
  if (!path) return ""
  if (path.startsWith("/api/reportes/")) return path
  if (/^https?:\/\//.test(path)) return path
  const origin = API_URL.replace(/\/api\/?$/, "")
  return `${origin}${path.startsWith("/") ? "" : "/"}${path}`
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem("pawconnect_token")
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers = new Headers(options.headers)
  if (token) headers.set("Authorization", `Token ${token}`)
  if (!(options.body instanceof FormData) && options.body) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("pawconnect_token")
      window.localStorage.removeItem("pawconnect_user")
      window.dispatchEvent(new CustomEvent("pawconnect:unauthorized"))
    }
  }

  if (response.status === 204) return undefined as T
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      data?.detail ||
      data?.codigo ||
      data?.non_field_errors?.[0] ||
      "No pudimos completar la solicitud."
    throw new Error(typeof message === "string" ? message : "Error de solicitud.")
  }
  return data as T
}
