import { cn } from '@/shared/lib/cn'

/** 약속까지 남은 날·시간: 로고 주황 알약 */
export function DdayBadge({ children, className }: { children: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 shrink-0 items-center rounded-full bg-promise-50 px-2 text-caption font-semibold text-promise-ink tabular',
        className,
      )}
    >
      {children}
    </span>
  )
}
