import { z } from 'zod'

const DAY = /^\d{4}-\d{2}-\d{2}$/
const DATETIME_LOCAL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/

export const resultVisibilityValues = ['always', 'after_vote', 'after_close'] as const

export const datetimeLocalSchema = z.string().regex(DATETIME_LOCAL, '날짜와 시간을 입력해 주세요')

export const meetingInputSchema = z
  .object({
    title: z.string().trim().min(1, '제목을 입력해 주세요').max(80, '80자 이내로 입력해 주세요'),
    host: z.string().trim().min(1, '모임장을 입력해 주세요').max(30, '30자 이내로 입력해 주세요'),
    description: z.string().trim().max(500, '500자 이내로 입력해 주세요'),
    location: z.string().trim().max(100, '100자 이내로 입력해 주세요'),
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

export type MeetingInput = z.infer<typeof meetingInputSchema>
