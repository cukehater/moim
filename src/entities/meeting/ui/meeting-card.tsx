import Link from 'next/link'
import { dayParts, formatShortDate } from '@/shared/lib'
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

/** 당근 목록처럼: 왼쪽 정사각 사진 + 오른쪽 제목·기간·상태 */
export function MeetingCard({ meeting, status, responseCount, confirmedDate }: Props) {
  const confirmed = status === 'confirmed' && confirmedDate ? dayParts(confirmedDate) : null
  return (
    <Link href={`/dashboard/${meeting.id}`} className="pressable flex gap-4 py-4">
      <Thumbnail
        publicId={meeting.thumbnailId}
        alt=""
        sizes="7rem"
        ratio={[1, 1]}
        className="w-[6.5rem] shrink-0 rounded-lg ring-1 ring-black/5 ring-inset"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <h2 className="line-clamp-2 text-body font-semibold">{meeting.title}</h2>
        <p className="mt-0.5 truncate text-caption text-gray-600 tabular">
          {formatShortDate(meeting.startsAt)} ~ {formatShortDate(meeting.endsAt)}
        </p>
        <p className="mt-1.5 flex min-w-0 items-center gap-1.5 text-sub">
          <StatusBadge status={status} />
          <span className="truncate font-bold tabular">
            {confirmed ? `${confirmed.label} ${confirmed.weekday}요일` : `응답 ${responseCount}명`}
          </span>
        </p>
      </div>
    </Link>
  )
}
