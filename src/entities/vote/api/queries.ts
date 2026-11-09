import 'server-only'
import { and, asc, eq } from 'drizzle-orm'
import { db, voteSelections, votes } from '@/shared/db'

export type Tally = { count: number; names: string[] }

/** 옵션별 득표. withNames=false면 이름은 응답에서 제외 */
export async function getTallies(meetingId: string, withNames: boolean) {
  const rows = await db
    .select({ voteId: votes.id, optionId: voteSelections.optionId, name: votes.name })
    .from(voteSelections)
    .innerJoin(votes, eq(votes.id, voteSelections.voteId))
    .where(eq(votes.meetingId, meetingId))
    .orderBy(asc(votes.createdAt))

  const tallies: Record<string, Tally> = {}
  const voters = new Set<string>()
  for (const { voteId, optionId, name } of rows) {
    voters.add(voteId)
    const t = (tallies[optionId] ??= { count: 0, names: [] })
    t.count++
    if (withNames) t.names.push(name ?? '(이름 없음)')
  }
  return { tallies, voterCount: voters.size }
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
