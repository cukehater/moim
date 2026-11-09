'use server'

import { eq } from 'drizzle-orm'
import { getMeetingStatus } from '@/entities/meeting'
import { getMeeting, revalidateMeeting } from '@/entities/meeting/index.server'
import { requireAdmin } from '@/shared/auth'
import { db, meetings } from '@/shared/db'
import type { ActionResult } from '@/shared/lib'

/** optionId=null이면 확정 취소 */
export async function confirmDate(id: string, optionId: string | null): Promise<ActionResult> {
  await requireAdmin()
  const meeting = await getMeeting(id)
  if (!meeting) return { ok: false, message: '모임을 찾을 수 없어요' }
  if (getMeetingStatus(meeting, new Date()) !== 'closed') {
    return { ok: false, message: '마감된 모임만 날짜를 확정할 수 있어요' }
  }
  if (optionId && !meeting.options.some((o) => o.id === optionId)) {
    return { ok: false, message: '후보 날짜가 아니에요' }
  }
  await db.update(meetings).set({ confirmedOptionId: optionId }).where(eq(meetings.id, id))
  revalidateMeeting(id)
  return { ok: true, data: undefined }
}
