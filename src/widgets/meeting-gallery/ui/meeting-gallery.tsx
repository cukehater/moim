import { type DisplayStatus, MeetingCard } from '@/entities/meeting'
import type { Meeting } from '@/entities/meeting/index.server'

type Item = { meeting: Meeting; status: DisplayStatus; responseCount: number; confirmedDate?: string | null }

export function MeetingGallery({ items }: { items: Item[] }) {
  return (
    <ul className="divide-y divide-gray-200 border-b border-gray-200">
      {items.map(({ meeting, status, responseCount, confirmedDate }) => (
        <li key={meeting.id}>
          <MeetingCard meeting={meeting} status={status} responseCount={responseCount} confirmedDate={confirmedDate} />
        </li>
      ))}
    </ul>
  )
}
