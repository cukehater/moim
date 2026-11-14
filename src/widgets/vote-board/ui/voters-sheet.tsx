'use client'

import { ChevronRight } from 'lucide-react'
import type { Voter } from '@/entities/vote'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'
import { VoterAvatar, VoterChip } from '@/shared/ui/voter-chip'

type Props = { dateLabel: string; voters: Voter[] }

const FACE_LIMIT = 3
/** 아바타 4개(3 + '+N') 폭. 투표자 없는 줄의 빈칸도 같은 폭 */
export const VOTER_SLOT = 'w-[4.875rem]'

/** 아바타 묶음을 누르면 바텀 시트로 투표자 목록 (모바일엔 hover 툴팁이 없음) */
export function VotersSheet({ dateLabel, voters }: Props) {
  return (
    <Dialog>
      <DialogTrigger className="group/voters flex shrink-0 items-center gap-0.5 pr-3 pl-1 active:opacity-60">
        {/* 아바타 수와 무관하게 폭 고정: 막대·인원 수 세로 정렬 유지 */}
        <span className={`flex ${VOTER_SLOT} justify-end`}>
          {voters.slice(0, FACE_LIMIT).map((v) => (
            <VoterAvatar key={v.order} name={v.name} order={v.order} className="-ml-1.5 ring-2 ring-white first:ml-0" />
          ))}
          {voters.length > FACE_LIMIT && (
            <span
              aria-hidden
              className="-ml-1.5 flex size-6 items-center justify-center rounded-full bg-gray-100 text-[0.625rem] font-semibold text-gray-700 ring-2 ring-white"
            >
              +{voters.length - FACE_LIMIT}
            </span>
          )}
        </span>
        <ChevronRight className="size-4 text-gray-400 transition-colors group-hover/voters:text-gray-700 [@media(pointer:coarse)]:group-hover/voters:text-gray-400" aria-hidden />
        <span className="sr-only">{dateLabel} 투표자 {voters.length}명 보기</span>
      </DialogTrigger>
      <DialogContent
        // 닫기 버튼 대신 시트 자체에 포커스: 열자마자 포커스 링이 뜨지 않게
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          ;(e.currentTarget as HTMLElement).focus()
        }}
        className="top-auto bottom-0 max-h-[70dvh] max-w-[500px] translate-y-0 gap-3 overflow-y-auto rounded-b-none px-0 pt-5 pb-[calc(1rem+env(safe-area-inset-bottom))] data-[state=closed]:zoom-out-100 data-[state=closed]:slide-out-to-bottom data-[state=open]:zoom-in-100 data-[state=open]:slide-in-from-bottom"
      >
        <DialogTitle className="px-5 text-body font-semibold">
          {dateLabel} <span className="font-normal text-gray-600 tabular">· {voters.length}명</span>
        </DialogTitle>
        <DialogDescription className="sr-only">이 날짜에 투표한 사람 목록</DialogDescription>
        <ul className="border-t border-gray-200">
          {voters.map((v) => (
            <li key={v.order} className="flex h-11 items-center border-b border-gray-100 px-5 last:border-0">
              <VoterChip name={v.name} order={v.order} />
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
