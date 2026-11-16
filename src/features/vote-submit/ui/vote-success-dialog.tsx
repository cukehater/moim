'use client'

import { useEffect } from 'react'
import { Button } from '@/shared/ui/button'
import { DateBadges } from '@/shared/ui/date-badges'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'

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
      // 모바일 폭(≤500px) 기준: 입자는 작게(scalar 0.6), 양옆 각 80개를 낮고 좁게 쏘아 차분하게
      const base = { particleCount: 80, scalar: 0.6, spread: 55, startVelocity: 40, ticks: 200, colors: COLORS, disableForReducedMotion: true }
      // 화면 끝이 아니라 앱 셸(최대 500px, 가운데 정렬) 양끝에서 쏨: PC에서 옆 여백에서 터지지 않게
      const side = (innerWidth - Math.min(innerWidth, 500)) / 2 / innerWidth
      confetti({ ...base, angle: 60, origin: { x: side, y: 0.75 } })
      confetti({ ...base, angle: 120, origin: { x: 1 - side, y: 0.75 } })
    })
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>확정되면 이 링크에서 확인할 수 있어요.</DialogDescription>
        </DialogHeader>
        <DateBadges dates={dates} className="mt-3" />
        <DialogFooter>
          <Button className="w-full" onClick={() => onOpenChange(false)}>
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
