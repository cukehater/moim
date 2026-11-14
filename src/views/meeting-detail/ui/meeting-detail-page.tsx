import Link from 'next/link'
import { notFound } from 'next/navigation'
import { type ReactNode, Suspense } from 'react'
import { getDisplayStatus, getMeetingStatus, resolveConfirmation, StatusBadge } from '@/entities/meeting'
import { getMeeting } from '@/entities/meeting/index.server'
import { getTallies } from '@/entities/vote/index.server'
import { CloseReopenButton } from '@/features/meeting-close-reopen'
import { DeleteMeetingButton } from '@/features/meeting-delete'
import { MeetingResultTable } from '@/widgets/meeting-result-table'
import { requireAdmin } from '@/shared/auth'
import { dayParts, formatDateTime, formatDday, mapHref } from '@/shared/lib'
import { DdayBadge } from '@/shared/ui/dday-badge'
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
  const { tallies, voterCount } = await getTallies(id, false)

  const now = new Date()
  const status = getMeetingStatus(meeting, now)
  const confirmation = status === 'closed' ? resolveConfirmation(meeting.confirmedOptionId, meeting.options) : null
  const confirmed = meeting.options.find((o) => o.id === confirmation?.optionId)
  const confirmedParts = confirmed && dayParts(confirmed.date)

  return (
    <>
      <PageHeader
        title={meeting.title}
        backHref="/dashboard"
        action={
          <Button asChild variant="ghost" size="sm" className="h-9">
            <Link href={`/dashboard/${id}/edit`}>편집</Link>
          </Button>
        }
      />
      {/* 노션 페이지: 커버 → 제목 → 속성 → 결과 */}
      {meeting.thumbnailId && (
        <Thumbnail publicId={meeting.thumbnailId} alt="" sizes="(max-width: 500px) 100vw, 500px" priority />
      )}
      <main className="flex flex-col gap-6 px-5 pt-5 pb-16">
        <div>
          <h2 className="text-title font-semibold text-balance">{meeting.title}</h2>
          <dl className="mt-3 flex flex-col">
            <Property label="상태">
              <StatusBadge status={getDisplayStatus(meeting, now, meeting.options)} className="text-sub" />
              {confirmedParts && (
                <span className="ml-2 font-medium">
                  {confirmedParts.label} {confirmedParts.weekday}요일
                </span>
              )}
              {confirmed && formatDday(confirmed.date, now) && (
                <DdayBadge className="ml-2">{formatDday(confirmed.date, now)!}</DdayBadge>
              )}
            </Property>
            <Property label="모임장">{meeting.host}</Property>
            {meeting.location && (
              <Property label="장소">
                <a
                  href={mapHref(meeting.location, meeting.mapUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-gray-300 underline-offset-4 hover:decoration-gray-600"
                >
                  {meeting.location}
                </a>
              </Property>
            )}
            <Property label="투표 기간">
              <span className="tabular">
                {formatDateTime(meeting.startsAt)} ~ {formatDateTime(meeting.endsAt)}
              </span>
            </Property>
            <Property label="방식">
              {meeting.isAnonymous ? '익명' : '기명'} · {meeting.allowMultiple ? '여러 날짜' : '한 날짜'} ·{' '}
              {VISIBILITY_LABEL[meeting.resultVisibility]}
            </Property>
          </dl>
          {meeting.description && (
            <p className="mt-4 border-t border-gray-200 pt-4 text-body whitespace-pre-line text-gray-800">
              {meeting.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <CopyLinkButton path={`/m/${id}`} />
          <CloseReopenButton meetingId={id} isClosed={status === 'closed'} endsAtPassed={meeting.endsAt <= now} />
        </div>

        <section>
          <h3 className="pb-2.5 text-heading font-semibold">
            날짜별 결과 <span className="text-sub font-normal text-gray-600">· 응답 {voterCount}명</span>
          </h3>
          <MeetingResultTable
            meetingId={id}
            options={meeting.options}
            tallies={tallies}
            confirmation={confirmation}
          />
          {confirmation && !confirmed && (
            <p className="pt-2 text-caption text-gray-600">동점이에요. 최종 날짜를 골라 주세요.</p>
          )}
        </section>

        <DeleteMeetingButton meetingId={id} />
      </main>
    </>
  )
}

function Property({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-8 items-start gap-2 py-1 text-sub">
      <dt className="w-[4.75rem] shrink-0 pt-px text-gray-600">{label}</dt>
      <dd className="flex min-w-0 flex-wrap items-center text-gray-900">{children}</dd>
    </div>
  )
}
