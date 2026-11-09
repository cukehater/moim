import { MapPin, UserRound } from 'lucide-react'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { canSeeResults, getMeetingStatus } from '@/entities/meeting'
import { getMeeting } from '@/entities/meeting/index.server'
import { getMyVote, getTallies } from '@/entities/vote/index.server'
import { StatusOverlay } from '@/widgets/status-overlay'
import { OptionList, VoteBoard, type VoteOption } from '@/widgets/vote-board'
import { formatDateTime, formatDay, formatRemaining } from '@/shared/lib'
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
  const options: VoteOption[] = meeting.options.map((o) => ({
    id: o.id,
    label: formatDay(o.date),
    ...(tallies && { count: tallies[o.id]?.count ?? 0, names: tallies[o.id]?.names }),
  }))
  const confirmed = meeting.options.find((o) => o.id === meeting.confirmedOptionId)

  return (
    <>
      <Thumbnail publicId={meeting.thumbnailId} alt="" sizes="(max-width: 640px) 100vw, 640px" priority />
      <main className="flex flex-col gap-6 px-4 pt-5 pb-32">
        <header className="flex flex-col gap-2">
          {status === 'open' && (
            <p className="text-sm font-semibold text-primary">{formatRemaining(meeting.endsAt, now)}</p>
          )}
          <h1 className="text-2xl leading-tight font-bold">{meeting.title}</h1>
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <UserRound className="size-4" aria-hidden />
              <span className="sr-only">모임장</span>
              {meeting.host}
            </span>
            {meeting.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-4" aria-hidden />
                <span className="sr-only">장소</span>
                {meeting.location}
              </span>
            )}
          </p>
          {meeting.description && <p className="whitespace-pre-line">{meeting.description}</p>}
        </header>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">
            언제 시간 되세요?
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {meeting.allowMultiple ? '여러 날짜를 고를 수 있어요' : '하루만 골라 주세요'}
            </span>
          </h2>
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

      {status === 'scheduled' && <StatusOverlay title={`${formatDateTime(meeting.startsAt)}에 투표가 시작돼요`} />}
      {status === 'closed' &&
        (confirmed ? (
          <StatusOverlay title={`최종 날짜 ${formatDay(confirmed.date)}`} description={meeting.location ?? undefined} />
        ) : (
          <StatusOverlay title="투표가 마감됐어요" description="날짜 확정을 기다리고 있어요." />
        ))}
    </>
  )
}

function VoteSkeleton() {
  return (
    <div aria-busy className="animate-pulse">
      <div className="aspect-video w-full bg-muted" />
      <div className="flex flex-col gap-3 px-4 pt-5">
        <div className="h-8 w-2/3 rounded bg-muted" />
        <div className="h-4 w-1/3 rounded bg-muted" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-tap rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  )
}
