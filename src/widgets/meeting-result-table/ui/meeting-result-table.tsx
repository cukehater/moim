import { Check } from 'lucide-react'
import type { Tally } from '@/entities/vote/index.server'
import { ConfirmDateButton } from '@/features/meeting-confirm-date'
import { cn, dayParts } from '@/shared/lib'
import { VoterChip } from '@/shared/ui/voter-chip'

type Props = {
  meetingId: string
  options: { id: string; date: string }[]
  tallies: Record<string, Tally>
  isAnonymous: boolean
  /** 마감 후 resolveConfirmation 결과. 마감 전이면 null */
  confirmation: { optionId: string | null; tied: string[] } | null
}

/** 날짜별 결과. 항상 일자순, 최다 득표는 막대로 강조. 동점일 때만 운영자가 확정 */
export function MeetingResultTable({ meetingId, options, tallies, isAnonymous, confirmation }: Props) {
  const rows = options
    .map((o) => ({ ...o, ...dayParts(o.date), ...(tallies[o.id] ?? { count: 0, voters: [] }) }))
    .sort((a, b) => a.date.localeCompare(b.date))
  const max = Math.max(0, ...rows.map((r) => r.count))

  return (
    <ol className="grouped">
      {rows.map((row) => {
        const top = max > 0 && row.count === max
        const confirmed = row.id === confirmation?.optionId
        const auto = confirmed && confirmation.tied.length === 0
        return (
          <li key={row.id} className="flex flex-col gap-1.5 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-body font-bold">
                {row.label}{' '}
                <span className={row.dow === 0 ? 'text-sun' : row.dow === 6 ? 'text-sat' : 'text-gray-500'}>
                  {row.weekday}요일
                </span>
              </span>
              {confirmed && (
                <span className="flex items-center gap-0.5 text-caption font-semibold text-brand">
                  <Check className="size-3.5" strokeWidth={3} aria-hidden />
                  {auto ? '최다 득표로 자동 확정' : '확정'}
                </span>
              )}
              <span className={cn('ml-auto text-body tabular', top ? 'font-semibold text-gray-900' : 'text-gray-500')}>
                {row.count}명
              </span>
            </div>
            <span aria-hidden className="h-[5px] overflow-hidden rounded-full bg-gray-200">
              <span
                className={cn('block h-full rounded-full', top ? 'bg-brand' : 'bg-gray-400')}
                style={{ width: max ? `${(row.count / max) * 100}%` : 0 }}
              />
            </span>
            {!isAnonymous && row.voters.length > 0 && (
              <ul className="flex flex-wrap gap-1.5 pt-0.5">
                {row.voters.map((v) => (
                  <li key={v.order}>
                    <VoterChip name={v.name} order={v.order} className="h-6 px-2 text-caption" />
                  </li>
                ))}
              </ul>
            )}
            {confirmation?.tied.includes(row.id) && (
              <div className="-mr-2 flex justify-end">
                <ConfirmDateButton meetingId={meetingId} optionId={row.id} isConfirmed={confirmed} />
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
