'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { cn, toKstInput, type ActionResult } from '@/shared/lib'
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
        const endsAtError = r.fieldErrors?.endsAt?.[0]
        setError(endsAtError)
        // 상세를 연 사이 종료 시각이 지나 서버가 새 종료 시각을 요구하면 모달을 열어 오류를 보여줌
        if (endsAtError) setDialogOpen(true)
        if (r.message) toast.error(r.message)
      }
    })

  if (!isClosed) {
    return (
      <Button variant="caution" className={className} disabled={pending} onClick={() => run(() => closeMeeting(meetingId), '투표를 마감했어요')}>
        {pending ? '마감 중…' : '조기 마감'}
      </Button>
    )
  }

  const reopen = () => run(() => reopenMeeting(meetingId, endsAt || undefined), '투표를 다시 열었어요')

  return (
    <>
      <Button
        variant="resume"
        className={className}
        disabled={pending}
        onClick={() => (endsAtPassed ? setDialogOpen(true) : reopen())}
      >
        {pending && !dialogOpen ? '여는 중…' : '투표 재개'}
      </Button>
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          // 다시 열 때 지난 입력·오류가 남지 않게
          if (!open) {
            setEndsAt('')
            setError(undefined)
          }
        }}
      >
        <DialogContent
          // 열자마자 날짜 입력에 포커스가 가면 모바일에서 날짜 선택기가 바로 뜸: 모달 자체에 포커스
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            ;(e.currentTarget as HTMLElement).focus()
          }}
        >
          <DialogHeader>
            <DialogTitle>투표 재개</DialogTitle>
            <DialogDescription>종료 시각이 지났어요. 새 종료 시각을 정해 주세요.</DialogDescription>
          </DialogHeader>
          {/* min-w-0: 모달이 grid라 iOS 날짜 입력의 고유 폭만큼 칸이 넓어져 모달 밖으로 밀리는 것 방지 */}
          <form
            className="flex min-w-0 flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              reopen()
            }}
          >
            <Label htmlFor="reopen-ends-at">새 종료 시각</Label>
            <div className="relative">
              <Input
                id="reopen-ends-at"
                type="datetime-local"
                // iOS 사파리 네이티브 날짜 컨트롤: 기본 모양·가운데 정렬 제거.
                // 고정 높이면 값이 위로 붙어서 위아래 여백 + 줄 높이로 높이를 만듦 (빈 값일 때도 한 줄 유지)
                className={cn(
                  'peer block h-auto appearance-none bg-gray-100 py-2 text-left leading-6 [&::-webkit-date-and-time-value]:min-h-6 [&::-webkit-date-and-time-value]:text-left',
                  // 빈 값: 크롬의 '연도-월-일 --:--'를 숨겨 안내 문구와 겹치지 않게 (입력 중엔 보임)
                  !endsAt && 'text-transparent focus:text-gray-900',
                )}
                required
                value={endsAt}
                aria-invalid={!!error}
                min={toKstInput(new Date())}
                onChange={(e) => {
                  setEndsAt(e.target.value)
                  setError(undefined)
                }}
              />
              {/* iOS는 빈 날짜 입력에 아무것도 안 그림: placeholder 대신 (입력 중엔 숨김) */}
              {!endsAt && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-body text-gray-400 peer-focus:hidden"
                >
                  날짜와 시간을 골라 주세요
                </span>
              )}
            </div>
            <FieldError message={error} />
            <DialogFooter className="mt-2">
              <Button type="submit" disabled={pending || !endsAt}>
                {pending ? '여는 중…' : '재개하기'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
