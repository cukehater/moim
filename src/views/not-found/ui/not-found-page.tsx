import { CalendarX } from 'lucide-react'

export function NotFoundPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <CalendarX className="mb-4 size-12 text-gray-400" strokeWidth={1.5} aria-hidden />
      <h1 className="text-heading font-semibold">모임을 찾을 수 없어요</h1>
      <p className="mt-1 text-sub text-gray-500">링크가 잘못됐거나 삭제된 모임이에요.</p>
    </main>
  )
}
