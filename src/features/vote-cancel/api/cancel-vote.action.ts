'use server'

import { and, eq } from 'drizzle-orm'
import { getMeetingStatus } from '@/entities/meeting'
import { getMeeting, revalidateMeeting } from '@/entities/meeting/index.server'
import { db, votes } from '@/shared/db'
import type { ActionResult } from '@/shared/lib'
import { getVoterToken } from '@/shared/lib/voter-token'

export async function cancelVote(meetingId: string): Promise<ActionResult> {
  const meeting = await getMeeting(meetingId)
  if (!meeting) return { ok: false, message: '모임을 찾을 수 없어요' }
  if (getMeetingStatus(meeting, new Date()) !== 'open') {
    revalidateMeeting(meetingId)
    return { ok: false, message: '투표가 마감됐어요' }
  }
  const token = await getVoterToken()
  if (token) {
    await db.delete(votes).where(and(eq(votes.meetingId, meetingId), eq(votes.voterToken, token)))
  }
  revalidateMeeting(meetingId)
  return { ok: true, data: undefined }
}
