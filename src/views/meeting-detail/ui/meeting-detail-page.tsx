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
import { dayParts, formatDateTime } from '@/shared/lib'
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
  const confirmedParts = confirmed && dayParts(confirmed.date)

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
      <main className="pb-12">
        <Thumbnail publicId={meeting.thumbnailId} alt="" sizes="(max-width: 500px) 100vw, 500px" priority />

        <section className="flex flex-col gap-4 px-5 pt-5 pb-6">
          <div className="flex items-center gap-2">
            <StatusBadge status={getDisplayStatus(meeting, now)} />
            <span className="text-sub text-gray-500 tabular">응답 {voterCount}명</span>
          </div>
          {confirmedParts && (
            <p className="flex items-center justify-between rounded-2xl bg-brand-50 px-4 py-3.5">
              <span className="text-sub font-semibold text-brand">최종 날짜</span>
              <span className="text-body font-bold text-brand tabular">
                {confirmedParts.label} {confirmedParts.weekday}요일
              </span>
            </p>
          )}
          <dl className="grid grid-cols-[4.5rem_1fr] gap-x-3 gap-y-2.5 text-sub">
            <dt className="text-gray-500">모임장</dt>
            <dd className="text-gray-900">{meeting.host}</dd>
            {meeting.location && (
              <>
                <dt className="text-gray-500">장소</dt>
                <dd className="text-gray-900">{meeting.location}</dd>
              </>
            )}
            <dt className="text-gray-500">기간</dt>
            <dd className="text-gray-900 tabular">
              {formatDateTime(meeting.startsAt)} ~ {formatDateTime(meeting.endsAt)}
            </dd>
            <dt className="text-gray-500">방식</dt>
            <dd className="text-gray-900">
              {meeting.isAnonymous ? '익명' : '기명'} · {meeting.allowMultiple ? '여러 날짜' : '한 날짜'} ·{' '}
              {VISIBILITY_LABEL[meeting.resultVisibility]}
            </dd>
          </dl>
          {meeting.description && <p className="text-body whitespace-pre-line text-gray-700">{meeting.description}</p>}
          <div className="mt-1 grid grid-cols-2 gap-2">
            <CopyLinkButton path={`/m/${id}`} />
            <CloseReopenButton meetingId={id} isClosed={status === 'closed'} endsAtPassed={meeting.endsAt <= now} />
          </div>
        </section>

        <div className="h-3 bg-gray-100" />

        <section className="flex flex-col gap-4 px-5 pt-6">
          <div>
            <h2 className="text-heading font-bold">날짜별 결과</h2>
            {status === 'closed' && !confirmed && (
              <p className="text-sub text-gray-500">마감됐어요. 최종 날짜를 확정해 주세요.</p>
            )}
          </div>
          <MeetingResultTable
            meetingId={id}
            options={meeting.options}
            tallies={tallies}
            isAnonymous={meeting.isAnonymous}
            canConfirm={status === 'closed'}
            confirmedOptionId={meeting.confirmedOptionId}
          />
        </section>

        <div className="mt-8 flex justify-center px-5">
          <DeleteMeetingButton meetingId={id} />
        </div>
      </main>
    </>
  )
}
