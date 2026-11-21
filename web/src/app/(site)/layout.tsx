import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { TabBar } from "@/components/layout/tab-bar"
import { AuthProvider } from "@/lib/auth"

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <AuthProvider>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-ground"
      >
        Saltar al contenido
      </a>
      <SiteHeader />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <TabBar />
    </AuthProvider>
  )
}
