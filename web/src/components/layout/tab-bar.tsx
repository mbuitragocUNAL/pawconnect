"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "cn"
import { Icon } from "@/components/pawconnect/icon"
import { phoneTabs } from "./nav"

/** Phone navigation (< 960px). Fixed to the bottom, clear of the home indicator. */
export function TabBar() {
  const pathname = usePathname()
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-ground pb-[env(safe-area-inset-bottom)] desk:hidden"
    >
      {phoneTabs.map((tab) => {
        const here = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={here ? "page" : undefined}
            aria-label={tab.action ? tab.label : undefined}
            className={cn(
              "flex min-h-[58px] flex-col items-center justify-center gap-1 text-xs leading-none font-medium no-underline select-none",
              here ? "text-ink" : "text-meta"
            )}
          >
            {tab.action ? (
              <span className="grid size-11 place-items-center rounded-full bg-action text-action-ink">
                <Icon name={tab.icon} />
              </span>
            ) : (
              <>
                <Icon name={tab.icon} />
                {tab.label}
              </>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
