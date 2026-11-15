'use server'

import { and, eq } from 'drizzle-orm'
import { getMeeting, revalidateMeeting } from '@/entities/meeting/index.server'
import { requireAdmin } from '@/shared/auth'
import { db, votes } from '@/shared/db'
import type { ActionResult } from '@/shared/lib'

/** 운영자가 중복 투표를 통째로 지움 (기명 모임만). 선택은 cascade로 함께 삭제 */
export async function removeVote(meetingId: string, voteId: string): Promise<ActionResult> {
  await requireAdmin()
  const meeting = await getMeeting(meetingId)
  if (!meeting) return { ok: false, message: '모임을 찾을 수 없어요' }
  if (meeting.isAnonymous) return { ok: false, message: '익명 모임은 투표를 지울 수 없어요' }
  // 다른 모임의 투표 id가 와도 지워지지 않게 모임 id까지 맞춤
  await db.delete(votes).where(and(eq(votes.id, voteId), eq(votes.meetingId, meetingId)))
  revalidateMeeting(meetingId)
  return { ok: true, data: undefined }
}
