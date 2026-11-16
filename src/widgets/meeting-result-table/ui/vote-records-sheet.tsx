'use client'

import { ChevronRight } from 'lucide-react'
import { RemoveVoteButton } from '@/features/vote-remove'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'
import { VoterAvatar } from '@/shared/ui/voter-chip'

/** 서버에서 포맷해 넘김: 클라이언트 번들에서 date-fns 제외 */
export type VoteRow = { id: string; name: string; order: number; time: string; dates: string[] }

type Props = { meetingId: string; dateLabel: string; rows: VoteRow[]; isClosed: boolean }

const FACE_LIMIT = 3
/** 투표 페이지 VotersSheet와 같은 아바타 칸 폭 (위젯끼리 import 불가라 값만 맞춤) */
export const VOTER_SLOT = 'w-[4.875rem]'

/** 운영자용 날짜별 투표자 시트: 이름·투표 시각을 보고 중복 투표를 지움 (고른 날짜는 삭제 확인 창에서) */
export function VoteRecordsSheet({ meetingId, dateLabel, rows, isClosed }: Props) {
  return (
    <Dialog>
      <DialogTrigger className="group/voters flex shrink-0 items-center gap-0.5 pr-3 pl-1 active:opacity-60">
        <span className={`flex ${VOTER_SLOT} justify-end`}>
          {rows.slice(0, FACE_LIMIT).map((r) => (
            <VoterAvatar key={r.id} name={r.name} order={r.order} className="-ml-1.5 ring-2 ring-white first:ml-0" />
          ))}
          {rows.length > FACE_LIMIT && (
            <span
              aria-hidden
              className="-ml-1.5 flex size-6 items-center justify-center rounded-full bg-gray-100 text-[0.625rem] font-semibold text-gray-700 ring-2 ring-white"
            >
              +{rows.length - FACE_LIMIT}
            </span>
          )}
        </span>
        <ChevronRight className="size-4 text-gray-400 transition-colors group-hover/voters:text-gray-700" aria-hidden />
        <span className="sr-only">
          {dateLabel} 투표자 {rows.length}명 보기
        </span>
      </DialogTrigger>
      <DialogContent
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          ;(e.currentTarget as HTMLElement).focus()
        }}
        className="top-auto bottom-0 max-h-[70dvh] max-w-[500px] translate-y-0 gap-3 overflow-y-auto [scrollbar-gutter:stable] rounded-b-none px-0 pt-5 pb-[calc(1rem+env(safe-area-inset-bottom))] data-[state=closed]:zoom-out-100 data-[state=closed]:slide-out-to-bottom data-[state=open]:zoom-in-100 data-[state=open]:slide-in-from-bottom"
      >
        <DialogTitle className="px-5">
          {dateLabel} <span className="font-normal text-gray-600 tabular">· {rows.length}명</span>
        </DialogTitle>
        <DialogDescription className="sr-only">이 날짜에 투표한 사람과 그 사람이 고른 날짜. 중복 투표를 지울 수 있어요</DialogDescription>
        <ul className="border-t border-gray-200">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-3 border-b border-gray-100 py-2 pr-5 pl-5 last:border-0">
              <VoterAvatar name={r.name} order={r.order} />
              <p className="flex min-w-0 flex-1 items-baseline gap-2 text-sub">
                <span className="truncate font-medium">{r.name}</span>
                <span className="shrink-0 text-caption text-gray-500 tabular">{r.time}</span>
              </p>
              <RemoveVoteButton meetingId={meetingId} voteId={r.id} name={r.name} dates={r.dates} isClosed={isClosed} />
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
