import { addDays } from 'date-fns/addDays'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import type { MeetingInput } from '@/entities/meeting'
import { getMeeting } from '@/entities/meeting/index.server'
import { getTallies } from '@/entities/vote/index.server'
import { requireAdmin } from '@/shared/auth'
import { toKstInput } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/page-header'
import { MeetingFormClient } from './meeting-form-client'

export function NewMeetingPage() {
  return (
    <>
      <PageHeader title="새 모임" backHref="/dashboard" />
      <Suspense>
        <NewMeetingForm />
      </Suspense>
    </>
  )
}

async function NewMeetingForm() {
  await requireAdmin()
  const now = new Date()
  const defaults: MeetingInput = {
    title: '',
    host: '',
    description: '',
    location: '',
    thumbnailId: null,
    isAnonymous: false,
    allowMultiple: true,
    resultVisibility: 'always',
    startsAt: toKstInput(now),
    endsAt: toKstInput(addDays(now, 7)),
    dates: [],
  }
  return <MeetingFormClient meetingId={null} defaultValues={defaults} hasVotes={false} />
}

export function EditMeetingPage({ params }: PageProps<'/dashboard/[id]/edit'>) {
  return (
    <Suspense>
      <EditMeetingForm params={params} />
    </Suspense>
  )
}

async function EditMeetingForm({ params }: Pick<PageProps<'/dashboard/[id]/edit'>, 'params'>) {
  await requireAdmin()
  const { id } = await params
  const meeting = await getMeeting(id)
  if (!meeting) notFound()
  const { voterCount } = await getTallies(id, false)
  const defaults: MeetingInput = {
    title: meeting.title,
    host: meeting.host,
    description: meeting.description ?? '',
    location: meeting.location ?? '',
    thumbnailId: meeting.thumbnailId,
    isAnonymous: meeting.isAnonymous,
    allowMultiple: meeting.allowMultiple,
    resultVisibility: meeting.resultVisibility,
    startsAt: toKstInput(meeting.startsAt),
    endsAt: toKstInput(meeting.endsAt),
    dates: meeting.options.map((o) => o.date),
  }
  return (
    <>
      <PageHeader title="모임 수정" backHref={`/dashboard/${id}`} />
      <MeetingFormClient meetingId={id} defaultValues={defaults} hasVotes={voterCount > 0} />
    </>
  )
}
