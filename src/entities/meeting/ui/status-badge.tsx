import { cn } from '@/shared/lib'
import type { DisplayStatus } from '../model'

const LABEL: Record<DisplayStatus, string> = {
  scheduled: '예정',
  open: '진행 중',
  closed: '마감',
  confirmed: '확정',
}

/** 리니어식 상태 아이콘: 예정 도는 로딩 써클, 진행 중 깜빡이는 초록 점(라이브), 마감 멈춘 물결 잔상이 남은 회색 점, 확정 체크 원 */
export function StatusIcon({ status, className }: { status: DisplayStatus; className?: string }) {
  const dot = status !== 'confirmed'
  return (
    // 점 아이콘은 폭을 점 크기(6px)로: 왼쪽 빈칸 없이 제목·기간과 왼쪽 끝을 맞춤
    <svg
      viewBox={dot ? '0 0 6 14' : '0 0 14 14'}
      aria-hidden
      className={cn('h-3.5 shrink-0 overflow-visible', dot ? 'w-1.5' : 'w-3.5', className)}
    >
      {status === 'scheduled' && (
        // 시작을 기다리는 로딩 써클: 옅은 고리 위로 호(1/4)가 돎
        <>
          <circle cx="3" cy="6.8" r="2.5" fill="none" stroke="#e8a400" strokeOpacity="0.25" strokeWidth="1.3" />
          <circle
            cx="3"
            cy="6.8"
            r="2.5"
            fill="none"
            stroke="#e8a400"
            strokeWidth="1.3"
            strokeLinecap="round"
            pathLength="4"
            strokeDasharray="1.1 2.9"
            className="animate-spin [animation-duration:1.2s] [transform-box:fill-box] origin-center motion-reduce:animate-none"
          />
        </>
      )}
      {status === 'open' && (
        // 한글 글자 잉크 중심에 맞춰 cy 6.8, 물결은 박스 밖으로 퍼지게(overflow-visible)
        <>
          <circle
            cx="3"
            cy="6.8"
            r="3"
            fill="#16a34a"
            className="animate-ping [transform-box:fill-box] origin-center motion-reduce:animate-none"
          />
          <circle cx="3" cy="6.8" r="3" fill="#16a34a" />
        </>
      )}
      {status === 'closed' && (
        // 진행 중 물결이 퍼지다 멈춘 잔상: 옅은 후광 고리 + 꺼진 회색 점
        <>
          <circle cx="3" cy="6.8" r="5" fill="var(--color-gray-500)" fillOpacity="0.12" />
          <circle cx="3" cy="6.8" r="3" fill="var(--color-gray-500)" />
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
