import { describe, expect, it } from 'vitest'
import { meetingInputSchema, type MeetingInput } from './schema'

const valid: MeetingInput = {
  title: '연말 모임',
  host: '모임장',
  description: '',
  location: '',
  thumbnailId: null,
  isAnonymous: false,
  allowMultiple: true,
  resultVisibility: 'always',
  startsAt: '2026-12-01T10:00',
  endsAt: '2026-12-08T10:00',
  dates: ['2026-12-20', '2026-12-21'],
}

describe('meetingInputSchema', () => {
  it('정상 입력 통과', () => {
    expect(meetingInputSchema.safeParse(valid).success).toBe(true)
  })
  it('종료가 시작보다 같거나 이르면 실패', () => {
    const r = meetingInputSchema.safeParse({ ...valid, endsAt: valid.startsAt })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].path).toEqual(['endsAt'])
  })
  it('후보 날짜가 없거나 중복이면 실패', () => {
    expect(meetingInputSchema.safeParse({ ...valid, dates: [] }).success).toBe(false)
    expect(meetingInputSchema.safeParse({ ...valid, dates: ['2026-12-20', '2026-12-20'] }).success).toBe(false)
  })
  it('제목은 trim 후 1~80자', () => {
    expect(meetingInputSchema.safeParse({ ...valid, title: '   ' }).success).toBe(false)
    expect(meetingInputSchema.safeParse({ ...valid, title: 'a'.repeat(81) }).success).toBe(false)
  })
})
