import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="mt-18 border-t border-line pb-[calc(76px+env(safe-area-inset-bottom))] desk:pb-0">
      <div className="mx-auto flex max-w-[1280px] flex-wrap gap-x-8 gap-y-4 px-4 py-8 text-sm text-meta desk:px-8">
        <span>PawConnect · PawTeam S.A.S. · 2026</span>
        <Link className="underline decoration-line-strong underline-offset-[3px]" href="/datos">
          Política de tratamiento de datos
        </Link>
        <Link className="underline decoration-line-strong underline-offset-[3px]" href="/terminos">
          Términos de uso
        </Link>
        <span>Complementa al IDPYBA; no lo reemplaza.</span>
        <Link className="underline decoration-line-strong underline-offset-[3px]" href="/sistema">
          Sistema de diseño
        </Link>
      </div>
    </footer>
  )
}
