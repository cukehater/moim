import { cn } from '@/shared/lib/cn'

// 리니어식 아바타 색. 흰 글자 대비 4.5:1 이상
const PALETTE = [
  'bg-emerald-600',
  'bg-violet-600',
  'bg-amber-700',
  'bg-pink-600',
  'bg-teal-700',
  'bg-indigo-500',
  'bg-lime-700',
  'bg-fuchsia-700',
]

/** 투표자 순번별 고정 색 */
export const voterColor = (order: number) => PALETTE[order % PALETTE.length]

/** 이름 첫 글자 원형 아바타 */
export function VoterAvatar({ name, order, className }: { name: string; order: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-6 shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-semibold text-white',
        voterColor(order),
        className,
      )}
    >
      {Array.from(name)[0]}
    </span>
  )
}

/** 아바타 + 이름 */
export function VoterChip({ name, order, className }: { name: string; order: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-sub text-gray-900', className)}>
      <VoterAvatar name={name} order={order} className="size-5 text-[0.625rem]" />
      {name}
    </span>
  )
}
