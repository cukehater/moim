import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('커스텀 크기 클래스와 색 클래스를 함께 유지', () => {
    expect(cn('text-white', 'text-body')).toBe('text-white text-body')
    expect(cn('text-sub', 'text-body')).toBe('text-body')
  })
})
