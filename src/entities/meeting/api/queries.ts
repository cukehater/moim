import 'server-only'
import { asc, count, desc, eq, getTableColumns, type SQL } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { cache } from 'react'
import { dateOptions, db, meetings, voteSelections, votes } from '@/shared/db'

export type Meeting = typeof meetings.$inferSelect
export type DateOption = typeof dateOptions.$inferSelect

/** 후보 날짜 + 득표 수 (확정 날짜 계산용) */
const optionsWithCount = (where?: SQL) =>
  db
    .select({ ...getTableColumns(dateOptions), count: count(voteSelections.voteId) })
    .from(dateOptions)
    .leftJoin(voteSelections, eq(voteSelections.optionId, dateOptions.id))
    .where(where)
    .groupBy(dateOptions.id)
    .orderBy(asc(dateOptions.date))

export async function getMeetings() {
  const [rows, options] = await Promise.all([
    db
      .select({ ...getTableColumns(meetings), responseCount: count(votes.id) })
      .from(meetings)
      .leftJoin(votes, eq(votes.meetingId, meetings.id))
      .groupBy(meetings.id)
      .orderBy(desc(meetings.createdAt)),
    optionsWithCount(),
  ])
  return rows.map((m) => ({ ...m, options: options.filter((o) => o.meetingId === m.id) }))
}

export const getMeeting = cache(async (id: string) => {
  const [[meeting], options] = await Promise.all([
    db.select().from(meetings).where(eq(meetings.id, id)),
    optionsWithCount(eq(dateOptions.meetingId, id)),
  ])
  return meeting ? { ...meeting, options } : null
})

export function revalidateMeeting(id: string) {
  revalidatePath('/dashboard')
  revalidatePath(`/dashboard/${id}`)
  revalidatePath(`/m/${id}`)
}
