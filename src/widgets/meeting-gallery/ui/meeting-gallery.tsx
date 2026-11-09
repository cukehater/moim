import { type DisplayStatus, MeetingCard } from '@/entities/meeting'
import type { Meeting } from '@/entities/meeting/index.server'

type Item = { meeting: Meeting; status: DisplayStatus; responseCount: number }

export function MeetingGallery({ items }: { items: Item[] }) {
  return (
    <ul className="grid grid-cols-1 gap-x-3 gap-y-6 @min-[30rem]/shell:grid-cols-2">
      {items.map(({ meeting, status, responseCount }) => (
        <li key={meeting.id}>
          <MeetingCard meeting={meeting} status={status} responseCount={responseCount} />
        </li>
      ))}
    </ul>
  )
}
