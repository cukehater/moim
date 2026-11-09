import { Plus } from 'lucide-react'
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
  { value: 'open', label: '진행' },
  { value: 'scheduled', label: '예정' },
  { value: 'closed', label: '마감' },
]

export function DashboardPage({ searchParams }: PageProps<'/dashboard'>) {
  return (
    <>
      <header className="flex h-14 items-center px-4">
        <h1 className="text-xl font-extrabold tracking-tight">MOIM</h1>
      </header>
      <main className="px-4 pb-28">
        <Suspense fallback={<p className="py-12 text-center text-sm text-muted-foreground">불러오는 중…</p>}>
          <DashboardContent searchParams={searchParams} />
        </Suspense>
      </main>
      <div className="bottom-bar pointer-events-none flex justify-end">
        <Button asChild size="lg" className="pointer-events-auto rounded-full shadow-lg">
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
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-lg font-semibold">아직 모임이 없어요</p>
        <p className="text-sm text-muted-foreground">후보 날짜를 정하고 링크를 공유해 보세요.</p>
        <Button asChild size="lg">
          <Link href="/dashboard/new">첫 모임 만들기</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <nav aria-label="상태 필터" className="-mx-4 mb-3 flex gap-1.5 overflow-x-auto px-4">
        {FILTERS.map((f) => {
          const active = f === current
          return (
            <Link
              key={f.label}
              href={f.value ? `/dashboard?status=${f.value}` : '/dashboard'}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex h-tap shrink-0 items-center rounded-full px-4 text-sm font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                active ? 'bg-foreground text-background' : 'bg-secondary text-secondary-foreground',
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
        <p className="py-16 text-center text-sm text-muted-foreground">{current.label} 상태인 모임이 없어요</p>
      )}
    </>
  )
}
