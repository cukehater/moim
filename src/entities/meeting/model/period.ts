import { fromKstInput, toKstInput } from '@/shared/lib/date'
import { getMeetingStatus } from './status'

export const PERIOD_MESSAGES = {
  CLOSED_LOCK: '마감된 모임은 기간을 바꿀 수 없어요. 투표 재개를 이용해 주세요',
  START_LOCK: '시작된 모임은 시작 시각을 바꿀 수 없어요',
  END_PAST: '종료는 지금 이후여야 해요',
} as const

type Current = { startsAt: Date; endsAt: Date; closedAt: Date | null }
type Next = { startsAt: string; endsAt: string }
type PeriodErrors = { startsAt?: string; endsAt?: string }

/**
 * 모임 상태(예정·진행 중·마감)는 조기 마감·투표 재개 버튼으로만 바뀌게 기간 변경을 검사.
 * current=null이면 생성. 변경 여부는 분 단위 KST 입력값으로 비교
 */
export function periodErrors(current: Current | null, next: Next, now: Date): PeriodErrors {
  const endPast = fromKstInput(next.endsAt) <= now
  if (!current) return endPast ? { endsAt: PERIOD_MESSAGES.END_PAST } : {}

  const startChanged = toKstInput(current.startsAt) !== next.startsAt
  const endChanged = toKstInput(current.endsAt) !== next.endsAt
  const status = getMeetingStatus(current, now)
  const errors: PeriodErrors = {}
  if (status === 'closed') {
    if (startChanged) errors.startsAt = PERIOD_MESSAGES.CLOSED_LOCK
    if (endChanged) errors.endsAt = PERIOD_MESSAGES.CLOSED_LOCK
    return errors
  }
  if (status === 'open' && startChanged) errors.startsAt = PERIOD_MESSAGES.START_LOCK
  if (endChanged && endPast) errors.endsAt = PERIOD_MESSAGES.END_PAST
  return errors
}
