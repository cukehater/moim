import { Check } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib/cn'

// 날짜 문자열은 서버에서 포맷: 클라이언트 번들에서 date-fns 제외
export type VoteOption = {
  id: string
  /** '12월 20일' */
  label: string
  weekday: string
  dow: number
  count?: number
  names?: string[]
  /** 최다 득표 대비 비율 0~1 (막대 채움) */
  ratio?: number
}

type Props = {
  option: VoteOption
  selected?: boolean
  multiple?: boolean
} & Omit<ComponentProps<'button'>, 'children'>

const FACE_LIMIT = 3

/** 후보일 한 줄: 왼쪽 체크 원 + 날짜 + 득표. onClick 없으면 읽기 전용 */
export function OptionCard({ option, selected = false, multiple = true, className, ...props }: Props) {
  const interactive = !!props.onClick
  const names = option.names ?? []
  return (
    <button
      type="button"
      role={multiple ? 'checkbox' : 'radio'}
      aria-checked={selected}
      aria-disabled={!interactive || undefined}
      tabIndex={interactive ? undefined : -1}
      className={cn(
        'relative isolate flex min-h-cta w-full items-center gap-3 overflow-hidden rounded-lg border bg-white px-4 py-2.5 text-left transition-colors duration-100',
        selected ? 'border-brand shadow-[inset_0_0_0_1px_var(--brand)]' : 'border-gray-200',
        interactive && 'active:opacity-70',
        className,
      )}
      {...props}
    >
      {/* 당근 투표처럼 득표 비율만큼 배경 채움 */}
      {option.ratio !== undefined && (
        <span
          aria-hidden
          className={cn(
            'absolute inset-y-0 left-0 -z-10 transition-[width] duration-300 ease-out-expo',
            selected ? 'bg-brand-100' : 'bg-gray-100',
          )}
          style={{ width: `${option.ratio * 100}%` }}
        />
      )}
      {interactive && (
        <span
          aria-hidden
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-full transition-colors duration-100',
            selected ? 'bg-brand text-white' : 'border-2 border-gray-300 bg-white',
          )}
        >
          {selected && <Check className="size-4" strokeWidth={3} />}
        </span>
      )}
      <span className="flex-1 text-body font-semibold">
        {option.label}
        <span className={cn('ml-1', option.dow === 0 ? 'text-sun' : option.dow === 6 ? 'text-sat' : 'text-gray-600')}>
          {option.weekday}
        </span>
      </span>
      {names.length > 0 && (
        <span className="flex" title={names.join(', ')}>
          <span className="sr-only">{names.join(', ')}</span>
          {names.slice(0, FACE_LIMIT).map((n, i) => (
            <span
              key={i}
              aria-hidden
              className={cn(
                '-ml-1.5 flex size-6 items-center justify-center rounded-full border-2 bg-gray-100 text-[0.625rem] font-bold text-gray-700 first:ml-0',
                'border-white',
              )}
            >
              {Array.from(n)[0]}
            </span>
          ))}
        </span>
      )}
      {option.count !== undefined && (
        <span className={cn('text-sub font-bold tabular', selected ? 'text-brand-600' : 'text-gray-600')}>
          {option.count}명
        </span>
      )}
    </button>
  )
}
