import { Check } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib/cn'

// label은 서버에서 포맷 ('12/20(토)'): 클라이언트 번들에서 date-fns 제외
export type VoteOption = { id: string; label: string; count?: number; names?: string[] }

type Props = { option: VoteOption; selected?: boolean; multiple?: boolean } & Omit<ComponentProps<'button'>, 'children'>

/** 후보일 카드. onClick 없으면 읽기 전용 */
export function OptionCard({ option, selected = false, multiple = true, className, ...props }: Props) {
  const interactive = !!props.onClick
  return (
    <button
      type="button"
      role={multiple ? 'checkbox' : 'radio'}
      aria-checked={selected}
      aria-disabled={!interactive || undefined}
      tabIndex={interactive ? undefined : -1}
      className={cn(
        'flex min-h-tap w-full items-start gap-3 rounded-xl border bg-card px-4 py-3 text-left transition-colors outline-none',
        'focus-visible:ring-[3px] focus-visible:ring-ring/50',
        interactive && 'active:bg-accent',
        selected && 'border-primary bg-accent',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          'mt-0.5 flex size-5 shrink-0 items-center justify-center border-2',
          multiple ? 'rounded-md' : 'rounded-full',
          selected ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
        )}
      >
        {selected && <Check className="size-3.5" strokeWidth={3} />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="flex items-baseline justify-between gap-2">
          <span className="text-base font-semibold tabular-nums">{option.label}</span>
          {option.count !== undefined && (
            <span className="text-sm text-muted-foreground tabular-nums">{option.count}명</span>
          )}
        </span>
        {option.names && option.names.length > 0 && (
          <span className="flex flex-wrap gap-1">
            {option.names.map((name, i) => (
              <span key={i} className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                {name}
              </span>
            ))}
          </span>
        )}
      </span>
    </button>
  )
}
