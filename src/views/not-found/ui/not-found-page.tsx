import { CalendarX } from 'lucide-react'

export function NotFoundPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <span className="mb-5 flex size-16 items-center justify-center rounded-full bg-gray-100 text-gray-500">
        <CalendarX className="size-8" strokeWidth={1.75} aria-hidden />
      </span>
      <h1 className="text-heading font-bold">모임을 찾을 수 없어요</h1>
      <p className="mt-1 text-sub text-gray-600">링크가 잘못됐거나 삭제된 모임이에요.</p>
    </main>
  )
}
