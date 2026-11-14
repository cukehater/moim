import { describe, expect, it } from 'vitest'
import { formatDday } from './date'

describe('formatDday', () => {
  // 2026-12-19 23:30 KST = 14:30 UTC
  const now = new Date('2026-12-19T14:30:00Z')
  it('KST 날짜 기준으로 남은 날 계산', () => {
    expect(formatDday('2026-12-20', now)).toBe('D-1')
    expect(formatDday('2026-12-31', now)).toBe('D-12')
  })
  it('당일은 D-DAY, 지난 날은 null', () => {
    expect(formatDday('2026-12-19', now)).toBe('D-DAY')
    expect(formatDday('2026-12-18', now)).toBeNull()
  })
  it('UTC로는 전날이어도 KST 자정이 지났으면 다음 날', () => {
    // 2026-12-20 00:10 KST = 12-19 15:10 UTC
    expect(formatDday('2026-12-20', new Date('2026-12-19T15:10:00Z'))).toBe('D-DAY')
  })
})
