import 'server-only'
import { asc, count, desc, eq, getTableColumns } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { cache } from 'react'
import { dateOptions, db, meetings, votes } from '@/shared/db'

export type Meeting = typeof meetings.$inferSelect
export type DateOption = typeof dateOptions.$inferSelect

export async function getMeetings() {
  return db
    .select({ ...getTableColumns(meetings), responseCount: count(votes.id), confirmedDate: dateOptions.date })
    .from(meetings)
    .leftJoin(votes, eq(votes.meetingId, meetings.id))
    .leftJoin(dateOptions, eq(dateOptions.id, meetings.confirmedOptionId))
    .groupBy(meetings.id, dateOptions.date)
    .orderBy(desc(meetings.createdAt))
}

export const getMeeting = cache(async (id: string) => {
  const [[meeting], options] = await Promise.all([
    db.select().from(meetings).where(eq(meetings.id, id)),
    db.select().from(dateOptions).where(eq(dateOptions.meetingId, id)).orderBy(asc(dateOptions.date)),
  ])
  return meeting ? { ...meeting, options } : null
})

export function revalidateMeeting(id: string) {
  revalidatePath('/dashboard')
  revalidatePath(`/dashboard/${id}`)
  revalidatePath(`/m/${id}`)
}
