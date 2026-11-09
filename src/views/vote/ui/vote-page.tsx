import { MapPin, UserRound } from 'lucide-react'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
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
  const options: VoteOption[] = meeting.options.map((o) => ({
    id: o.id,
    ...dayParts(o.date),
    ...(tallies && { count: tallies[o.id]?.count ?? 0, names: tallies[o.id]?.names }),
  }))
  const confirmed = meeting.options.find((o) => o.id === meeting.confirmedOptionId)
  const confirmedParts = confirmed && dayParts(confirmed.date)

  return (
    <>
      <Thumbnail publicId={meeting.thumbnailId} alt="" sizes="(max-width: 500px) 100vw, 500px" priority />
      <main className="pb-36">
        <header className="flex flex-col gap-2 px-5 pt-5 pb-6">
          {status === 'open' && (
            <p className="text-sub font-semibold text-positive">{formatRemaining(meeting.endsAt, now)}</p>
          )}
          <h1 className="text-title font-bold text-balance">{meeting.title}</h1>
          <p className="flex flex-wrap gap-x-3 gap-y-1 text-sub text-gray-600">
            <span className="flex items-center gap-1">
              <UserRound className="size-4 text-gray-400" aria-hidden />
              <span className="sr-only">모임장</span>
              {meeting.host}
            </span>
            {meeting.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-4 text-gray-400" aria-hidden />
                <span className="sr-only">장소</span>
                {meeting.location}
              </span>
            )}
          </p>
          {meeting.description && (
            <p className="mt-2 text-body whitespace-pre-line text-gray-700">{meeting.description}</p>
          )}
        </header>

        <div className="h-3 bg-gray-100" />

        <section className="flex flex-col gap-4 px-5 pt-6">
          <div>
            <h2 className="text-heading font-bold">언제 시간 되세요?</h2>
            <p className="text-sub text-gray-500">
              {meeting.allowMultiple ? '되는 날짜를 모두 골라 주세요' : '하루만 골라 주세요'}
            </p>
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
        </section>
      </main>

      {status === 'scheduled' && (
        <StatusOverlay
          kind="scheduled"
          title={`${formatDateTime(meeting.startsAt)}에 투표가 시작돼요`}
          description="시작되면 이 링크로 다시 들어와 주세요."
        />
      )}
      {status === 'closed' &&
        (confirmedParts ? (
          <StatusOverlay
            kind="confirmed"
            title="최종 날짜가 정해졌어요"
            highlight={`${confirmedParts.label} ${confirmedParts.weekday}요일`}
            description={meeting.location ?? undefined}
          />
        ) : (
          <StatusOverlay kind="closed" title="투표가 마감됐어요" description="날짜 확정을 기다리고 있어요." />
        ))}
    </>
  )
}

function VoteSkeleton() {
  return (
    <div aria-busy className="animate-pulse">
      <div className="aspect-video w-full bg-gray-100" />
      <div className="flex flex-col gap-3 px-5 pt-5">
        <div className="h-8 w-2/3 rounded-lg bg-gray-100" />
        <div className="h-5 w-1/3 rounded-lg bg-gray-100" />
      </div>
      <div className="mt-6 h-3 bg-gray-100" />
      <div className="flex flex-col gap-2 px-5 pt-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-gray-100" />
        ))}
      </div>
    </div>
  )
}
