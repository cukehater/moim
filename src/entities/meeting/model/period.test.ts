import { describe, expect, it } from 'vitest'
import { PERIOD_MESSAGES as M, periodErrors } from './period'

const now = new Date('2026-12-05T12:00:00+09:00')
const at = (s: string) => new Date(`${s}+09:00`)

describe('periodErrors: 생성', () => {
  it('종료가 지금 이전이면 거부', () => {
    expect(periodErrors(null, { startsAt: '2026-12-01T10:00', endsAt: '2026-12-05T11:59' }, now)).toEqual({ endsAt: M.END_PAST })
  })
  it('시작은 과거여도 종료가 미래면 통과', () => {
    expect(periodErrors(null, { startsAt: '2026-12-01T10:00', endsAt: '2026-12-06T10:00' }, now)).toEqual({})
  })
})

describe('periodErrors: 마감된 모임', () => {
  const early = { startsAt: at('2026-12-01T10:00:00'), endsAt: at('2026-12-10T10:00:00'), closedAt: at('2026-12-04T10:00:00') }
  const timed = { startsAt: at('2026-12-01T10:00:00'), endsAt: at('2026-12-04T10:00:00'), closedAt: null }
  it('시작을 바꾸면 거부', () => {
    expect(periodErrors(early, { startsAt: '2026-12-02T10:00', endsAt: '2026-12-10T10:00' }, now)).toEqual({ startsAt: M.CLOSED_LOCK })
  })
  it('종료를 바꾸면 거부', () => {
    expect(periodErrors(early, { startsAt: '2026-12-01T10:00', endsAt: '2026-12-11T10:00' }, now)).toEqual({ endsAt: M.CLOSED_LOCK })
  })
  it('그대로면 통과', () => {
    expect(periodErrors(early, { startsAt: '2026-12-01T10:00', endsAt: '2026-12-10T10:00' }, now)).toEqual({})
  })
  it('시간이 지나 마감된 모임도 종료를 미래로 바꾸면 거부', () => {
    expect(periodErrors(timed, { startsAt: '2026-12-01T10:00', endsAt: '2026-12-09T10:00' }, now)).toEqual({ endsAt: M.CLOSED_LOCK })
  })
})

describe('periodErrors: 진행 중', () => {
  const open = { startsAt: at('2026-12-01T10:00:00'), endsAt: at('2026-12-08T10:00:00'), closedAt: null }
  it('시작을 바꾸면 거부', () => {
    expect(periodErrors(open, { startsAt: '2026-12-06T10:00', endsAt: '2026-12-08T10:00' }, now)).toEqual({ startsAt: M.START_LOCK })
  })
  it('종료를 과거로 바꾸면 거부', () => {
    expect(periodErrors(open, { startsAt: '2026-12-01T10:00', endsAt: '2026-12-05T11:00' }, now)).toEqual({ endsAt: M.END_PAST })
  })
  it('종료를 더 미래로 바꾸면 통과', () => {
    expect(periodErrors(open, { startsAt: '2026-12-01T10:00', endsAt: '2026-12-09T10:00' }, now)).toEqual({})
  })
  it('초가 달라도 같은 분이면 변경 아님', () => {
    const withSeconds = { ...open, endsAt: at('2026-12-08T10:00:30') }
    expect(periodErrors(withSeconds, { startsAt: '2026-12-01T10:00', endsAt: '2026-12-08T10:00' }, now)).toEqual({})
  })
})

describe('periodErrors: 예정', () => {
  const scheduled = { startsAt: at('2026-12-06T10:00:00'), endsAt: at('2026-12-08T10:00:00'), closedAt: null }
  it('시작을 과거로 옮겨 바로 진행 중이 되는 건 허용', () => {
    expect(periodErrors(scheduled, { startsAt: '2026-12-05T09:00', endsAt: '2026-12-08T10:00' }, now)).toEqual({})
  })
  it('종료를 과거로 바꾸면 거부', () => {
    expect(periodErrors(scheduled, { startsAt: '2026-12-04T09:00', endsAt: '2026-12-05T11:00' }, now)).toEqual({ endsAt: M.END_PAST })
  })
})
