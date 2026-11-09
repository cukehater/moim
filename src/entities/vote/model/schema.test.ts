import { describe, expect, it } from 'vitest'
import { selectionSchema, voterNameSchema } from './schema'

describe('voterNameSchema', () => {
  it('trim 후 1~20자', () => {
    expect(voterNameSchema.parse('  철수  ')).toBe('철수')
    expect(voterNameSchema.safeParse('   ').success).toBe(false)
    expect(voterNameSchema.safeParse('가'.repeat(20)).success).toBe(true)
    expect(voterNameSchema.safeParse('가'.repeat(21)).success).toBe(false)
  })
})

describe('selectionSchema', () => {
  it('단일 모드는 정확히 1개', () => {
    expect(selectionSchema(false).safeParse(['a']).success).toBe(true)
    expect(selectionSchema(false).safeParse(['a', 'b']).success).toBe(false)
    expect(selectionSchema(false).safeParse([]).success).toBe(false)
  })
  it('복수 모드는 1개 이상, 중복 불가', () => {
    expect(selectionSchema(true).safeParse(['a', 'b']).success).toBe(true)
    expect(selectionSchema(true).safeParse([]).success).toBe(false)
    expect(selectionSchema(true).safeParse(['a', 'a']).success).toBe(false)
  })
})
