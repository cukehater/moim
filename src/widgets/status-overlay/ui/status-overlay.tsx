'use client'

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog'

/** 닫을 수 없는 딤 팝오버 (예정·마감 상태) */
export function StatusOverlay({ title, description }: { title: string; description?: string }) {
  return (
    <Dialog open>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="gap-2 py-8 text-center"
      >
        <DialogTitle className="text-xl">{title}</DialogTitle>
        {description ? (
          <DialogDescription className="text-base">{description}</DialogDescription>
        ) : (
          <DialogDescription className="sr-only">{title}</DialogDescription>
        )}
      </DialogContent>
    </Dialog>
  )
}
