'use client'

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog'

type Props = {
  title: string
  /** 확정 날짜처럼 크게 보여줄 한 줄 */
  highlight?: string
  description?: string
}

/** 닫을 수 없는 딤 팝오버 (예정·마감 상태) */
export function StatusOverlay({ title, highlight, description }: Props) {
  return (
    <Dialog open>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="max-w-[18.5rem] gap-0 bg-white/95 px-5 pt-6 pb-6 text-center backdrop-blur-xl"
      >
        <DialogTitle className="text-body font-semibold text-balance">{title}</DialogTitle>
        {highlight && <p className="mt-2 text-title font-bold text-brand">{highlight}</p>}
        {description ? (
          <DialogDescription className="mt-1.5 text-sub text-gray-600">{description}</DialogDescription>
        ) : (
          <DialogDescription className="sr-only">{title}</DialogDescription>
        )}
      </DialogContent>
    </Dialog>
  )
}
