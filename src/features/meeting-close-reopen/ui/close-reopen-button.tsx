'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import type { ActionResult } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { FieldError } from '@/shared/ui/field-error'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { closeMeeting, reopenMeeting } from '../api/close-reopen.action'

type Props = { meetingId: string; isClosed: boolean; endsAtPassed: boolean; className?: string }

export function CloseReopenButton({ meetingId, isClosed, endsAtPassed, className }: Props) {
  const [pending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [endsAt, setEndsAt] = useState('')
  const [error, setError] = useState<string>()

  const run = (action: () => Promise<ActionResult>, success: string) =>
    startTransition(async () => {
      const r = await action()
      if (r.ok) {
        toast.success(success)
        setDialogOpen(false)
      } else {
        setError(r.fieldErrors?.endsAt?.[0])
        if (r.message) toast.error(r.message)
      }
    })

  if (!isClosed) {
    return (
      <Button variant="secondary" className={className} disabled={pending} onClick={() => run(() => closeMeeting(meetingId), '투표를 마감했어요')}>
        조기 마감
      </Button>
    )
  }

  const reopen = () => run(() => reopenMeeting(meetingId, endsAt || undefined), '투표를 다시 열었어요')

  return (
    <>
      <Button
        variant="secondary"
        className={className}
        disabled={pending}
        onClick={() => (endsAtPassed ? setDialogOpen(true) : reopen())}
      >
        투표 재개
      </Button>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>투표 재개</DialogTitle>
            <DialogDescription>종료 시각이 지났어요. 새 종료 시각을 정해 주세요.</DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              reopen()
            }}
          >
            <Label htmlFor="reopen-ends-at">새 종료 시각</Label>
            <Input
              id="reopen-ends-at"
              type="datetime-local"
              className="bg-gray-100"
              required
              value={endsAt}
              aria-invalid={!!error}
              onChange={(e) => setEndsAt(e.target.value)}
            />
            <FieldError message={error} />
            <DialogFooter className="mt-2">
              <Button type="submit" disabled={pending || !endsAt}>
                재개하기
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
