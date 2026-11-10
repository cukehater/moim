import { cn } from '@/shared/lib'
import type { DisplayStatus } from '../model'

const LABEL: Record<DisplayStatus, string> = {
  scheduled: '예정',
  open: '진행 중',
  closed: '마감',
  confirmed: '확정',
}

const STYLE: Record<DisplayStatus, string> = {
  scheduled: 'bg-gray-100 text-gray-800',
  open: 'bg-brand text-white',
  closed: 'bg-gray-100 text-gray-600',
  confirmed: 'bg-brand-50 text-brand-600',
}

/** 당근식 작은 태그: 색면 + 글자 */
export function StatusBadge({ status, className }: { status: DisplayStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-[1.375rem] shrink-0 items-center rounded-sm px-1.5 text-caption font-bold',
        STYLE[status],
        className,
      )}
    >
      {LABEL[status]}
    </span>
  )
}
