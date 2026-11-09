import Link from 'next/link'
import { formatDateTime } from '@/shared/lib'
import { Thumbnail } from '@/shared/ui/thumbnail'
import type { Meeting } from '../api'
import type { DisplayStatus } from '../model'
import { StatusBadge } from './status-badge'

type Props = {
  meeting: Pick<Meeting, 'id' | 'title' | 'description' | 'thumbnailId' | 'startsAt' | 'endsAt'>
  status: DisplayStatus
  responseCount: number
}

export function MeetingCard({ meeting, status, responseCount }: Props) {
  return (
    <Link href={`/dashboard/${meeting.id}`} className="pressable block rounded-2xl">
      <Thumbnail
        publicId={meeting.thumbnailId}
        alt=""
        sizes="(max-width: 500px) 100vw, 250px"
        className="rounded-2xl"
      />
      <div className="flex flex-col gap-1 px-1 pt-3">
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          <span className="text-caption text-gray-500 tabular">응답 {responseCount}명</span>
        </div>
        <h2 className="truncate text-body font-bold">{meeting.title}</h2>
        {meeting.description && <p className="line-clamp-2 text-sub text-gray-600">{meeting.description}</p>}
        <p className="text-caption text-gray-500 tabular">
          {formatDateTime(meeting.startsAt)} ~ {formatDateTime(meeting.endsAt)}
        </p>
      </div>
    </Link>
  )
}
