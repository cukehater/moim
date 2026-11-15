import { Check } from 'lucide-react'
import type { Tally, VoteRecord } from '@/entities/vote/index.server'
import { ConfirmDateButton } from '@/features/meeting-confirm-date'
import { cn, dayParts, formatDateTime } from '@/shared/lib'
import { VOTER_SLOT, VoteRecordsSheet, type VoteRow } from './vote-records-sheet'

type Props = {
  meetingId: string
  options: { id: string; date: string }[]
  tallies: Record<string, Tally>
  /** 마감 후 resolveConfirmation 결과. 마감 전이면 null */
  confirmation: { optionId: string | null; tied: string[] } | null
  /** 기명 모임의 투표자별 투표. 없으면(익명) 투표자 시트도 없음 */
  records?: VoteRecord[]
  isClosed: boolean
}

/** 날짜별 결과. 항상 일자순, 최다 득표는 막대로 강조. 동점일 때만 운영자가 확정 */
export function MeetingResultTable({ meetingId, options, tallies, confirmation, records, isClosed }: Props) {
  const rows = options
    .map((o) => ({ ...o, ...dayParts(o.date), ...(tallies[o.id] ?? { count: 0, voters: [] }) }))
    .sort((a, b) => a.date.localeCompare(b.date))
  const voteRows: (VoteRow & { optionIds: string[] })[] = (records ?? []).map((v) => ({
    id: v.id,
    name: v.name,
    order: v.order,
    time: formatDateTime(v.createdAt),
    // 투표 완료 팝업과 같은 '1월 9일(토)' 표기
    dates: rows.filter((r) => v.optionIds.includes(r.id)).map((r) => `${r.label} (${r.weekday})`),
    optionIds: v.optionIds,
  }))
  const max = Math.max(0, ...rows.map((r) => r.count))

  return (
    <ol className="grouped">
      {rows.map((row) => {
        const top = max > 0 && row.count === max
        const confirmed = row.id === confirmation?.optionId
        const auto = confirmed && confirmation.tied.length === 0
        const voters = voteRows.filter((v) => v.optionIds.includes(row.id))
        return (
          <li key={row.id} className={cn('flex flex-col', confirmed && 'bg-brand-50')}>
            {/* 투표 페이지 OptionCard와 같은 배치: 날짜(요일) · 막대 · 인원 · 투표자 칸 */}
            <div className="flex min-h-12 items-stretch">
              <div className="flex min-w-0 flex-1 items-center gap-3 pr-2 pl-3.5">
                <span className="flex min-w-0 flex-1 items-center gap-1.5 text-body font-medium">
                  <span className="truncate">
                    {row.label}
                    <span
                      className={cn(
                        'ml-1 text-sub font-normal',
                        row.dow === 0 ? 'text-sun' : row.dow === 6 ? 'text-sat' : 'text-gray-600',
                      )}
                    >
                      ({row.weekday})
                    </span>
                  </span>
                  {/* 확정은 글자 뱃지 대신 체크 하나 (자동·수동 구분은 스크린 리더 이름으로) */}
                  {confirmed && (
                    <span
                      role="img"
                      aria-label={auto ? '자동 확정' : '확정'}
                      className="flex size-4 shrink-0 items-center justify-center rounded-full bg-brand text-white"
                    >
                      <Check className="size-2.5" strokeWidth={3.5} aria-hidden />
                    </span>
                  )}
                </span>
                <span aria-hidden className={cn('h-1 w-12 shrink-0 overflow-hidden rounded-full bg-gray-200', !row.count && 'invisible')}>
                  <span
                    className={cn('bar-grow block h-full rounded-full', top ? 'bg-brand' : 'bg-gray-400')}
                    style={{ width: max ? `${(row.count / max) * 100}%` : 0 }}
                  />
                </span>
                <span
                  className={cn(
                    'w-7 shrink-0 text-right text-sub font-medium tabular',
                    row.count ? 'text-gray-700' : 'text-gray-400',
                  )}
                >
                  {row.count}명
                </span>
              </div>
              {voters.length > 0 ? (
                <VoteRecordsSheet
                  meetingId={meetingId}
                  dateLabel={`${row.label} (${row.weekday})`}
                  rows={voters}
                  isClosed={isClosed}
                />
              ) : (
                records && (
                  // 시트 버튼과 같은 폭의 빈칸: 막대·인원 세로 정렬 유지
                  <span aria-hidden className="flex shrink-0 items-center gap-0.5 pr-3 pl-1">
                    <span className={VOTER_SLOT} />
                    <span className="size-4" />
                  </span>
                )
              )}
            </div>
            {confirmation?.tied.includes(row.id) && (
              <div className="flex justify-end px-3.5 pb-3">
                <ConfirmDateButton meetingId={meetingId} optionId={row.id} isConfirmed={confirmed} />
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
