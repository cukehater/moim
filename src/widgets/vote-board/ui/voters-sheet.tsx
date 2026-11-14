'use client'

import { ChevronRight } from 'lucide-react'
import type { Voter } from '@/entities/vote'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'
import { VoterChip } from '@/shared/ui/voter-chip'

type Props = { dateLabel: string; voters: Voter[] }

/** 모바일엔 hover가 없어 툴팁 대신 바텀 시트로 투표자 목록 */
export function VotersSheet({ dateLabel, voters }: Props) {
  return (
    <Dialog>
      <DialogTrigger className="flex min-w-[4.25rem] shrink-0 items-center justify-center gap-0.5 rounded-lg border border-gray-200 bg-white pr-2 pl-3 text-sub font-bold text-gray-700 tabular active:opacity-70">
        {voters.length}명
        <ChevronRight className="size-4 text-gray-400" aria-hidden />
        <span className="sr-only"> 투표자 보기</span>
      </DialogTrigger>
      <DialogContent className="top-auto bottom-0 max-w-[500px] translate-y-0 rounded-b-none pb-[calc(1.5rem+env(safe-area-inset-bottom))] data-[state=closed]:zoom-out-100 data-[state=closed]:slide-out-to-bottom data-[state=open]:zoom-in-100 data-[state=open]:slide-in-from-bottom">
        <DialogTitle>
          {dateLabel} 투표자 <span className="text-brand tabular">{voters.length}명</span>
        </DialogTitle>
        <DialogDescription className="sr-only">이 날짜에 투표한 사람 목록</DialogDescription>
        <ul className="flex flex-wrap gap-2">
          {voters.map((v) => (
            <li key={v.order}>
              <VoterChip name={v.name} order={v.order} />
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
