import { cn } from '@/shared/lib'
import type { DisplayStatus } from '../model'

const LABEL: Record<DisplayStatus, string> = {
  scheduled: '예정',
  open: '진행 중',
  closed: '마감',
  confirmed: '확정',
}

/** 리니어식 상태 아이콘: 예정 점선 원, 진행 중 반 찬 원, 마감 꽉 찬 원, 확정 체크 원 */
export function StatusIcon({ status, className }: { status: DisplayStatus; className?: string }) {
  return (
    <svg viewBox="0 0 14 14" aria-hidden className={cn('size-3.5 shrink-0', className)}>
      {status === 'scheduled' && (
        <circle cx="7" cy="7" r="5.75" fill="none" stroke="var(--color-gray-400)" strokeWidth="1.5" strokeDasharray="2.2 1.8" />
      )}
      {status === 'open' && (
        <>
          <circle cx="7" cy="7" r="5.75" fill="none" stroke="#e8a400" strokeWidth="1.5" />
          <path d="M7 3.25a3.75 3.75 0 0 1 0 7.5z" fill="#e8a400" />
        </>
      )}
      {status === 'closed' && (
        <>
          <circle cx="7" cy="7" r="5.75" fill="none" stroke="var(--color-gray-500)" strokeWidth="1.5" />
          <circle cx="7" cy="7" r="3.75" fill="var(--color-gray-500)" />
        </>
      )}
      {status === 'confirmed' && (
        <>
          <circle cx="7" cy="7" r="6.5" fill="var(--brand)" />
          <path d="m4.4 7.2 1.8 1.8 3.5-3.7" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  )
}

/** 아이콘 + 글자 (상태는 색과 텍스트 병기) */
export function StatusBadge({ status, className }: { status: DisplayStatus; className?: string }) {
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1.5 text-caption font-medium text-gray-700', className)}>
      <StatusIcon status={status} />
      {LABEL[status]}
    </span>
  )
}
