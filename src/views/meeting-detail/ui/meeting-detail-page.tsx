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
import { dayParts, formatDateTime, mapHref } from '@/shared/lib'
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
  const confirmation = status === 'closed' ? resolveConfirmation(meeting.confirmedOptionId, meeting.options) : null
  const confirmed = meeting.options.find((o) => o.id === confirmation?.optionId)
  const confirmedParts = confirmed && dayParts(confirmed.date)

  return (
    <>
      <PageHeader
        title={meeting.title}
        backHref="/dashboard"
        action={
          <Button asChild variant="ghost" className="h-tap px-3">
            <Link href={`/dashboard/${id}/edit`}>편집</Link>
          </Button>
        }
      />
      <main className="flex flex-col gap-7 px-5 pt-4 pb-16">
        <div>
          {meeting.thumbnailId && (
            <Thumbnail
              publicId={meeting.thumbnailId}
              alt=""
              sizes="(max-width: 500px) 100vw, 500px"
              priority
              className="-mx-5 -mt-4 mb-4 w-auto"
            />
          )}
          <div>
            <StatusBadge status={getDisplayStatus(meeting, now, meeting.options)} />
            <h2 className="mt-2 text-title font-bold text-balance">{meeting.title}</h2>
            {meeting.description && (
              <p className="mt-2 text-body whitespace-pre-line text-gray-800">{meeting.description}</p>
            )}
          </div>
        </div>

        {confirmedParts && (
          <div className="grouped">
            <div className="flex min-h-tap items-center px-4">
              <span className="flex-1 text-body">최종 날짜</span>
              <span className="text-body font-semibold text-brand">
                {confirmedParts.label} {confirmedParts.weekday}요일
              </span>
            </div>
          </div>
        )}

        <section>
          <h3 className="section-label">정보</h3>
          <dl className="grouped">
            <InfoRow label="모임장" value={meeting.host} />
            {meeting.location && (
              <InfoRow
                label="장소"
                value={
                  <a
                    href={mapHref(meeting.location, meeting.mapUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand underline-offset-4 hover:underline"
                  >
                    {meeting.location}
                  </a>
                }
              />
            )}
            <InfoRow label="시작" value={formatDateTime(meeting.startsAt)} />
            <InfoRow label="종료" value={formatDateTime(meeting.endsAt)} />
            <InfoRow label="이름" value={meeting.isAnonymous ? '익명' : '기명'} />
            <InfoRow label="선택" value={meeting.allowMultiple ? '여러 날짜' : '한 날짜'} />
            <InfoRow label="결과 공개" value={VISIBILITY_LABEL[meeting.resultVisibility]} />
          </dl>
        </section>

        <div className="grid grid-cols-2 gap-2">
          <CopyLinkButton path={`/m/${id}`} />
          <CloseReopenButton meetingId={id} isClosed={status === 'closed'} endsAtPassed={meeting.endsAt <= now} />
        </div>

        <section>
          <h3 className="section-label">날짜별 결과 · 응답 {voterCount}명</h3>
          <MeetingResultTable
            meetingId={id}
            options={meeting.options}
            tallies={tallies}
            isAnonymous={meeting.isAnonymous}
            confirmation={confirmation}
          />
          {confirmation && !confirmed && (
            <p className="px-4 pt-2 text-caption text-gray-500">동점이에요. 최종 날짜를 골라 주세요.</p>
          )}
        </section>

        <DeleteMeetingButton meetingId={id} />
      </main>
    </>
  )
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex min-h-tap items-center gap-4 px-4 py-2.5">
      <dt className="text-body">{label}</dt>
      <dd className="ml-auto text-right text-body text-gray-500 tabular">{value}</dd>
    </div>
  )
}
