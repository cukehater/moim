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
    <Link
      href={`/dashboard/${meeting.id}`}
      className="group block overflow-hidden rounded-2xl border bg-card outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <Thumbnail publicId={meeting.thumbnailId} alt="" sizes="(max-width: 640px) 100vw, 320px" />
      <div className="flex flex-col gap-1.5 p-4">
        <div className="flex items-center justify-between gap-2">
          <StatusBadge status={status} />
          <span className="text-xs text-muted-foreground">응답 {responseCount}명</span>
        </div>
        <h2 className="truncate text-base font-semibold">{meeting.title}</h2>
        {meeting.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{meeting.description}</p>
        )}
        <p className="text-xs text-muted-foreground tabular-nums">
          {formatDateTime(meeting.startsAt)} ~ {formatDateTime(meeting.endsAt)}
        </p>
      </div>
    </Link>
  )
}
