import 'server-only'
import { and, asc, eq } from 'drizzle-orm'
import { db, voteSelections, votes } from '@/shared/db'
import type { Voter } from '../model'

export type Tally = { count: number; voters: Voter[] }

/** 옵션별 득표. withNames=false면 이름은 응답에서 제외 */
export async function getTallies(meetingId: string, withNames: boolean) {
  const rows = await db
    .select({ voteId: votes.id, optionId: voteSelections.optionId, name: votes.name })
    .from(voteSelections)
    .innerJoin(votes, eq(votes.id, voteSelections.voteId))
    .where(eq(votes.meetingId, meetingId))
    .orderBy(asc(votes.createdAt))

  const tallies: Record<string, Tally> = {}
  const order = new Map<string, number>()
  for (const { voteId, optionId, name } of rows) {
    if (!order.has(voteId)) order.set(voteId, order.size)
    const t = (tallies[optionId] ??= { count: 0, voters: [] })
    t.count++
    if (withNames) t.voters.push({ name: name ?? '(이름 없음)', order: order.get(voteId)! })
  }
  return { tallies, voterCount: order.size }
}

export async function getMyVote(meetingId: string, voterToken: string) {
  const rows = await db
    .select({ name: votes.name, optionId: voteSelections.optionId })
    .from(votes)
    .leftJoin(voteSelections, eq(voteSelections.voteId, votes.id))
    .where(and(eq(votes.meetingId, meetingId), eq(votes.voterToken, voterToken)))
  if (rows.length === 0) return null
  return { name: rows[0].name, optionIds: rows.flatMap((r) => (r.optionId ? [r.optionId] : [])) }
}

export type MyVote = NonNullable<Awaited<ReturnType<typeof getMyVote>>>

/** 운영자 전용: 투표자별 투표 (id·이름·순번·시각·고른 옵션). 투표 id가 들어 있으니 투표 페이지엔 쓰지 않음 */
export async function getVoteRecords(meetingId: string) {
  const rows = await db
    .select({ id: votes.id, name: votes.name, createdAt: votes.createdAt, optionId: voteSelections.optionId })
    .from(votes)
    .leftJoin(voteSelections, eq(voteSelections.voteId, votes.id))
    .where(eq(votes.meetingId, meetingId))
    .orderBy(asc(votes.createdAt))

  const records = new Map<string, VoteRecord>()
  for (const { id, name, createdAt, optionId } of rows) {
    const r =
      records.get(id) ??
      records.set(id, { id, name: name ?? '(이름 없음)', order: records.size, createdAt, optionIds: [] }).get(id)!
    if (optionId) r.optionIds.push(optionId)
  }
  return [...records.values()]
}

export type VoteRecord = { id: string; name: string; order: number; createdAt: Date; optionIds: string[] }
