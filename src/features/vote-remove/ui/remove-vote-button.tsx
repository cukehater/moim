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
import { DateBadges } from '@/shared/ui/date-badges'
import { removeVote } from '../api/remove-vote.action'

type Props = { meetingId: string; voteId: string; name: string; dates: string[]; isClosed: boolean }

export function RemoveVoteButton({ meetingId, voteId, name, dates, isClosed }: Props) {
  const [pending, startTransition] = useTransition()
  const remove = () =>
    startTransition(async () => {
      const r = await removeVote(meetingId, voteId)
      if (r.ok) toast.success('투표를 지웠어요')
      else toast.error(r.message ?? '투표를 지우지 못했어요')
    })
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={pending} aria-label={`${name} 투표 삭제`}>
          삭제
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{name}님의 투표를 지울까요?</AlertDialogTitle>
          {/* 투표 완료 팝업과 같은 날짜 뱃지 */}
          <DateBadges dates={dates} aria-label="고른 날짜" />
          <AlertDialogDescription>
            고른 날짜가 모두 지워지고 되돌릴 수 없어요.
            {isClosed && ' 확정 날짜가 바뀔 수 있어요.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={remove}>
            삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
