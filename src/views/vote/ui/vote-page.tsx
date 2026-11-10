import { Clock, type LucideIcon, MapPin, UserRound } from 'lucide-react'
import { notFound } from 'next/navigation'
import { type ReactNode, Suspense } from 'react'
import { canSeeResults, getMeetingStatus } from '@/entities/meeting'
import { getMeeting } from '@/entities/meeting/index.server'
import { getMyVote, getTallies } from '@/entities/vote/index.server'
import { StatusOverlay } from '@/widgets/status-overlay'
import { OptionList, VoteBoard, type VoteOption } from '@/widgets/vote-board'
import { dayParts, formatDateTime, formatRemaining } from '@/shared/lib'
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
  const tallies = visible ? (await getTallies(id, !meeting.isAnonymous)).tallies : null
  // 후보 날짜는 항상 일자순 (getMeeting이 date asc로 조회)
  const max = tallies ? Math.max(1, ...meeting.options.map((o) => tallies[o.id]?.count ?? 0)) : 1
  const options: VoteOption[] = meeting.options.map((o) => ({
    id: o.id,
    ...dayParts(o.date),
    ...(tallies && {
      count: tallies[o.id]?.count ?? 0,
      names: tallies[o.id]?.names,
      ratio: (tallies[o.id]?.count ?? 0) / max,
    }),
  }))
  const confirmed = meeting.options.find((o) => o.id === meeting.confirmedOptionId)
  const confirmedParts = confirmed && dayParts(confirmed.date)

  return (
    <>
      <header className="flex h-14 items-center px-5">
        {/* eslint-disable-next-line @next/next/no-img-element -- 정적 SVG 로고 */}
        <img src="/logo.svg" alt="MOIM" width={316} height={100} className="h-5 w-auto" />
      </header>
      {/* 당근 상세처럼 사진은 화면 폭 꽉 채움, 없으면 생략 */}
      {meeting.thumbnailId && (
        <Thumbnail publicId={meeting.thumbnailId} alt="" sizes="(max-width: 500px) 100vw, 500px" priority />
      )}
      <main className="pb-32">
        <div className="px-5 pt-5">
          <h1 className="text-title font-bold text-balance">{meeting.title}</h1>
          {meeting.description && (
            <p className="mt-3 text-body leading-relaxed whitespace-pre-line text-gray-800">{meeting.description}</p>
          )}
          <dl className="mt-5 flex flex-col gap-2.5 text-sub text-gray-800">
            <InfoItem icon={UserRound} label="모임장">
              {meeting.host}
            </InfoItem>
            {meeting.location && (
              <InfoItem icon={MapPin} label="장소">
                {meeting.location}
              </InfoItem>
            )}
            <InfoItem icon={Clock} label="투표 마감">
              {formatDateTime(meeting.endsAt)}까지
              {status === 'open' && (
                <b className="ml-1.5 font-bold text-brand">{formatRemaining(meeting.endsAt, now)}</b>
              )}
            </InfoItem>
          </dl>
        </div>

        {/* 당근식 섹션 구분 띠 */}
        <div aria-hidden className="mt-6 h-2 bg-gray-100" />

        <section className="px-5 pt-6">
          <div className="flex items-baseline justify-between pb-3">
            <h2 className="text-heading font-bold">언제 시간 되세요?</h2>
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
          {!tallies && <p className="pt-3 text-caption text-gray-600">결과는 나중에 공개돼요.</p>}
        </section>
      </main>

      {status === 'scheduled' && (
        <StatusOverlay
          title={`${formatDateTime(meeting.startsAt)}에 투표가 시작돼요`}
          description="시작되면 이 링크로 다시 들어와 주세요."
        />
      )}
      {status === 'closed' &&
        (confirmedParts ? (
          <StatusOverlay
            title="최종 날짜가 정해졌어요"
            highlight={`${confirmedParts.label} ${confirmedParts.weekday}요일`}
            description={meeting.location ?? undefined}
          />
        ) : (
          <StatusOverlay title="투표가 마감됐어요" description="날짜 확정을 기다리고 있어요." />
        ))}
    </>
  )
}

function InfoItem({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <dt>
        <Icon className="mt-px size-[1.125rem] text-gray-500" strokeWidth={2} aria-hidden />
        <span className="sr-only">{label}</span>
      </dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  )
}

function VoteSkeleton() {
  return (
    <div aria-busy className="animate-pulse pt-14">
      <div className="aspect-video w-full bg-gray-100" />
      <div className="mx-5 mt-5 h-8 w-2/3 rounded-md bg-gray-100" />
      <div className="mx-5 mt-5 h-16 w-1/2 rounded-md bg-gray-100" />
      <div className="mt-6 h-2 bg-gray-100" />
      <div className="mt-14 flex flex-col gap-2 px-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 rounded-lg bg-gray-100" />
        ))}
      </div>
    </div>
  )
}
