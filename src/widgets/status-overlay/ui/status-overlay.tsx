'use client'

import { CalendarCheck, CalendarClock, CalendarX } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog'

const ICON = { scheduled: CalendarClock, closed: CalendarX, confirmed: CalendarCheck }

type Props = {
  kind: keyof typeof ICON
  title: string
  /** 확정 날짜처럼 크게 보여줄 한 줄 */
  highlight?: string
  description?: string
}

/** 닫을 수 없는 딤 팝오버 (예정·마감 상태) */
export function StatusOverlay({ kind, title, highlight, description }: Props) {
  const Icon = ICON[kind]
  return (
    <Dialog open>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="items-center gap-0 px-6 pt-8 pb-7 text-center"
      >
        <span
          aria-hidden
          className={cn(
            'mx-auto mb-4 flex size-14 items-center justify-center rounded-full',
            kind === 'closed' ? 'bg-gray-100 text-gray-500' : 'bg-brand-50 text-brand',
          )}
        >
          <Icon className="size-7" strokeWidth={1.75} />
        </span>
        <DialogTitle className="text-heading font-bold text-balance">{title}</DialogTitle>
        {highlight && <p className="mt-2 text-title font-bold text-brand">{highlight}</p>}
        {description ? (
          <DialogDescription className="mt-2 text-sub text-gray-600">{description}</DialogDescription>
        ) : (
          <DialogDescription className="sr-only">{title}</DialogDescription>
        )}
      </DialogContent>
    </Dialog>
  )
}
