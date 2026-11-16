import { z } from 'zod'

const DAY = /^\d{4}-\d{2}-\d{2}$/
const DATETIME_LOCAL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/

export const resultVisibilityValues = ['always', 'after_vote', 'after_close'] as const

// 공유 링크(naver.me, kko.to)와 지도 페이지(map.naver.com, place.map.kakao.com 등)만 허용
function isMapUrl(v: string, shortHost: string, domain: string) {
  try {
    const { protocol, hostname } = new URL(v)
    return protocol === 'https:' && (hostname === shortHost || hostname.endsWith(`.${domain}`))
  } catch {
    return false
  }
}

const mapUrlSchema = (shortHost: string, domain: string, message: string) =>
  z
    .string()
    .trim()
    .max(300, '300자 이내로 입력해 주세요')
    .refine((v) => !v || isMapUrl(v, shortHost, domain), message)

export const datetimeLocalSchema = z.string().regex(DATETIME_LOCAL, '날짜와 시간을 입력해 주세요')

export const meetingInputSchema = z
  .object({
    title: z.string().trim().min(1, '제목을 입력해 주세요').max(80, '80자 이내로 입력해 주세요'),
    host: z.string().trim().min(1, '모임장을 입력해 주세요').max(30, '30자 이내로 입력해 주세요'),
    description: z.string().trim().max(500, '500자 이내로 입력해 주세요'),
    location: z.string().trim().max(100, '100자 이내로 입력해 주세요'),
    naverMapUrl: mapUrlSchema('naver.me', 'naver.com', '네이버 지도 링크를 붙여 넣어 주세요'),
    kakaoMapUrl: mapUrlSchema('kko.to', 'kakao.com', '카카오맵 링크를 붙여 넣어 주세요'),
    thumbnailId: z.string().min(1).nullable(),
    isAnonymous: z.boolean(),
    allowMultiple: z.boolean(),
    resultVisibility: z.enum(resultVisibilityValues),
    startsAt: datetimeLocalSchema,
    endsAt: datetimeLocalSchema,
    dates: z
      .array(z.string().regex(DAY))
      .min(1, '후보 날짜를 1개 이상 골라 주세요')
      .refine((d) => new Set(d).size === d.length, '같은 날짜가 중복됐어요'),
  })
  // 같은 'yyyy-MM-ddTHH:mm' 포맷이라 문자열 비교로 충분
  .refine((v) => v.endsAt > v.startsAt, { path: ['endsAt'], message: '종료는 시작 이후여야 해요' })
  // 지도 링크는 둘 다 넣거나 둘 다 비우기: 방문자가 어느 앱을 골라도 같은 장소로 가게
  .refine((v) => !v.naverMapUrl || v.kakaoMapUrl, { path: ['kakaoMapUrl'], message: '카카오맵 링크도 입력해 주세요' })
  .refine((v) => !v.kakaoMapUrl || v.naverMapUrl, { path: ['naverMapUrl'], message: '네이버 지도 링크도 입력해 주세요' })
  .refine((v) => !v.naverMapUrl || v.location, { path: ['location'], message: '지도 링크를 넣으면 장소명도 입력해 주세요' })

export type MeetingInput = z.infer<typeof meetingInputSchema>
