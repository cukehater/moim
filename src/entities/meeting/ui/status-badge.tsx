import { cn } from '@/shared/lib'
import type { DisplayStatus } from '../model'

const LABEL: Record<DisplayStatus, string> = {
  scheduled: '예정',
  open: '진행 중',
  closed: '마감',
  confirmed: '확정',
}

const STYLE: Record<DisplayStatus, string> = {
  scheduled: 'bg-brand-50 text-brand',
  open: 'bg-positive-50 text-positive',
  closed: 'bg-gray-100 text-gray-600',
  confirmed: 'bg-brand text-white',
}

export function StatusBadge({ status, className }: { status: DisplayStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center rounded-md px-2 text-caption font-semibold',
        STYLE[status],
        className,
      )}
    >
      {LABEL[status]}
    </span>
  )
}
