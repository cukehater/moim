import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

type Props = {
  title?: ReactNode
  backHref?: string
  action?: ReactNode
  /** 제목 칸을 h1로 (본문에 따로 h1이 있으면 false) */
  heading?: boolean
}

/** 리니어식 상단 바: 왼쪽 뒤로·빵부스러기 제목, 오른쪽 액션 */
export function PageHeader({ title, backHref, action, heading = true }: Props) {
  const Title = heading ? 'h1' : 'div'
  return (
    <header
      className={cn(
        'sticky top-0 z-10 flex h-13 items-center gap-1 bg-white/92 pr-5 shadow-[inset_0_-1px_0_var(--color-separator)] backdrop-blur-md',
        !backHref && 'pl-5',
      )}
    >
      {backHref && (
        <Link
          href={backHref}
          transitionTypes={['nav-back']}
          aria-label="목록으로"
          className="flex size-tap shrink-0 items-center justify-center rounded-md text-gray-600"
        >
          <ChevronLeft className="size-5.5" strokeWidth={2} aria-hidden />
        </Link>
      )}
      <Title className="min-w-0 flex-1 truncate text-body font-semibold text-gray-900">{title}</Title>
      <div className="flex shrink-0 justify-end">{action}</div>
    </header>
  )
}
