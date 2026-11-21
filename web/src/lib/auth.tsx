"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

type User = {
  id: string
  nombre_publico: string
  celular: string
  rol: string
  nivel_verificacion: number
  zona_principal: string
}

type AuthContextValue = {
  user: User | null
  token: string | null
  ready: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const storedToken = window.localStorage.getItem("pawconnect_token")
    const storedUser = window.localStorage.getItem("pawconnect_user")
    setToken(storedToken)
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        window.localStorage.removeItem("pawconnect_user")
      }
    }
    setReady(true)
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => {
      window.localStorage.removeItem("pawconnect_token")
      window.localStorage.removeItem("pawconnect_user")
      setToken(null)
      setUser(null)
      if (!window.location.pathname.startsWith("/ingresar")) {
        window.location.assign("/ingresar")
      }
    }
    window.addEventListener("pawconnect:unauthorized", handleUnauthorized)
    return () => window.removeEventListener("pawconnect:unauthorized", handleUnauthorized)
  }, [])

  const login = useCallback((nextToken: string, nextUser: User) => {
    window.localStorage.setItem("pawconnect_token", nextToken)
    window.localStorage.setItem("pawconnect_user", JSON.stringify(nextUser))
    setToken(nextToken)
    setUser(nextUser)
  }, [])

  const logout = useCallback(() => {
    window.localStorage.removeItem("pawconnect_token")
    window.localStorage.removeItem("pawconnect_user")
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, token, ready, login, logout }),
    [user, token, ready, login, logout]
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider.")
  return context
}
