"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "cn"
import { buttonVariants } from "@/components/ui/button"
import { Icon } from "@/components/pawconnect/icon"
import { Brand } from "./brand"
import { webNav } from "./nav"

/**
 * One header for every width:
 * - ≥ 960px: brand, five sections, Ingresar (tonal), Publicar reporte (primary).
 * - < 960px: brand and the notifications button; navigation moves to the tab bar.
 */
export function SiteHeader() {
  const pathname = usePathname()
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ground/95 backdrop-blur supports-backdrop-filter:bg-ground/85">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-7 px-4 desk:h-[72px] desk:px-8">
        <Brand className="desk:hidden" compact />
        <Brand className="hidden desk:inline-flex" />
        <nav aria-label="Principal" className="hidden gap-6 desk:flex">
          {webNav.map((item) => {
            const here = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={here ? "page" : undefined}
                className={cn(
                  "border-b-2 pt-[26px] pb-[23px] text-[15px] leading-none font-medium whitespace-nowrap no-underline transition-colors",
                  here ? "border-ink" : "border-transparent hover:border-line-strong"
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
          <Link href="/ingresar" className={cn(buttonVariants({ variant: "tonal" }), "hidden desk:inline-flex")}>
            Ingresar
          </Link>
          <Link href="/publicar" className={cn(buttonVariants({ variant: "primary" }), "hidden desk:inline-flex")}>
            Publicar reporte
          </Link>
        </div>
      </div>
    </header>
  )
}
