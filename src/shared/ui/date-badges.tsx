import { cn } from '@/shared/lib/cn'

type Props = { dates: string[]; tone?: 'brand' | 'gray'; className?: string } & { 'aria-label'?: string }

/** 모달 속 고른 날짜 뱃지: 한 줄 3개, 덜 찬 줄은 가운데로. w-full: 부모가 items-center여도 칸 폭(1/3)이 줄지 않게 ('12월 20일(토)'도 한 칸에 들어가게 좌우 여백을 줄임) */
export function DateBadges({ dates, tone = 'brand', className, ...props }: Props) {
  return (
    <ul className={cn('flex w-full flex-wrap justify-center gap-1.5', className)} {...props}>
      {dates.map((d) => (
        <li
          key={d}
          className={cn(
            'w-[calc((100%-0.75rem)/3)] rounded-full px-1 py-1 text-center text-caption font-medium whitespace-nowrap tabular',
            tone === 'brand' ? 'bg-brand-50 text-brand-600' : 'bg-gray-100 text-gray-800',
          )}
        >
          {d}
        </li>
      ))}
    </ul>
  )
}
