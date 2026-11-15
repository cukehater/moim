'use client'

import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import { DateBadges } from '@/shared/ui/date-badges'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog'

type Props = {
  /** 익명이면 null */
  name: string | null
  /** '1월 9일(토)' */
  dates: string[]
  onEdit: () => void
}

/** 다시 들어온 투표자에게 페이지를 열 때 한 번 */
export function AlreadyVotedDialog({ name, dates, onEdit }: Props) {
  const [open, setOpen] = useState(true)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton={false} className="max-w-[18.5rem] gap-0 px-5 pt-6 pb-6 text-center">
        <DialogTitle className="text-heading font-semibold text-balance">
          {name ? `${name}님은 이미 투표했어요` : '이미 투표했어요'}
        </DialogTitle>
        <DialogDescription className="mt-1.5 text-sub text-gray-600">
          마감 전까지 언제든 고칠 수 있어요.
        </DialogDescription>
        <DateBadges dates={dates} tone="gray" className="mt-3" />
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" size="lg" className="flex-1" onClick={() => setOpen(false)}>
            그대로 둘게요
          </Button>
          <Button
            size="lg"
            className="flex-1"
            onClick={() => {
              setOpen(false)
              onEdit()
            }}
          >
            수정할래요
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
