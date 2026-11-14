import { describe, expect, it } from 'vitest'
import { getDisplayStatus, getMeetingStatus, resolveConfirmation } from './status'

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
  it('마감 + 확정 날짜가 있으면 confirmed로 표시', () => {
    const single = [{ id: 'a', count: 2 }, { id: 'b', count: 1 }]
    const tied = [{ id: 'a', count: 1 }, { id: 'b', count: 1 }]
    const closed = { ...base, closedAt: startsAt, confirmedOptionId: null }
    expect(getDisplayStatus(closed, startsAt, single)).toBe('confirmed')
    expect(getDisplayStatus(closed, startsAt, tied)).toBe('closed')
    expect(getDisplayStatus({ ...closed, confirmedOptionId: 'b' }, startsAt, tied)).toBe('confirmed')
    expect(getDisplayStatus({ ...base, confirmedOptionId: null }, startsAt, single)).toBe('open')
  })
})

describe('resolveConfirmation', () => {
  it('단독 최다면 운영자 선택과 무관하게 자동 확정', () => {
    const options = [{ id: 'a', count: 3 }, { id: 'b', count: 1 }]
    expect(resolveConfirmation(null, options)).toEqual({ optionId: 'a', tied: [] })
    expect(resolveConfirmation('b', options)).toEqual({ optionId: 'a', tied: [] })
  })
  it('동점이면 동점 날짜 중 운영자 선택만 인정', () => {
    const options = [{ id: 'a', count: 2 }, { id: 'b', count: 2 }, { id: 'c', count: 1 }]
    expect(resolveConfirmation(null, options)).toEqual({ optionId: null, tied: ['a', 'b'] })
    expect(resolveConfirmation('b', options)).toEqual({ optionId: 'b', tied: ['a', 'b'] })
    expect(resolveConfirmation('c', options)).toEqual({ optionId: null, tied: ['a', 'b'] })
  })
  it('모두 0표면 전체가 동점', () => {
    const options = [{ id: 'a', count: 0 }, { id: 'b', count: 0 }]
    expect(resolveConfirmation(null, options)).toEqual({ optionId: null, tied: ['a', 'b'] })
  })
  it('후보가 하나면 0표여도 자동 확정', () => {
    expect(resolveConfirmation(null, [{ id: 'a', count: 0 }])).toEqual({ optionId: 'a', tied: [] })
  })
})
