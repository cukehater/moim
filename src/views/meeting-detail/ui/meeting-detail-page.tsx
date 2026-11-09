import { Pencil } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { getDisplayStatus, getMeetingStatus, StatusBadge } from '@/entities/meeting'
import { getMeeting } from '@/entities/meeting/index.server'
import { getTallies } from '@/entities/vote/index.server'
import { CloseReopenButton } from '@/features/meeting-close-reopen'
import { DeleteMeetingButton } from '@/features/meeting-delete'
import { MeetingResultTable } from '@/widgets/meeting-result-table'
import { requireAdmin } from '@/shared/auth'
import { formatDateTime, formatDay } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { CopyLinkButton } from '@/shared/ui/copy-link-button'
import { PageHeader } from '@/shared/ui/page-header'
import { Thumbnail } from '@/shared/ui/thumbnail'

const VISIBILITY_LABEL = { always: '항상 공개', after_vote: '투표 후 공개', after_close: '마감 후 공개' }

export function MeetingDetailPage({ params }: PageProps<'/dashboard/[id]'>) {
  return (
    <Suspense fallback={<PageHeader title="" backHref="/dashboard" />}>
      <MeetingDetail params={params} />
    </Suspense>
  )
}

async function MeetingDetail({ params }: Pick<PageProps<'/dashboard/[id]'>, 'params'>) {
  await requireAdmin()
  const { id } = await params
  const meeting = await getMeeting(id)
  if (!meeting) notFound()
  const { tallies, voterCount } = await getTallies(id, !meeting.isAnonymous)

  const now = new Date()
  const status = getMeetingStatus(meeting, now)
  const confirmed = meeting.options.find((o) => o.id === meeting.confirmedOptionId)

  return (
    <>
      <PageHeader
        title={meeting.title}
        backHref="/dashboard"
        action={
          <Button asChild variant="ghost" size="icon" aria-label="수정">
            <Link href={`/dashboard/${id}/edit`}>
              <Pencil aria-hidden />
            </Link>
          </Button>
        }
      />
      <main className="flex flex-col gap-6 pb-10">
        <Thumbnail publicId={meeting.thumbnailId} alt="" sizes="(max-width: 640px) 100vw, 640px" priority />

        <section className="flex flex-col gap-3 px-4">
          <div className="flex items-center gap-2">
            <StatusBadge status={getDisplayStatus(meeting, now)} />
            <span className="text-sm text-muted-foreground">응답 {voterCount}명</span>
          </div>
          {confirmed && (
            <p className="rounded-xl bg-accent px-4 py-3 font-semibold text-accent-foreground">
              최종 날짜 {formatDay(confirmed.date)}
            </p>
          )}
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-muted-foreground">모임장</dt>
            <dd>{meeting.host}</dd>
            {meeting.location && (
              <>
                <dt className="text-muted-foreground">장소</dt>
                <dd>{meeting.location}</dd>
              </>
            )}
            <dt className="text-muted-foreground">기간</dt>
            <dd className="tabular-nums">
              {formatDateTime(meeting.startsAt)} ~ {formatDateTime(meeting.endsAt)}
            </dd>
            <dt className="text-muted-foreground">방식</dt>
            <dd>
              {meeting.isAnonymous ? '익명' : '기명'} · {meeting.allowMultiple ? '여러 날짜' : '한 날짜'} ·{' '}
              {VISIBILITY_LABEL[meeting.resultVisibility]}
            </dd>
          </dl>
          {meeting.description && <p className="text-sm whitespace-pre-line">{meeting.description}</p>}
          <div className="grid grid-cols-2 gap-2">
            <CopyLinkButton path={`/m/${id}`} />
            <CloseReopenButton meetingId={id} isClosed={status === 'closed'} endsAtPassed={meeting.endsAt <= now} />
          </div>
        </section>

        <section className="flex flex-col gap-3 px-4">
          <h2 className="font-semibold">날짜별 결과</h2>
          {status === 'closed' && !confirmed && (
            <p className="text-sm text-muted-foreground">마감됐어요. 최종 날짜를 확정해 주세요.</p>
          )}
          <MeetingResultTable
            meetingId={id}
            options={meeting.options}
            tallies={tallies}
            isAnonymous={meeting.isAnonymous}
            canConfirm={status === 'closed'}
            confirmedOptionId={meeting.confirmedOptionId}
          />
        </section>

        <div className="flex justify-center px-4">
          <DeleteMeetingButton meetingId={id} />
        </div>
      </main>
    </>
  )
}
