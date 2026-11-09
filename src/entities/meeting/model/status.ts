export type MeetingStatus = 'scheduled' | 'open' | 'closed'
export type DisplayStatus = MeetingStatus | 'confirmed'

type StatusInput = { startsAt: Date; endsAt: Date; closedAt: Date | null }

export function getMeetingStatus(m: StatusInput, now: Date): MeetingStatus {
  if (m.closedAt) return 'closed'
  if (now < m.startsAt) return 'scheduled'
  if (now >= m.endsAt) return 'closed'
  return 'open'
}

export function getDisplayStatus(m: StatusInput & { confirmedOptionId: string | null }, now: Date): DisplayStatus {
  const status = getMeetingStatus(m, now)
  return status === 'closed' && m.confirmedOptionId ? 'confirmed' : status
}
