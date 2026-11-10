'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'
import { confirmDate } from '../api/confirm-date.action'

type Props = { meetingId: string; optionId: string; isConfirmed: boolean }

export function ConfirmDateButton({ meetingId, optionId, isConfirmed }: Props) {
  const [pending, startTransition] = useTransition()
  const run = () =>
    startTransition(async () => {
      const r = await confirmDate(meetingId, isConfirmed ? null : optionId)
      if (r.ok) toast.success(isConfirmed ? '확정을 취소했어요' : '날짜를 확정했어요')
      else toast.error(r.message)
    })
  return (
    <Button size="sm" variant={isConfirmed ? 'ghost' : 'secondary'} disabled={pending} onClick={run} className="h-tap px-3">
      {isConfirmed ? '확정 취소' : '이 날짜로 확정'}
    </Button>
  )
}
