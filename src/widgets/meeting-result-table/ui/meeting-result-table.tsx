import { Crown } from 'lucide-react'
import type { Tally } from '@/entities/vote/index.server'
import { ConfirmDateButton } from '@/features/meeting-confirm-date'
import { cn, formatDay } from '@/shared/lib'

type Props = {
  meetingId: string
  options: { id: string; date: string }[]
  tallies: Record<string, Tally>
  isAnonymous: boolean
  canConfirm: boolean
  confirmedOptionId: string | null
}

export function MeetingResultTable({ meetingId, options, tallies, isAnonymous, canConfirm, confirmedOptionId }: Props) {
  const rows = options
    .map((o) => ({ ...o, ...(tallies[o.id] ?? { count: 0, names: [] }) }))
    .sort((a, b) => b.count - a.count || a.date.localeCompare(b.date))
  const max = rows[0]?.count ?? 0

  return (
    <ol className="flex flex-col gap-2">
      {rows.map((row) => {
        const top = max > 0 && row.count === max
        const confirmed = row.id === confirmedOptionId
        return (
          <li
            key={row.id}
            className={cn(
              'flex flex-col gap-2 rounded-xl border bg-card px-4 py-3',
              top && 'border-primary/40 bg-accent',
              confirmed && 'border-primary ring-2 ring-primary/30',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-base font-semibold tabular-nums">
                {formatDay(row.date)}
                {top && (
                  <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary">
                    <Crown className="size-3.5" aria-hidden />
                    최다
                  </span>
                )}
                {confirmed && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">확정</span>
                )}
              </span>
              <span className="text-sm tabular-nums">{row.count}명</span>
            </div>
            {!isAnonymous && row.names.length > 0 && (
              <p className="text-sm text-muted-foreground">{row.names.join(', ')}</p>
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
