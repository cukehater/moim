import { describe, expect, it } from 'vitest'
import { canSeeResults } from './visibility'

describe('canSeeResults', () => {
  it('always는 항상 공개', () => {
    expect(canSeeResults('always', 'scheduled', false)).toBe(true)
  })
  it('after_vote는 내 투표가 있을 때만', () => {
    expect(canSeeResults('after_vote', 'open', false)).toBe(false)
    expect(canSeeResults('after_vote', 'open', true)).toBe(true)
  })
  it('after_close는 마감됐을 때만', () => {
    expect(canSeeResults('after_close', 'open', true)).toBe(false)
    expect(canSeeResults('after_close', 'closed', false)).toBe(true)
  })
})
