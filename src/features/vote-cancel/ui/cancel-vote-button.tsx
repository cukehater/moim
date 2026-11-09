'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog'
import { Button } from '@/shared/ui/button'
import { cancelVote } from '../api/cancel-vote.action'

export function CancelVoteButton({ meetingId, onCanceled }: { meetingId: string; onCanceled?: () => void }) {
  const [pending, startTransition] = useTransition()
  const cancel = () =>
    startTransition(async () => {
      const r = await cancelVote(meetingId)
      if (r.ok) {
        toast.success('투표를 취소했어요')
        onCanceled?.()
      } else toast.error(r.message)
    })
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="lg" disabled={pending}>
          투표 취소
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>투표를 취소할까요?</AlertDialogTitle>
          <AlertDialogDescription>내가 고른 날짜가 모두 지워져요.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>아니요</AlertDialogCancel>
          <AlertDialogAction onClick={cancel}>투표 취소</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
