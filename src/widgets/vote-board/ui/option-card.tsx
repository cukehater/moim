import { Check } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib/cn'

// 날짜 문자열은 서버에서 포맷: 클라이언트 번들에서 date-fns 제외
export type VoteOption = {
  id: string
  label: string
  weekday: string
  dow: number
  count?: number
  names?: string[]
}

type Props = {
  option: VoteOption
  /** 득표 막대 기준 (가장 많은 득표 수) */
  max?: number
  selected?: boolean
  multiple?: boolean
} & Omit<ComponentProps<'button'>, 'children'>

/** 후보일 행. onClick 없으면 읽기 전용 */
export function OptionCard({ option, max = 0, selected = false, multiple = true, className, ...props }: Props) {
  const interactive = !!props.onClick
  const showCount = option.count !== undefined
  return (
    <button
      type="button"
      role={multiple ? 'checkbox' : 'radio'}
      aria-checked={selected}
      aria-disabled={!interactive || undefined}
      tabIndex={interactive ? undefined : -1}
      className={cn(
        'relative flex w-full flex-col gap-2 overflow-hidden rounded-2xl border bg-white px-4 py-4 text-left transition-colors duration-150',
        interactive && 'pressable hover:bg-gray-50',
        selected ? 'border-brand bg-brand-50 hover:bg-brand-50' : 'border-gray-200',
        className,
      )}
      {...props}
    >
      <span className="flex min-h-tap items-center gap-3">
        <span
          aria-hidden
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150',
            selected ? 'border-brand bg-brand text-white' : 'border-gray-300 bg-white text-transparent',
            !interactive && 'hidden',
          )}
        >
          <Check className="size-3.5" strokeWidth={3} />
        </span>
        <span className="flex flex-1 items-baseline gap-1.5">
          <span className="text-body font-bold tabular">{option.label}</span>
          <span
            className={cn(
              'text-sub font-semibold',
              option.dow === 0 ? 'text-sun' : option.dow === 6 ? 'text-sat' : 'text-gray-500',
            )}
          >
            {option.weekday}
          </span>
        </span>
        {showCount && (
          <span className={cn('text-sub font-semibold tabular', selected ? 'text-brand' : 'text-gray-600')}>
            {option.count}명
          </span>
        )}
      </span>
      {showCount && max > 0 && (
        <span aria-hidden className="h-1.5 overflow-hidden rounded-full bg-gray-100">
          <span
            className={cn('block h-full rounded-full', selected ? 'bg-brand' : 'bg-brand-100')}
            style={{ width: `${((option.count ?? 0) / max) * 100}%` }}
          />
        </span>
      )}
      {option.names && option.names.length > 0 && (
        <span className="flex flex-wrap gap-1">
          {option.names.map((name, i) => (
            <span key={i} className="rounded-full bg-gray-100 px-2.5 py-1 text-caption font-medium text-gray-700">
              {name}
            </span>
          ))}
        </span>
      )}
    </button>
  )
}
