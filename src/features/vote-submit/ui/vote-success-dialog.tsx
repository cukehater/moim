'use client'

import { useEffect } from 'react'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog'

// 브랜드 블루 + 약속 오렌지 계열
const COLORS = ['#3355ff', '#ff6b4a', '#ffc94a', '#7b8cff', '#ff9a85']

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  /** '1월 9일(토)' */
  dates: string[]
}

/** 투표 완료: 양옆에서 컨페티 + 고른 날짜 확인 */
export function VoteSuccessDialog({ open, onOpenChange, title, dates }: Props) {
  useEffect(() => {
    if (!open) return
    // 투표할 때만 필요하니 첫 화면 번들에서 제외
    import('canvas-confetti').then(({ default: confetti }) => {
      const base = { particleCount: 70, spread: 60, startVelocity: 55, colors: COLORS, disableForReducedMotion: true }
      confetti({ ...base, angle: 60, origin: { x: 0, y: 0.75 } })
      confetti({ ...base, angle: 120, origin: { x: 1, y: 0.75 } })
    })
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-[18.5rem] gap-0 px-5 pt-6 pb-6 text-center">
        <DialogTitle className="text-heading font-semibold">{title}</DialogTitle>
        <ul className="mt-3 flex flex-wrap justify-center gap-1.5">
          {dates.map((d) => (
            <li key={d} className="rounded-full bg-brand-50 px-2.5 py-1 text-caption font-medium text-brand-600 tabular">
              {d}
            </li>
          ))}
        </ul>
        <DialogDescription className="mt-3 text-sub text-gray-600">확정되면 이 링크에서 확인할 수 있어요.</DialogDescription>
        <Button size="lg" className="mt-5 w-full" onClick={() => onOpenChange(false)}>
          확인
        </Button>
      </DialogContent>
    </Dialog>
  )
}
