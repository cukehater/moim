import { CalendarCheck, Clock, type LucideIcon, MapPin, UserRound } from 'lucide-react'
import { notFound } from 'next/navigation'
import { type ReactNode, Suspense } from 'react'
import { canSeeResults, getMeetingStatus, resolveConfirmation } from '@/entities/meeting'
import { getMeeting } from '@/entities/meeting/index.server'
import { getMyVote, getTallies } from '@/entities/vote/index.server'
import { StatusOverlay } from '@/widgets/status-overlay'
import { OptionList, VoteBoard, type VoteOption } from '@/widgets/vote-board'
import { dayParts, formatDateTime, formatDday, formatRemaining } from '@/shared/lib'
import { DdayBadge } from '@/shared/ui/dday-badge'
import { MapLink } from '@/shared/ui/map-link'
import { PageHeader } from '@/shared/ui/page-header'
import { getVoterToken } from '@/shared/lib/voter-token'
import { Thumbnail } from '@/shared/ui/thumbnail'

export function VotePage({ params }: PageProps<'/m/[id]'>) {
  return (
    <Suspense fallback={<VoteSkeleton />}>
      <Vote params={params} />
    </Suspense>
  )
}

async function Vote({ params }: Pick<PageProps<'/m/[id]'>, 'params'>) {
  const { id } = await params
  const [meeting, token] = await Promise.all([getMeeting(id), getVoterToken()])
  if (!meeting) notFound()

  const now = new Date()
  const status = getMeetingStatus(meeting, now)
  const myVote = token ? await getMyVote(id, token) : null
  // 공개 정책은 서버에서 필터: 비공개면 득표·이름을 응답에 싣지 않음
  const visible = canSeeResults(meeting.resultVisibility, status, !!myVote)
  const result = visible ? await getTallies(id, !meeting.isAnonymous) : null
  // 아직 아무도 안 냈으면 빈 막대·0명 대신 안내 한 줄만
  const tallies = result && result.voterCount > 0 ? result.tallies : null
  // 후보 날짜는 항상 일자순 (getMeeting이 date asc로 조회)
  const max = tallies ? Math.max(1, ...meeting.options.map((o) => tallies[o.id]?.count ?? 0)) : 1
  const options: VoteOption[] = meeting.options.map((o) => ({
    id: o.id,
    ...dayParts(o.date),
    ...(tallies && {
      count: tallies[o.id]?.count ?? 0,
      voters: meeting.isAnonymous ? undefined : (tallies[o.id]?.voters ?? []),
      ratio: (tallies[o.id]?.count ?? 0) / max,
    }),
  }))
  const confirmedId =
    status === 'closed' ? resolveConfirmation(meeting.confirmedOptionId, meeting.options).optionId : null
  const confirmed = meeting.options.find((o) => o.id === confirmedId)
  const confirmedParts = confirmed && dayParts(confirmed.date)

  return (
    <>
      <PageHeader
        heading={false}
        title={
          // eslint-disable-next-line @next/next/no-img-element -- 정적 SVG 로고
          <img src="/logo.svg" alt="MOIM" width={316} height={100} className="h-4.5 w-auto" />
        }
      />
      {/* 노션 페이지 커버: 사진은 화면 폭 꽉 채움, 없으면 생략 */}
      {meeting.thumbnailId && (
        <Thumbnail
          publicId={meeting.thumbnailId}
          alt=""
          sizes="(max-width: 500px) 100vw, 500px"
          priority
          className="cover-parallax"
        />
      )}
      <main className="pb-32">
        <div className="px-5 pt-5">
          <h1 className="text-title font-semibold text-balance">{meeting.title}</h1>
          {/* 노션 속성 목록 */}
          <dl className="mt-3 flex flex-col">
            <Property icon={UserRound} label="모임장">
              {meeting.host}
            </Property>
            {meeting.location && (
              <Property icon={MapPin} label="장소">
                <MapLink location={meeting.location} naverMapUrl={meeting.naverMapUrl} kakaoMapUrl={meeting.kakaoMapUrl} />
              </Property>
            )}
            {/* 확정 안내를 닫은 뒤에도 답이 보이게 */}
            {confirmedParts && (
              <Property icon={CalendarCheck} label="확정">
                <span className="font-medium">
                  {confirmedParts.label} ({confirmedParts.weekday})
                </span>
                {confirmed && formatDday(confirmed.date, now) && (
                  <DdayBadge className="ml-2">{formatDday(confirmed.date, now)!}</DdayBadge>
                )}
              </Property>
            )}
            <Property icon={Clock} label="마감">
              {/* 조기 마감이면 실제로 닫은 시각 (closedAt은 조기 마감에서만 기록) */}
              <span className="tabular">{formatDateTime(meeting.closedAt ?? meeting.endsAt)}</span>
              {status === 'open' && <DdayBadge className="ml-2">{formatRemaining(meeting.endsAt, now)}</DdayBadge>}
            </Property>
          </dl>
          {meeting.description && (
            <p className="mt-4 border-t border-gray-200 pt-4 text-body whitespace-pre-line text-gray-800">
              {meeting.description}
            </p>
          )}
        </div>

        <section className="px-5 pt-7">
          <div className="flex items-baseline justify-between pb-2.5">
            <h2 className="text-heading font-semibold">언제 시간 되세요?</h2>
            <span className="text-caption text-gray-600">
              {meeting.allowMultiple ? '여러 날짜 선택 가능' : '한 날짜만 선택'}
            </span>
          </div>
          {status === 'open' ? (
            <VoteBoard
              meetingId={id}
              options={options}
              allowMultiple={meeting.allowMultiple}
              isAnonymous={meeting.isAnonymous}
              myVote={myVote && { optionIds: myVote.optionIds, name: myVote.name }}
            />
          ) : (
            <OptionList options={options} multiple={meeting.allowMultiple} />
          )}
          {!tallies && (
            <p className="pt-3 text-caption text-gray-600">
              {result ? '아직 아무도 투표하지 않았어요. 첫 번째로 골라 주세요.' : '결과는 나중에 공개돼요.'}
            </p>
          )}
        </section>
      </main>

      {status === 'scheduled' && (
        <StatusOverlay
          title="아직 투표 전이에요"
          highlight={`${formatDateTime(meeting.startsAt)} 시작`}
          description="시작되면 이 링크로 다시 들어와 주세요."
        />
      )}
      {status === 'closed' &&
        (confirmedParts ? (
          <StatusOverlay
            title="최종 날짜가 정해졌어요"
            highlight={`${confirmedParts.label} (${confirmedParts.weekday})`}
            badge={confirmed && formatDday(confirmed.date, now)}
            description={meeting.location ?? undefined}
            dismissible
          />
        ) : (
          <StatusOverlay title="투표가 마감됐어요" description="날짜 확정을 기다리고 있어요." />
        ))}
    </>
  )
}

function Property({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-8 items-center gap-2 py-1 text-sub">
      <dt className="flex w-[4.75rem] shrink-0 items-center gap-1.5 text-gray-600">
        <Icon className="size-3.5" strokeWidth={1.75} aria-hidden />
        {label}
      </dt>
      <dd className="flex min-w-0 flex-wrap items-center text-gray-900">{children}</dd>
    </div>
  )
}

function VoteSkeleton() {
  return (
    <div aria-busy className="animate-pulse pt-13">
      <div className="aspect-[40/21] w-full bg-gray-100" />
      <div className="mx-5 mt-6 h-7 w-2/3 rounded-md bg-gray-100" />
      <div className="mx-5 mt-5 h-20 w-1/2 rounded-md bg-gray-100" />
      <div className="mx-5 mt-10 h-40 rounded-lg bg-gray-100" />
    </div>
  )
}
