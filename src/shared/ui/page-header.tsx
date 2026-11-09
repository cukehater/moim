import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

export function PageHeader({ title, backHref, action }: { title: ReactNode; backHref?: string; action?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-1 border-b bg-background/95 px-2 backdrop-blur">
      {backHref ? (
        <Link
          href={backHref}
          aria-label="뒤로"
          className="flex size-tap items-center justify-center rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <ChevronLeft className="size-6" aria-hidden />
        </Link>
      ) : (
        <span className="w-2" />
      )}
      <h1 className="min-w-0 flex-1 truncate text-lg font-bold">{title}</h1>
      {action}
    </header>
  )
}
