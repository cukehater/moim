import { CalendarDays, UsersRound } from 'lucide-react'
import Link from 'next/link'
import { dayParts, formatDday, formatPeriod } from '@/shared/lib'
import { DdayBadge } from '@/shared/ui/dday-badge'
import { Thumbnail } from '@/shared/ui/thumbnail'
import type { Meeting } from '../api'
import type { DisplayStatus } from '../model'
import { StatusBadge } from './status-badge'

type Props = {
  meeting: Pick<Meeting, 'id' | 'title' | 'thumbnailId' | 'startsAt' | 'endsAt'>
  status: DisplayStatus
  responseCount: number
  /** 확정된 날짜 'yyyy-MM-dd' */
  confirmedDate?: string | null
}

/** 리니어 이슈 행처럼: 작은 썸네일 + 제목·기간·상태, 오른쪽 응답 수 */
export function MeetingCard({ meeting, status, responseCount, confirmedDate }: Props) {
  const confirmed = status === 'confirmed' && confirmedDate ? dayParts(confirmedDate) : null
  const dday = confirmed && confirmedDate ? formatDday(confirmedDate, new Date()) : null
  return (
    <Link href={`/dashboard/${meeting.id}`} className="pressable flex gap-3 px-5 py-3">
      {meeting.thumbnailId ? (
        <Thumbnail
          publicId={meeting.thumbnailId}
          alt=""
          sizes="3rem"
          ratio={[1, 1]}
          className="w-10 shrink-0 rounded-md ring-1 ring-black/5 ring-inset"
        />
      ) : (
        <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-400">
          <CalendarDays className="size-4" strokeWidth={1.75} />
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-baseline gap-2">
          <h2 className="min-w-0 flex-1 truncate text-body font-medium">{meeting.title}</h2>
          <span className="flex shrink-0 items-center gap-1 text-caption text-gray-600 tabular">
            <UsersRound className="size-3.5" strokeWidth={1.75} aria-hidden />
            <span className="sr-only">응답</span>
            {responseCount}
          </span>
        </div>
        <p className="truncate text-caption text-gray-600 tabular">
          {formatPeriod(meeting.startsAt)} ~ {formatPeriod(meeting.endsAt)}
        </p>
        <p className="mt-0.5 flex items-center gap-2">
          <StatusBadge status={status} />
          {confirmed && (
            <span className="text-caption font-medium text-gray-900">
              {confirmed.label} {confirmed.weekday}요일
            </span>
          )}
          {dday && <DdayBadge>{dday}</DdayBadge>}
        </p>
      </div>
    </Link>
  )
}
