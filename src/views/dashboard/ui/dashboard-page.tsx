import { CalendarPlus, LogOut, Plus } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { getDisplayStatus, getMeetingStatus, resolveConfirmation, type MeetingStatus } from '@/entities/meeting'
import { getMeetings } from '@/entities/meeting/index.server'
import { MeetingGallery } from '@/widgets/meeting-gallery'
import { requireAdmin } from '@/shared/auth'
import { cn } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { PageHeader } from '@/shared/ui/page-header'
import { PageTransition } from '@/shared/ui/page-transition'
import { signOutToLogin } from '../api/sign-out.action'

const FILTERS: { value?: MeetingStatus; label: string }[] = [
  { label: '전체' },
  { value: 'open', label: '진행 중' },
  { value: 'scheduled', label: '예정' },
  { value: 'closed', label: '마감' },
]

export function DashboardPage({ searchParams }: PageProps<'/dashboard'>) {
  return (
    <PageTransition>
      <PageHeader
        title={
          // eslint-disable-next-line @next/next/no-img-element -- 정적 SVG 로고
          <img src="/logo.svg" alt="MOIM" width={316} height={100} className="h-4.5 w-auto" />
        }
        action={
          <div className="flex items-center gap-2">
            <form action={signOutToLogin}>
              <Button
                type="submit"
                variant="ghost"
                className="relative h-9 gap-1 px-2.5 text-gray-600 after:absolute after:-inset-y-1 after:inset-x-0"
              >
                <LogOut className="size-3.5" strokeWidth={2} aria-hidden />
                로그아웃
              </Button>
            </form>
            <Button asChild className="relative h-9 px-3.5 after:absolute after:-inset-y-1 after:inset-x-0">
              <Link href="/dashboard/new" transitionTypes={['nav-forward']}>
                <Plus aria-hidden />새 모임
              </Link>
            </Button>
          </div>
        }
      />
      <main className="pb-16">
        <Suspense fallback={<p className="py-16 text-center text-sub text-gray-600">불러오는 중…</p>}>
          <DashboardContent searchParams={searchParams} />
        </Suspense>
      </main>
    </PageTransition>
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
      <div className="mx-5 mt-8 flex flex-col items-center rounded-xl border border-dashed border-gray-300 px-6 py-14 text-center">
        <CalendarPlus className="mb-3 size-6 text-gray-400" strokeWidth={1.75} aria-hidden />
        <p className="text-body font-medium">아직 모임이 없어요</p>
        <p className="mt-1 mb-5 text-sub text-gray-600">후보 날짜를 정하고 링크를 공유해 보세요.</p>
        <Button asChild>
          <Link href="/dashboard/new" transitionTypes={['nav-forward']}>첫 모임 만들기</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <nav aria-label="상태 필터" className="flex gap-1 overflow-x-auto border-b border-gray-200 px-4 py-3">
        {FILTERS.map((f) => {
          const active = f === current
          return (
            <Link
              key={f.label}
              href={f.value ? `/dashboard?status=${f.value}` : '/dashboard'}
              aria-current={active ? 'page' : undefined}
              className={cn(
                // 보이는 높이 32px, 누르는 영역은 44px
                'relative flex h-8 shrink-0 items-center rounded-md px-3 text-sub font-medium transition-colors after:absolute after:inset-x-0 after:-inset-y-1.5',
                active ? 'bg-brand-50 text-brand-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
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
        <p className="px-5 py-20 text-center text-sub text-gray-600">{current.label} 상태인 모임이 없어요</p>
      )}
    </>
  )
}
