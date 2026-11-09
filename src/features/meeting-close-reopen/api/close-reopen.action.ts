'use server'

import { eq } from 'drizzle-orm'
import { getMeeting, revalidateMeeting } from '@/entities/meeting/index.server'
import { datetimeLocalSchema } from '@/entities/meeting'
import { requireAdmin } from '@/shared/auth'
import { db, meetings } from '@/shared/db'
import { fromKstInput, type ActionResult } from '@/shared/lib'

export async function closeMeeting(id: string): Promise<ActionResult> {
  await requireAdmin()
  await db.update(meetings).set({ closedAt: new Date() }).where(eq(meetings.id, id))
  revalidateMeeting(id)
  return { ok: true, data: undefined }
}

/** endsAt이 이미 지났으면 새 종료 시각(newEndsAt, KST datetime-local)이 필요 */
export async function reopenMeeting(id: string, newEndsAt?: string): Promise<ActionResult> {
  await requireAdmin()
  const meeting = await getMeeting(id)
  if (!meeting) return { ok: false, message: '모임을 찾을 수 없어요' }

  const now = new Date()
  let endsAt = meeting.endsAt
  if (endsAt <= now) {
    const parsed = datetimeLocalSchema.safeParse(newEndsAt)
    if (!parsed.success) return { ok: false, fieldErrors: { endsAt: ['새 종료 시각을 입력해 주세요'] } }
    endsAt = fromKstInput(parsed.data)
    if (endsAt <= now || endsAt <= meeting.startsAt) {
      return { ok: false, fieldErrors: { endsAt: ['지금 이후로 입력해 주세요'] } }
    }
  }

  await db.update(meetings).set({ closedAt: null, endsAt }).where(eq(meetings.id, id))
  revalidateMeeting(id)
  return { ok: true, data: undefined }
}
