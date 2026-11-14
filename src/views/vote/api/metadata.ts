import type { Metadata } from 'next'
import { getMeetingStatus, resolveConfirmation } from '@/entities/meeting'
import { getMeeting } from '@/entities/meeting/index.server'
import { formatDateTime, formatDay } from '@/shared/lib'
import { cldUrl, OG_RATIO } from '@/shared/ui/thumbnail'

/** 링크 공유 미리보기: 모임 제목 + 모임장·장소·마감(확정 후엔 확정일) + 썸네일 */
export async function generateVoteMetadata({ params }: PageProps<'/m/[id]'>): Promise<Metadata> {
  const { id } = await params
  const meeting = await getMeeting(id)
  if (!meeting) return {}

  const closed = getMeetingStatus(meeting, new Date()) === 'closed'
  const confirmedId = closed ? resolveConfirmation(meeting.confirmedOptionId, meeting.options).optionId : null
  const confirmed = meeting.options.find((o) => o.id === confirmedId)
  const description = [
    `${meeting.host}님의 모임`,
    meeting.location,
    confirmed
      ? `${formatDay(confirmed.date)}로 확정됐어요`
      : closed
        ? '투표가 마감됐어요'
        : `${formatDateTime(meeting.endsAt)} 마감`,
  ]
    .filter(Boolean)
    .join(' · ')
  // openGraph를 덮어쓰면 app/opengraph-image.png 자동 등록도 빠지므로 기본 이미지를 직접 지정
  const images = [
    meeting.thumbnailId
      ? { url: cldUrl(meeting.thumbnailId, 1200, OG_RATIO), width: 1200, height: 630, alt: meeting.title }
      : { url: '/opengraph-image.png', width: 1200, height: 630, alt: 'MOIM — 참석 여부, 한 번에 모아요' },
  ]

  return {
    title: meeting.title,
    description,
    // openGraph·twitter는 레이아웃 값과 얕게 병합되지 않고 통째로 교체됨
    openGraph: { title: meeting.title, description, siteName: 'MOIM', locale: 'ko_KR', type: 'website', images },
    twitter: { card: 'summary_large_image', title: meeting.title, description, images },
  }
}
