'use server'

import { and, count, eq, inArray, notExists } from 'drizzle-orm'
import { z } from 'zod'
import { getMeeting, revalidateMeeting } from '@/entities/meeting/index.server'
import { getMeetingStatus, meetingInputSchema, periodErrors, type MeetingInput } from '@/entities/meeting'
import { requireAdmin } from '@/shared/auth'
import { dateOptions, db, meetings, voteSelections, votes } from '@/shared/db'
import { createId, fromKstInput, type ActionResult } from '@/shared/lib'

export async function upsertMeeting(id: string | null, input: MeetingInput): Promise<ActionResult<{ id: string }>> {
  await requireAdmin()
  const parsed = meetingInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors }

  const { dates, startsAt, endsAt, description, location, mapUrl, ...rest } = parsed.data
  const values = {
    ...rest,
    description: description || null,
    location: location || null,
    mapUrl: mapUrl || null,
    startsAt: fromKstInput(startsAt),
    endsAt: fromKstInput(endsAt),
  }

  // 상태는 조기 마감·투표 재개로만 바뀌게: 기간 변경이 상태를 바꾸면 거부 (편집 화면을 연 사이 바뀐 상태도 지금 기준으로)
  const period = (current: Parameters<typeof periodErrors>[0]) => {
    const errors = periodErrors(current, { startsAt, endsAt }, new Date())
    return Object.keys(errors).length
      ? { ok: false as const, fieldErrors: Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, [v]])) }
      : null
  }

  if (!id) {
    const rejected = period(null)
    if (rejected) return rejected
    const newId = createId(10)
    await db.batch([
      db.insert(meetings).values({ id: newId, ...values }),
      db.insert(dateOptions).values(dates.map((date) => ({ id: createId(), meetingId: newId, date }))),
    ])
    revalidateMeeting(newId)
    return { ok: true, data: { id: newId } }
  }

  const meeting = await getMeeting(id)
  if (!meeting) return { ok: false, message: '모임을 찾을 수 없어요' }
  const rejected = period(meeting)
  if (rejected) return rejected

  // 익명이라 믿고 낸 투표가 있으면 기명 전환 금지
  if (meeting.isAnonymous && !values.isAnonymous) {
    const [{ n }] = await db.select({ n: count() }).from(votes).where(eq(votes.meetingId, id))
    if (n > 0) return { ok: false, fieldErrors: { isAnonymous: ['익명으로 투표가 들어온 뒤에는 기명으로 바꿀 수 없어요'] } }
  }

  // 투표가 있으면 복수 → 단일 전환 금지: 여러 날짜를 고른 표가 단일 모임에 남지 않게
  if (meeting.allowMultiple && !values.allowMultiple) {
    const [{ n }] = await db.select({ n: count() }).from(votes).where(eq(votes.meetingId, id))
    if (n > 0) return { ok: false, fieldErrors: { allowMultiple: ['투표가 들어와서 한 날짜만으로 바꿀 수 없어요.'] } }
  }

  // 마감된 모임은 후보 날짜 변경 금지: 확정 날짜가 경고 없이 바뀌지 않게 (기간과 같은 규칙)
  const sameDates =
    dates.length === meeting.options.length && meeting.options.every((o) => dates.includes(o.date))
  if (!sameDates && getMeetingStatus(meeting, new Date()) === 'closed') {
    return { ok: false, fieldErrors: { dates: ['마감된 모임은 후보 날짜를 바꿀 수 없어요. 투표 재개를 이용해 주세요'] } }
  }

  // 삭제된 후보일의 선택은 FK cascade로 함께 지워짐
  const removedIds = meeting.options.filter((o) => !dates.includes(o.date)).map((o) => o.id)
  const added = dates.filter((d) => !meeting.options.some((o) => o.date === d))

  await db.batch([
    db.update(meetings).set(values).where(eq(meetings.id, id)),
    ...(removedIds.length ? [db.delete(dateOptions).where(inArray(dateOptions.id, removedIds))] : []),
    ...(added.length
      ? [db.insert(dateOptions).values(added.map((date) => ({ id: createId(), meetingId: id, date })))]
      : []),
    // 고른 날짜가 모두 지워진 투표는 함께 삭제: 응답 수·이름 중복·결과 공개(투표 후)가 빈 투표에 묶이지 않게
    ...(removedIds.length
      ? [
          db
            .delete(votes)
            .where(
              and(
                eq(votes.meetingId, id),
                notExists(db.select().from(voteSelections).where(eq(voteSelections.voteId, votes.id))),
              ),
            ),
        ]
      : []),
  ])
  revalidateMeeting(id)
  return { ok: true, data: { id } }
}
