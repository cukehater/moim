import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

/** 리니어식 상단 바: 왼쪽 뒤로·빵부스러기 제목, 오른쪽 액션 */
export function PageHeader({ title, backHref, action }: { title?: ReactNode; backHref?: string; action?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 flex h-12 items-center gap-1 bg-white/92 shadow-[inset_0_-1px_0_var(--color-separator)] backdrop-blur-md">
      {backHref && (
        <Link
          href={backHref}
          aria-label="목록으로"
          className="flex size-tap shrink-0 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 active:bg-gray-100"
        >
          <ChevronLeft className="size-5" strokeWidth={2} aria-hidden />
        </Link>
      )}
      <h1 className="min-w-0 flex-1 truncate text-sub font-medium text-gray-900">{title}</h1>
      <div className="flex shrink-0 justify-end">{action}</div>
    </header>
  )
}
