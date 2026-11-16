import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { type ReactNode, Suspense, ViewTransition } from 'react'
import { getDisplayStatus, getMeetingStatus, resolveConfirmation, StatusBadge } from '@/entities/meeting'
import { getMeeting } from '@/entities/meeting/index.server'
import { getTallies, getVoteRecords } from '@/entities/vote/index.server'
import { CloseReopenButton } from '@/features/meeting-close-reopen'
import { DeleteMeetingButton } from '@/features/meeting-delete'
import { MeetingResultTable } from '@/widgets/meeting-result-table'
import { requireAdmin } from '@/shared/auth'
import { dayParts, formatDateTime, formatDday } from '@/shared/lib'
import { DdayBadge } from '@/shared/ui/dday-badge'
import { Button } from '@/shared/ui/button'
import { CopyLinkButton } from '@/shared/ui/copy-link-button'
import { MapLink } from '@/shared/ui/map-link'
import { PageHeader } from '@/shared/ui/page-header'
import { PageTransition } from '@/shared/ui/page-transition'
import { Thumbnail } from '@/shared/ui/thumbnail'

const VISIBILITY_LABEL = { always: '항상 공개', after_vote: '투표 후 공개', after_close: '마감 후 공개' }

export function MeetingDetailPage({ params }: PageProps<'/dashboard/[id]'>) {
  return (
    <PageTransition>
      <Suspense fallback={<PageHeader title="" backHref="/dashboard" />}>
        {/* 데이터가 늦게 와 커버 모핑이 짝을 못 이루면, 내용이 아래에서 떠오르며 도착 */}
        <ViewTransition enter="reveal" default="none">
          <MeetingDetail params={params} />
        </ViewTransition>
      </Suspense>
    </PageTransition>
  )
}

async function MeetingDetail({ params }: Pick<PageProps<'/dashboard/[id]'>, 'params'>) {
  await requireAdmin()
  const { id } = await params
  const meeting = await getMeeting(id)
  if (!meeting) notFound()
  const [{ tallies, voterCount }, records] = await Promise.all([
    getTallies(id, false),
    // 중복 투표 정리는 기명 모임만 (익명은 누가 누군지 판단할 근거가 없음)
    meeting.isAnonymous ? undefined : getVoteRecords(id),
  ])

  const now = new Date()
  const status = getMeetingStatus(meeting, now)
  const confirmation = status === 'closed' ? resolveConfirmation(meeting.confirmedOptionId, meeting.options) : null
  const confirmed = meeting.options.find((o) => o.id === confirmation?.optionId)
  const confirmedParts = confirmed && dayParts(confirmed.date)
  const displayStatus = getDisplayStatus(meeting, now, meeting.options)

  return (
    <>
      <PageHeader
        title={meeting.title}
        backHref="/dashboard"
        action={
          // 보이는 높이 36px, 누르는 영역은 위아래로 넓혀 44px
          <Button
            asChild
            variant="secondary"
            className="relative h-9 px-3.5 after:absolute after:-inset-y-1 after:inset-x-0"
          >
            <Link href={`/dashboard/${id}/edit`} transitionTypes={['nav-forward']}>편집</Link>
          </Button>
        }
      />
      {/* 노션 페이지: 커버 → 제목 → 속성 → 결과 */}
      {meeting.thumbnailId && (
        // 목록 썸네일과 같은 이름: 행을 누르면 썸네일이 커버로 커짐
        <ViewTransition name={`cover-${id}`} share="morph" default="none">
          <Thumbnail
            publicId={meeting.thumbnailId}
            alt=""
            sizes="(max-width: 500px) 100vw, 500px"
            priority
            className="cover-parallax"
          />
        </ViewTransition>
      )}
      <main className="flex flex-col gap-6 px-5 pt-5 pb-16">
        <div>
          <h2 className="text-display font-semibold text-balance">{meeting.title}</h2>
          <dl className="mt-3 flex flex-col">
            <Property label="상태">
              <StatusBadge status={displayStatus} className="text-sub" />
              {confirmedParts && (
                <span className="ml-2 font-medium">
                  {confirmedParts.label} ({confirmedParts.weekday})
                </span>
              )}
              {confirmed && formatDday(confirmed.date, now) && (
                <DdayBadge className="ml-2">{formatDday(confirmed.date, now)!}</DdayBadge>
              )}
            </Property>
            <Property label="모임장">{meeting.host}</Property>
            {meeting.location && (
              <Property label="장소">
                <MapLink location={meeting.location} naverMapUrl={meeting.naverMapUrl} kakaoMapUrl={meeting.kakaoMapUrl} />
              </Property>
            )}
            <Property label="투표 기간">
              <span className="tabular">
                <span className="whitespace-nowrap">{formatDateTime(meeting.startsAt)} ~</span>{' '}
                <span className="whitespace-nowrap">{formatDateTime(meeting.endsAt)}</span>
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
          <Button asChild variant="secondary">
            <Link href={`/m/${id}`}>
              투표 페이지 열기
              <ArrowUpRight className="text-gray-500" aria-hidden />
            </Link>
          </Button>
          {/* 예정 모임엔 조기 마감 없음 (서버도 거부) */}
          {status !== 'scheduled' && (
            <CloseReopenButton
              meetingId={id}
              isClosed={status === 'closed'}
              endsAtPassed={meeting.endsAt <= now}
              className="col-span-2"
            />
          )}
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
            records={records}
            isClosed={status === 'closed'}
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
