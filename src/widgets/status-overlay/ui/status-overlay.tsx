'use client'

import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import { DdayBadge } from '@/shared/ui/dday-badge'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog'

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
      <DialogContent
        showCloseButton={dismissible}
        onEscapeKeyDown={block}
        onInteractOutside={block}
        className="max-w-[18.5rem] gap-0 px-5 pt-6 pb-6 text-center"
      >
        <DialogTitle className="text-sub font-medium text-balance text-gray-600">{title}</DialogTitle>
        {badge && <DdayBadge className="mx-auto mt-3">{badge}</DdayBadge>}
        {highlight && <p className="mt-1.5 text-title font-semibold text-gray-900">{highlight}</p>}
        {description ? (
          <DialogDescription className="mt-1.5 text-sub text-gray-600">{description}</DialogDescription>
        ) : (
          <DialogDescription className="sr-only">{title}</DialogDescription>
        )}
        {dismissible && (
          <Button size="lg" className="mt-5 w-full" onClick={() => setOpen(false)}>
            확인
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
