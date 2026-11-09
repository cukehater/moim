import { CalendarPlus, Plus } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { getDisplayStatus, getMeetingStatus, type MeetingStatus } from '@/entities/meeting'
import { getMeetings } from '@/entities/meeting/index.server'
import { MeetingGallery } from '@/widgets/meeting-gallery'
import { requireAdmin } from '@/shared/auth'
import { cn } from '@/shared/lib'
import { Button } from '@/shared/ui/button'

const FILTERS: { value?: MeetingStatus; label: string }[] = [
  { label: '전체' },
  { value: 'open', label: '진행 중' },
  { value: 'scheduled', label: '예정' },
  { value: 'closed', label: '마감' },
]

export function DashboardPage({ searchParams }: PageProps<'/dashboard'>) {
  return (
    <>
      <header className="flex h-14 items-center px-5">
        <h1 className="text-heading font-black tracking-tight">MOIM</h1>
      </header>
      <main className="px-5 pb-32">
        <Suspense fallback={<p className="py-16 text-center text-sub text-gray-500">불러오는 중…</p>}>
          <DashboardContent searchParams={searchParams} />
        </Suspense>
      </main>
      <div className="bottom-bar pointer-events-none flex justify-end bg-none">
        <Button asChild size="lg" className="pointer-events-auto rounded-full pr-6 pl-5 shadow-[0_6px_20px_rgb(75_85_232/0.35)]">
          <Link href="/dashboard/new">
            <Plus aria-hidden />새 모임
          </Link>
        </Button>
      </div>
    </>
  )
}

async function DashboardContent({ searchParams }: Pick<PageProps<'/dashboard'>, 'searchParams'>) {
  await requireAdmin()
  const [{ status }, rows] = await Promise.all([searchParams, getMeetings()])
  const current = FILTERS.find((f) => f.value === status) ?? FILTERS[0]
  const now = new Date()
  const items = rows
    .filter((m) => !current.value || getMeetingStatus(m, now) === current.value)
    .map((m) => ({ meeting: m, status: getDisplayStatus(m, now), responseCount: m.responseCount }))

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <span className="mb-5 flex size-16 items-center justify-center rounded-full bg-brand-50 text-brand">
          <CalendarPlus className="size-8" strokeWidth={1.75} aria-hidden />
        </span>
        <p className="text-heading font-bold">아직 모임이 없어요</p>
        <p className="mt-1 mb-6 text-sub text-gray-600">후보 날짜를 정하고 링크를 공유해 보세요.</p>
        <Button asChild size="lg" className="px-8">
          <Link href="/dashboard/new">첫 모임 만들기</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <nav aria-label="상태 필터" className="-mx-5 mb-5 flex gap-2 overflow-x-auto px-5">
        {FILTERS.map((f) => {
          const active = f === current
          return (
            <Link
              key={f.label}
              href={f.value ? `/dashboard?status=${f.value}` : '/dashboard'}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'pressable flex h-tap shrink-0 items-center rounded-full px-4 text-sub font-semibold',
                active ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
              )}
            >
              {f.label}
            </Link>
          )
        })}
      </nav>
      {items.length ? (
        <MeetingGallery items={items} />
      ) : (
        <p className="py-20 text-center text-sub text-gray-500">{current.label} 상태인 모임이 없어요</p>
      )}
    </>
  )
}
