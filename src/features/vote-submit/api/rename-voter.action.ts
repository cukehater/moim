'use server'

import { and, eq, ne } from 'drizzle-orm'
import { z } from 'zod'
import { getMeetingStatus } from '@/entities/meeting'
import { getMeeting, revalidateMeeting } from '@/entities/meeting/index.server'
import { voterNameSchema } from '@/entities/vote'
import { db, votes } from '@/shared/db'
import type { ActionResult } from '@/shared/lib'
import { getVoterToken } from '@/shared/lib/voter-token'

const NAME_TAKEN = '이미 사용 중인 이름이에요'

/** 이미 투표한 사람의 이름만 변경. 이름은 투표 행에 하나라 모든 날짜에 함께 반영 */
export async function renameVoter(meetingId: string, input: string): Promise<ActionResult> {
  const meeting = await getMeeting(meetingId)
  if (!meeting) return { ok: false, message: '모임을 찾을 수 없어요' }
  if (meeting.isAnonymous) return { ok: false, message: '익명 투표예요' }
  if (getMeetingStatus(meeting, new Date()) !== 'open') {
    revalidateMeeting(meetingId)
    return { ok: false, message: '투표가 마감됐어요' }
  }

  const parsed = voterNameSchema.safeParse(input)
  if (!parsed.success) return { ok: false, fieldErrors: { name: z.flattenError(parsed.error).formErrors } }
  const name = parsed.data

  const token = await getVoterToken()
  if (!token) return { ok: false, message: '투표한 기록이 없어요' }
  const [taken] = await db
    .select({ id: votes.id })
    .from(votes)
    .where(and(eq(votes.meetingId, meetingId), eq(votes.name, name), ne(votes.voterToken, token)))
  if (taken) return { ok: false, fieldErrors: { name: [NAME_TAKEN] } }

  try {
    const updated = await db
      .update(votes)
      .set({ name })
      .where(and(eq(votes.meetingId, meetingId), eq(votes.voterToken, token)))
      .returning({ id: votes.id })
    if (updated.length === 0) return { ok: false, message: '투표한 기록이 없어요' }
  } catch (e) {
    // 동시 변경으로 이름 중복 검사를 통과한 경우
    if (String((e as { cause?: unknown }).cause ?? e).includes('votes_meeting_id_name_unique')) {
      return { ok: false, fieldErrors: { name: [NAME_TAKEN] } }
    }
    throw e
  }

  revalidateMeeting(meetingId)
  return { ok: true, data: undefined }
}
