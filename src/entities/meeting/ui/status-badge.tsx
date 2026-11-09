import { cn } from '@/shared/lib'
import type { DisplayStatus } from '../model'

const LABEL: Record<DisplayStatus, string> = {
  scheduled: '예정',
  open: '진행',
  closed: '마감',
  confirmed: '확정',
}

const STYLE: Record<DisplayStatus, string> = {
  scheduled: 'bg-status-scheduled/12 text-status-scheduled',
  open: 'bg-status-open/12 text-status-open',
  closed: 'bg-muted text-muted-foreground',
  confirmed: 'bg-primary text-primary-foreground',
}

export function StatusBadge({ status, className }: { status: DisplayStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold',
        STYLE[status],
        className,
      )}
    >
      {LABEL[status]}
    </span>
  )
}
