'use server'

import { and, eq, ne } from 'drizzle-orm'
import { z } from 'zod'
import { getMeetingStatus } from '@/entities/meeting'
import { getMeeting, revalidateMeeting } from '@/entities/meeting/index.server'
import { selectionSchema, voterNameSchema } from '@/entities/vote'
import { db, voteSelections, votes } from '@/shared/db'
import { createId, type ActionResult } from '@/shared/lib'
import { ensureVoterToken } from '@/shared/lib/voter-token'

const NAME_TAKEN = '이미 사용 중인 이름이에요'

export async function submitVote(
  meetingId: string,
  input: { optionIds: string[]; name?: string },
): Promise<ActionResult> {
  const meeting = await getMeeting(meetingId)
  if (!meeting) return { ok: false, message: '모임을 찾을 수 없어요' }
  if (getMeetingStatus(meeting, new Date()) !== 'open') {
    revalidateMeeting(meetingId)
    return { ok: false, message: '투표가 마감됐어요' }
  }

  const selection = selectionSchema(meeting.allowMultiple).safeParse(input.optionIds)
  if (!selection.success) return { ok: false, message: selection.error.issues[0].message }
  const optionIds = selection.data
  if (!optionIds.every((id) => meeting.options.some((o) => o.id === id))) {
    return { ok: false, message: '후보 날짜가 아니에요' }
  }

  let name: string | undefined
  if (!meeting.isAnonymous) {
    const parsed = voterNameSchema.safeParse(input.name ?? '')
    if (!parsed.success) return { ok: false, fieldErrors: { name: z.flattenError(parsed.error).formErrors } }
    name = parsed.data
  }

  const token = await ensureVoterToken()
  if (name) {
    const [taken] = await db
      .select({ id: votes.id })
      .from(votes)
      .where(and(eq(votes.meetingId, meetingId), eq(votes.name, name), ne(votes.voterToken, token)))
    if (taken) return { ok: false, fieldErrors: { name: [NAME_TAKEN] } }
  }

  const [existing] = await db
    .select({ id: votes.id })
    .from(votes)
    .where(and(eq(votes.meetingId, meetingId), eq(votes.voterToken, token)))
  const voteId = existing?.id ?? createId()

  try {
    // neon-http는 대화형 트랜잭션이 없어 batch(단일 트랜잭션)로 upsert → 선택 전량 교체
    await db.batch([
      db
        .insert(votes)
        .values({ id: voteId, meetingId, voterToken: token, name })
        // 익명 모임에서는 기존 이름을 보존 (name 미변경)
        .onConflictDoUpdate({
          target: [votes.meetingId, votes.voterToken],
          set: name ? { name, updatedAt: new Date() } : { updatedAt: new Date() },
        }),
      db.delete(voteSelections).where(eq(voteSelections.voteId, voteId)),
      db.insert(voteSelections).values(optionIds.map((optionId) => ({ voteId, optionId }))),
    ])
  } catch (e) {
    // 동시 제출로 이름 중복 검사를 통과한 경우
    if (String((e as { cause?: unknown }).cause ?? e).includes('votes_meeting_id_name_unique')) {
      return { ok: false, fieldErrors: { name: [NAME_TAKEN] } }
    }
    throw e
  }

  revalidateMeeting(meetingId)
  return { ok: true, data: undefined }
}
