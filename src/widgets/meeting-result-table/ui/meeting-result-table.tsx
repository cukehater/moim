import { Check } from 'lucide-react'
import type { Tally, VoteRecord } from '@/entities/vote/index.server'
import { ConfirmDateButton } from '@/features/meeting-confirm-date'
import { cn, dayParts, formatDateTime } from '@/shared/lib'
import { VoteRecordsSheet, type VoteRow } from './vote-records-sheet'

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
    dates: rows.filter((r) => v.optionIds.includes(r.id)).map((r) => `${r.label}(${r.weekday})`),
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
          <li key={row.id} className={cn('flex flex-col gap-2 px-3.5 py-3', confirmed && 'bg-brand-50')}>
            <div className="flex items-center gap-2">
              <span className="text-body font-medium">
                {row.label}
                <span
                  className={cn(
                    'ml-1.5 text-sub font-normal',
                    row.dow === 0 ? 'text-sun' : row.dow === 6 ? 'text-sat' : 'text-gray-600',
                  )}
                >
                  {row.weekday}요일
                </span>
              </span>
              {confirmed && (
                <span className="flex items-center gap-1 rounded-sm bg-brand px-1.5 py-0.5 text-caption font-medium text-white">
                  <Check className="size-3" strokeWidth={3} aria-hidden />
                  {auto ? '자동 확정' : '확정'}
                </span>
              )}
              <span aria-hidden className="ml-auto h-1 w-12 overflow-hidden rounded-full bg-gray-200">
                <span
                  className={cn('bar-grow block h-full rounded-full', top ? 'bg-brand' : 'bg-gray-400')}
                  style={{ width: max ? `${(row.count / max) * 100}%` : 0 }}
                />
              </span>
              <span className={cn('w-8 text-right text-sub tabular', top ? 'font-semibold text-gray-900' : 'text-gray-600')}>
                {row.count}명
              </span>
              {voters.length > 0 && (
                <VoteRecordsSheet
                  meetingId={meetingId}
                  dateLabel={`${row.label} ${row.weekday}요일`}
                  rows={voters}
                  isClosed={isClosed}
                />
              )}
            </div>
            {confirmation?.tied.includes(row.id) && (
              <div className="flex justify-end">
                <ConfirmDateButton meetingId={meetingId} optionId={row.id} isConfirmed={confirmed} />
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
