import { cn } from '@/shared/lib/cn'

// 브랜드·토(파랑)·일(주황)·에러(빨강)와 겹치지 않는 색만
const PALETTE = [
  'bg-emerald-100 text-emerald-800',
  'bg-violet-100 text-violet-800',
  'bg-amber-100 text-amber-800',
  'bg-pink-100 text-pink-800',
  'bg-teal-100 text-teal-800',
  'bg-lime-100 text-lime-800',
  'bg-fuchsia-100 text-fuchsia-800',
  'bg-cyan-100 text-cyan-800',
]

/** 투표자 순번별 고정 색 */
export const voterColor = (order: number) => PALETTE[order % PALETTE.length]

export function VoterChip({ name, order, className }: { name: string; order: number; className?: string }) {
  return (
    <span className={cn('inline-flex h-7 items-center rounded-full px-2.5 text-sub font-semibold', voterColor(order), className)}>
      {name}
    </span>
  )
}
