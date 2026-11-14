import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { cn } from "cn"
import { buttonVariants } from "@/components/ui/button"
import { Notice } from "@/components/pawconnect/form"
import { pendingRoutes } from "@/components/layout/nav"

/*
 * Placeholder for every screen that exists in the design canvas but is not
 * built in React yet. Delete an entry from `pendingRoutes` once its real
 * page exists under src/app/(site)/<slug>/.
 */

export function generateStaticParams() {
  return Object.keys(pendingRoutes).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params
  return { title: pendingRoutes[slug]?.title ?? "No encontrado" }
}

export default async function PendingPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params
  const route = pendingRoutes[slug]
  if (!route) notFound()

  return (
    <section className="mx-auto flex max-w-[640px] flex-col gap-5 px-4 pt-10 desk:pt-16">
      <span className="text-[13px] font-medium text-meta">Pantalla pendiente</span>
      <h1 className="text-[clamp(32px,2vw+20px,48px)] tracking-[-0.04em]">{route.title}</h1>
      <Notice title="Esta pantalla ya está diseñada, falta pasarla a React.">
        En el canvas: <span className="font-mono text-sm">{route.canvas}</span>
      </Notice>
      <div className="flex flex-wrap gap-2">
        <Link href="/" className={buttonVariants({ variant: "tonal" })}>
          Volver al inicio
        </Link>
        <Link href="/sistema" className={cn(buttonVariants({ variant: "outline" }))}>
          Ver el sistema de diseño
        </Link>
      </div>
    </section>
  )
}
