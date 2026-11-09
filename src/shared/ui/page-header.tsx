import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

export function PageHeader({ title, backHref, action }: { title?: ReactNode; backHref?: string; action?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-1 bg-white/95 px-2 backdrop-blur-sm">
      {backHref ? (
        <Link
          href={backHref}
          aria-label="뒤로"
          className="flex size-tap items-center justify-center rounded-xl text-gray-900 hover:bg-gray-100"
        >
          <ChevronLeft className="size-6" aria-hidden />
        </Link>
      ) : (
        <span className="w-3" />
      )}
      <h1 className="min-w-0 flex-1 truncate text-body font-bold">{title}</h1>
      {action}
    </header>
  )
}
