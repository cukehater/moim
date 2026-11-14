import { CalendarPlus, Plus } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { getDisplayStatus, getMeetingStatus, resolveConfirmation, type MeetingStatus } from '@/entities/meeting'
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
        <h1>
          {/* eslint-disable-next-line @next/next/no-img-element -- 정적 SVG 로고 */}
          <img src="/logo.svg" alt="MOIM" width={316} height={100} className="h-6 w-auto" />
        </h1>
      </header>
      <main className="pb-32">
        <Suspense fallback={<p className="py-16 text-center text-sub text-gray-600">불러오는 중…</p>}>
          <DashboardContent searchParams={searchParams} />
        </Suspense>
      </main>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-[500px] justify-end p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <Button asChild size="lg" className="pointer-events-auto rounded-full pr-5 pl-4 shadow-[0_4px_14px_rgb(0_0_0/0.18)]">
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
    .map((m) => {
      const status = getDisplayStatus(m, now, m.options)
      const confirmedId = resolveConfirmation(m.confirmedOptionId, m.options).optionId
      return {
        meeting: m,
        status,
        responseCount: m.responseCount,
        confirmedDate: status === 'confirmed' ? m.options.find((o) => o.id === confirmedId)?.date : null,
      }
    })

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center px-5 py-24 text-center">
        <CalendarPlus className="mb-4 size-12 text-gray-400" strokeWidth={1.5} aria-hidden />
        <p className="text-heading font-semibold">아직 모임이 없어요</p>
        <p className="mt-1 mb-6 text-sub text-gray-500">후보 날짜를 정하고 링크를 공유해 보세요.</p>
        <Button asChild size="lg" className="px-8">
          <Link href="/dashboard/new">첫 모임 만들기</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <nav aria-label="상태 필터" className="flex gap-5 overflow-x-auto border-b border-gray-200 px-5">
        {FILTERS.map((f) => {
          const active = f === current
          return (
            <Link
              key={f.label}
              href={f.value ? `/dashboard?status=${f.value}` : '/dashboard'}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex h-tap shrink-0 items-center text-sub font-bold',
                active ? 'text-gray-900 shadow-[inset_0_-3px_0_var(--color-gray-900)]' : 'text-gray-600',
              )}
            >
              {f.label}
            </Link>
          )
        })}
      </nav>
      {items.length ? (
        <div className="px-5 pt-1">
          <MeetingGallery items={items} />
        </div>
      ) : (
        <p className="px-5 py-20 text-center text-sub text-gray-600">{current.label} 상태인 모임이 없어요</p>
      )}
    </>
  )
}
