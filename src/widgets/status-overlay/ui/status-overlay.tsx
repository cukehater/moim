'use client'

import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import { DdayBadge } from '@/shared/ui/dday-badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'

type Props = {
  title: string
  /** 확정 날짜처럼 크게 보여줄 한 줄 */
  highlight?: string
  /** 확정 날짜까지 D-day */
  badge?: string | null
  description?: string
  /** 닫을 수 있음 (확정 안내). 기본은 닫을 수 없는 예정·마감 안내 */
  dismissible?: boolean
}

/** 딤 팝오버 (예정·마감·확정 상태) */
export function StatusOverlay({ title, highlight, badge, description, dismissible = false }: Props) {
  const [open, setOpen] = useState(true)
  const block = (e: Event) => !dismissible && e.preventDefault()
  return (
    <Dialog open={open} onOpenChange={(o) => dismissible && setOpen(o)}>
      <DialogContent onEscapeKeyDown={block} onInteractOutside={block}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : (
            <DialogDescription className="sr-only">{title}</DialogDescription>
          )}
        </DialogHeader>
        {/* 확정 날짜·시작 시각은 제목 아래 본문으로 크게 */}
        {(badge || highlight) && (
          <div className="mt-4 flex flex-col items-center gap-1.5 rounded-lg bg-gray-50 py-3.5">
            {badge && <DdayBadge>{badge}</DdayBadge>}
            {highlight && <p className="text-title font-semibold text-gray-900">{highlight}</p>}
          </div>
        )}
        {dismissible && (
          <DialogFooter>
            <Button className="w-full" onClick={() => setOpen(false)}>
              확인
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
