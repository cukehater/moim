export type MeetingStatus = 'scheduled' | 'open' | 'closed'
export type DisplayStatus = MeetingStatus | 'confirmed'

type StatusInput = { startsAt: Date; endsAt: Date; closedAt: Date | null }

export function getMeetingStatus(m: StatusInput, now: Date): MeetingStatus {
  if (m.closedAt) return 'closed'
  if (now < m.startsAt) return 'scheduled'
  if (now >= m.endsAt) return 'closed'
  return 'open'
}

export type OptionCount = { id: string; count: number }

/**
 * 마감 후 확정 날짜는 저장하지 않고 득표로 계산.
 * 단독 최다면 자동 확정(운영자 변경 불가), 동점이면 운영자가 동점 날짜(tied) 중 고른 confirmedOptionId
 */
export function resolveConfirmation(confirmedOptionId: string | null, options: OptionCount[]) {
  const max = Math.max(0, ...options.map((o) => o.count))
  const top = options.filter((o) => o.count === max).map((o) => o.id)
  if (top.length === 1) return { optionId: top[0], tied: [] as string[] }
  return { optionId: confirmedOptionId && top.includes(confirmedOptionId) ? confirmedOptionId : null, tied: top }
}

export function getDisplayStatus(
  m: StatusInput & { confirmedOptionId: string | null },
  now: Date,
  options: OptionCount[],
): DisplayStatus {
  const status = getMeetingStatus(m, now)
  return status === 'closed' && resolveConfirmation(m.confirmedOptionId, options).optionId ? 'confirmed' : status
}
