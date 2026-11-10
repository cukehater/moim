import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

/** iOS 내비게이션 바: 왼쪽 뒤로, 가운데 제목, 오른쪽 액션 */
export function PageHeader({ title, backHref, action }: { title?: ReactNode; backHref?: string; action?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 grid h-12 grid-cols-[1fr_auto_1fr] items-center bg-white/90 px-1 shadow-[inset_0_-1px_0_var(--color-separator)] backdrop-blur-xl backdrop-saturate-[1.8]">
      <div>
        {backHref && (
          <Link href={backHref} className="flex h-tap w-fit items-center pr-2 text-body text-brand active:opacity-50">
            <ChevronLeft className="size-7" strokeWidth={2.25} aria-hidden />
            <span className="-ml-0.5">목록</span>
          </Link>
        )}
      </div>
      <h1 className="max-w-[14rem] truncate text-body font-semibold">{title}</h1>
      <div className="flex justify-end">{action}</div>
    </header>
  )
}
