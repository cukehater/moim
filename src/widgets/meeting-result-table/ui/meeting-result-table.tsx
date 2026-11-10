import { Check } from 'lucide-react'
import type { Tally } from '@/entities/vote/index.server'
import { ConfirmDateButton } from '@/features/meeting-confirm-date'
import { cn, dayParts } from '@/shared/lib'

type Props = {
  meetingId: string
  options: { id: string; date: string }[]
  tallies: Record<string, Tally>
  isAnonymous: boolean
  canConfirm: boolean
  confirmedOptionId: string | null
}

/** 날짜별 결과. 항상 일자순, 최다 득표는 막대로 강조 */
export function MeetingResultTable({ meetingId, options, tallies, isAnonymous, canConfirm, confirmedOptionId }: Props) {
  const rows = options
    .map((o) => ({ ...o, ...dayParts(o.date), ...(tallies[o.id] ?? { count: 0, names: [] }) }))
    .sort((a, b) => a.date.localeCompare(b.date))
  const max = Math.max(0, ...rows.map((r) => r.count))

  return (
    <ol className="grouped">
      {rows.map((row) => {
        const top = max > 0 && row.count === max
        const confirmed = row.id === confirmedOptionId
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
                  확정
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
            {!isAnonymous && row.names.length > 0 && (
              <p className="text-caption text-gray-500">{row.names.join(', ')}</p>
            )}
            {canConfirm && (
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
