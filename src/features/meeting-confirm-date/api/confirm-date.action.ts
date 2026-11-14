'use server'

import { eq } from 'drizzle-orm'
import { getMeetingStatus, resolveConfirmation } from '@/entities/meeting'
import { getMeeting, revalidateMeeting } from '@/entities/meeting/index.server'
import { requireAdmin } from '@/shared/auth'
import { db, meetings } from '@/shared/db'
import type { ActionResult } from '@/shared/lib'

/** 동점일 때만 운영자가 동점 날짜 중에서 확정. optionId=null이면 확정 취소 */
export async function confirmDate(id: string, optionId: string | null): Promise<ActionResult> {
  await requireAdmin()
  const meeting = await getMeeting(id)
  if (!meeting) return { ok: false, message: '모임을 찾을 수 없어요' }
  if (getMeetingStatus(meeting, new Date()) !== 'closed') {
    return { ok: false, message: '마감된 모임만 날짜를 확정할 수 있어요' }
  }
  const { tied } = resolveConfirmation(meeting.confirmedOptionId, meeting.options)
  if (tied.length === 0) return { ok: false, message: '최다 득표 날짜로 자동 확정돼서 바꿀 수 없어요' }
  if (optionId && !tied.includes(optionId)) return { ok: false, message: '동점인 날짜 중에서 골라 주세요' }
  await db.update(meetings).set({ confirmedOptionId: optionId }).where(eq(meetings.id, id))
  revalidateMeeting(id)
  return { ok: true, data: undefined }
}
