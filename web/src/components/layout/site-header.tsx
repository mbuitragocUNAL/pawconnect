"use client"

import Link from "next/link"
import { cn } from "cn"
import { buttonVariants } from "@/components/ui/button"
import { Icon } from "@/components/pawconnect/icon"
import { Brand } from "./brand"
import { webNav } from "./nav"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"

/**
 * One header for every width:
 * - ≥ 960px: brand, five sections, Ingresar (tonal), Publicar reporte (primary).
 * - < 960px: brand and the notifications button; navigation moves to the tab bar.
 */
export function SiteHeader() {
  const { user, ready, logout } = useAuth()
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ground/95 backdrop-blur supports-backdrop-filter:bg-ground/85">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-7 px-4 desk:h-[72px] desk:px-8">
        <Brand className="desk:hidden" compact />
        <Brand className="hidden desk:inline-flex" />
        <nav aria-label="Principal" className="hidden gap-6 desk:flex">
          {webNav.map((item) => {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "border-b-2 border-transparent pt-[26px] pb-[23px] text-[15px] leading-none font-medium whitespace-nowrap no-underline transition-colors hover:border-line-strong"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2.5">
          <Link href="/mis-casos" aria-label="Notificaciones" className={buttonVariants({ variant: "tonal", size: "icon" })}>
            <Icon name="bell" />
          </Link>
          {ready && user ? (
            <Button
              variant="tonal"
              size="icon"
              className="desk:hidden"
              onClick={() => {
                logout()
                window.location.assign("/ingresar")
              }}
              aria-label="Cerrar sesión"
            >
              <Icon name="back" />
            </Button>
          ) : null}
          <Link
            href={ready && user ? "/mis-casos" : "/ingresar"}
            className={cn(buttonVariants({ variant: "tonal" }), "hidden desk:inline-flex")}
          >
            {ready && user ? "Mi cuenta" : "Ingresar"}
          </Link>
          {ready && user ? (
            <Button
              variant="outline"
              size="sm"
              className="hidden desk:inline-flex"
              onClick={() => {
                logout()
                window.location.assign("/ingresar")
              }}
            >
              Salir
            </Button>
          ) : null}
          <Link href="/publicar" className={cn(buttonVariants({ variant: "primary" }), "hidden desk:inline-flex")}>
            Publicar reporte
          </Link>
        </div>
      </div>
    </header>
  )
}
