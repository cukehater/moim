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

/** 날짜별 결과. 항상 일자순, 최다 득표는 강조 */
export function MeetingResultTable({ meetingId, options, tallies, isAnonymous, canConfirm, confirmedOptionId }: Props) {
  const rows = options
    .map((o) => ({ ...o, ...dayParts(o.date), ...(tallies[o.id] ?? { count: 0, names: [] }) }))
    .sort((a, b) => a.date.localeCompare(b.date))
  const max = Math.max(0, ...rows.map((r) => r.count))

  return (
    <ol className="flex flex-col gap-2">
      {rows.map((row) => {
        const top = max > 0 && row.count === max
        const confirmed = row.id === confirmedOptionId
        return (
          <li
            key={row.id}
            className={cn(
              'flex flex-col gap-2.5 rounded-2xl border px-4 py-4',
              confirmed ? 'border-brand bg-brand-50' : 'border-gray-200 bg-white',
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-body font-bold tabular">{row.label}</span>
              <span
                className={cn(
                  'text-sub font-semibold',
                  row.dow === 0 ? 'text-sun' : row.dow === 6 ? 'text-sat' : 'text-gray-500',
                )}
              >
                {row.weekday}
              </span>
              {confirmed && <span className="rounded-md bg-brand px-2 py-0.5 text-caption font-semibold text-white">확정</span>}
              {top && !confirmed && (
                <span className="rounded-md bg-brand-50 px-2 py-0.5 text-caption font-semibold text-brand">최다</span>
              )}
              <span className="ml-auto text-sub font-semibold text-gray-700 tabular">{row.count}명</span>
            </div>
            <span aria-hidden className="h-1.5 overflow-hidden rounded-full bg-gray-100">
              <span
                className={cn('block h-full rounded-full', top || confirmed ? 'bg-brand' : 'bg-brand-100')}
                style={{ width: max ? `${(row.count / max) * 100}%` : 0 }}
              />
            </span>
            {!isAnonymous && row.names.length > 0 && (
              <p className="text-sub text-gray-600">{row.names.join(', ')}</p>
            )}
            {canConfirm && (
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
