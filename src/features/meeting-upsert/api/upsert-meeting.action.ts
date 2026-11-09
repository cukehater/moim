'use server'

import { eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { getMeeting, revalidateMeeting } from '@/entities/meeting/index.server'
import { meetingInputSchema, type MeetingInput } from '@/entities/meeting'
import { requireAdmin } from '@/shared/auth'
import { dateOptions, db, meetings } from '@/shared/db'
import { createId, fromKstInput, type ActionResult } from '@/shared/lib'

export async function upsertMeeting(id: string | null, input: MeetingInput): Promise<ActionResult<{ id: string }>> {
  await requireAdmin()
  const parsed = meetingInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors }

  const { dates, startsAt, endsAt, description, location, ...rest } = parsed.data
  const values = {
    ...rest,
    description: description || null,
    location: location || null,
    startsAt: fromKstInput(startsAt),
    endsAt: fromKstInput(endsAt),
  }

  if (!id) {
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

  // 삭제된 후보일의 선택은 FK cascade로 함께 지워짐
  const removedIds = meeting.options.filter((o) => !dates.includes(o.date)).map((o) => o.id)
  const added = dates.filter((d) => !meeting.options.some((o) => o.date === d))

  await db.batch([
    db.update(meetings).set(values).where(eq(meetings.id, id)),
    ...(removedIds.length ? [db.delete(dateOptions).where(inArray(dateOptions.id, removedIds))] : []),
    ...(added.length
      ? [db.insert(dateOptions).values(added.map((date) => ({ id: createId(), meetingId: id, date })))]
      : []),
  ])
  revalidateMeeting(id)
  return { ok: true, data: { id } }
}
