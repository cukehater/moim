import { describe, expect, it } from 'vitest'
import { getDisplayStatus, getMeetingStatus } from './status'

const startsAt = new Date('2026-12-01T00:00:00Z')
const endsAt = new Date('2026-12-08T00:00:00Z')
const base = { startsAt, endsAt, closedAt: null }

describe('getMeetingStatus', () => {
  it('시작 전이면 scheduled', () => {
    expect(getMeetingStatus(base, new Date('2026-11-30T23:59:59Z'))).toBe('scheduled')
  })
  it('시작 시각 포함 ~ 종료 전이면 open', () => {
    expect(getMeetingStatus(base, startsAt)).toBe('open')
    expect(getMeetingStatus(base, new Date('2026-12-07T23:59:59Z'))).toBe('open')
  })
  it('종료 시각 이후면 closed', () => {
    expect(getMeetingStatus(base, endsAt)).toBe('closed')
  })
  it('closedAt이 있으면 기간과 무관하게 closed', () => {
    expect(getMeetingStatus({ ...base, closedAt: startsAt }, new Date('2026-11-01T00:00:00Z'))).toBe('closed')
  })
  it('확정되면 confirmed로 표시', () => {
    const m = { ...base, closedAt: startsAt, confirmedOptionId: 'opt' }
    expect(getDisplayStatus(m, startsAt)).toBe('confirmed')
    expect(getDisplayStatus({ ...base, confirmedOptionId: 'opt' }, startsAt)).toBe('open')
  })
})
