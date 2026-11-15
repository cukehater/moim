'use server'

import { and, eq, isNull } from 'drizzle-orm'
import { getMeeting, revalidateMeeting } from '@/entities/meeting/index.server'
import { datetimeLocalSchema, getMeetingStatus } from '@/entities/meeting'
import { requireAdmin } from '@/shared/auth'
import { db, meetings } from '@/shared/db'
import { fromKstInput, type ActionResult } from '@/shared/lib'

export async function closeMeeting(id: string): Promise<ActionResult> {
  await requireAdmin()
  const meeting = await getMeeting(id)
  if (!meeting) return { ok: false, message: '모임을 찾을 수 없어요' }
  const status = getMeetingStatus(meeting, new Date())
  if (status === 'scheduled') return { ok: false, message: '시작 전에는 마감할 수 없어요' }
  if (status === 'closed') {
    revalidateMeeting(id)
    return { ok: false, message: '이미 마감됐어요' }
  }
  // 두 탭에서 동시에 눌러도 처음 마감 시각을 덮어쓰지 않게
  await db.update(meetings).set({ closedAt: new Date() }).where(and(eq(meetings.id, id), isNull(meetings.closedAt)))
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
    if (endsAt <= now) return { ok: false, fieldErrors: { endsAt: ['지금 이후로 입력해 주세요'] } }
    if (endsAt <= meeting.startsAt) return { ok: false, fieldErrors: { endsAt: ['시작 시각 이후로 입력해 주세요'] } }
  }

  // 다시 마감되면 그때 득표로 재계산
  await db.update(meetings).set({ closedAt: null, endsAt, confirmedOptionId: null }).where(eq(meetings.id, id))
  revalidateMeeting(id)
  return { ok: true, data: undefined }
}
