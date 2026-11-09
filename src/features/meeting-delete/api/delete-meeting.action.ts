'use server'

import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { revalidateMeeting } from '@/entities/meeting/index.server'
import { requireAdmin } from '@/shared/auth'
import { db, meetings } from '@/shared/db'

export async function deleteMeeting(id: string) {
  await requireAdmin()
  // 후보일·투표·선택은 FK cascade로 함께 삭제
  await db.delete(meetings).where(eq(meetings.id, id))
  revalidateMeeting(id)
  redirect('/dashboard')
}
