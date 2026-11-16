'use client'

import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import { DateBadges } from '@/shared/ui/date-badges'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{name ? `${name}님은 이미 투표했어요` : '이미 투표했어요'}</DialogTitle>
          <DialogDescription>마감 전까지 언제든 고칠 수 있어요.</DialogDescription>
        </DialogHeader>
        <DateBadges dates={dates} tone="gray" className="mt-3" />
        <DialogFooter>
          <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
            그대로 둘게요
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              setOpen(false)
              onEdit()
            }}
          >
            수정할래요
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
