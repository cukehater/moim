import { Check } from 'lucide-react'
import type { Tally } from '@/entities/vote/index.server'
import { ConfirmDateButton } from '@/features/meeting-confirm-date'
import { cn, dayParts } from '@/shared/lib'

type Props = {
  meetingId: string
  options: { id: string; date: string }[]
  tallies: Record<string, Tally>
  /** 마감 후 resolveConfirmation 결과. 마감 전이면 null */
  confirmation: { optionId: string | null; tied: string[] } | null
}

/** 날짜별 결과. 항상 일자순, 최다 득표는 막대로 강조. 동점일 때만 운영자가 확정 */
export function MeetingResultTable({ meetingId, options, tallies, confirmation }: Props) {
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
                  className={cn('block h-full rounded-full', top ? 'bg-brand' : 'bg-gray-400')}
                  style={{ width: max ? `${(row.count / max) * 100}%` : 0 }}
                />
              </span>
              <span className={cn('w-8 text-right text-sub tabular', top ? 'font-semibold text-gray-900' : 'text-gray-600')}>
                {row.count}명
              </span>
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
