import { Check } from 'lucide-react'
import type { ComponentProps } from 'react'
import type { Voter } from '@/entities/vote'
import { cn } from '@/shared/lib/cn'
import { VOTER_SLOT, VotersSheet } from './voters-sheet'

// 날짜 문자열은 서버에서 포맷: 클라이언트 번들에서 date-fns 제외
export type VoteOption = {
  id: string
  /** '12월 20일' */
  label: string
  weekday: string
  dow: number
  count?: number
  /** 기명 + 결과 공개일 때만 ([]면 빈칸으로 자리 유지) */
  voters?: Voter[]
  /** 최다 득표 대비 비율 0~1 (막대 채움) */
  ratio?: number
}

type Props = {
  option: VoteOption
  selected?: boolean
  multiple?: boolean
} & Omit<ComponentProps<'button'>, 'children'>

/**
 * 리스트 한 줄: 체크박스(복수)·라디오(단일) + 날짜 + 득표 막대·수.
 * onClick 없으면 읽기 전용. 투표자 아바타(시트 열기)는 중첩 버튼을 피해 줄 오른쪽 형제로.
 */
export function OptionCard({ option, selected = false, multiple = true, className, ...props }: Props) {
  const interactive = !!props.onClick
  const voters = option.voters ?? []
  return (
    // 호버 배경은 줄 전체에(버튼·시트 영역으로 쪼개지지 않게), 마우스에서만: 터치 기기에선 탭한 줄에 회색이 남아 선택된 것처럼 보임
    <div
      className={cn(
        'flex items-stretch transition-colors duration-100',
        selected ? 'bg-brand-50' : interactive && 'mouse-hover:bg-gray-50',
      )}
    >
      <button
        type="button"
        role={multiple ? 'checkbox' : 'radio'}
        aria-checked={selected}
        aria-disabled={!interactive || undefined}
        tabIndex={interactive ? undefined : -1}
        className={cn(
          'flex min-h-12 min-w-0 flex-1 items-center gap-3 pr-2 pl-3.5 text-left outline-offset-[-2px]',
          className,
        )}
        {...props}
      >
        {interactive && (
          <span
            aria-hidden
            className={cn(
              'flex size-[1.125rem] shrink-0 items-center justify-center border-[1.5px] transition-colors duration-100',
              multiple ? 'rounded-[4px]' : 'rounded-full',
              selected ? 'border-brand bg-brand text-white' : 'border-gray-300 bg-white',
            )}
          >
            {selected && <Check className="size-3" strokeWidth={3.25} />}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-body font-medium">
          {option.label}
          <span
            className={cn(
              'ml-1 text-sub font-normal',
              option.dow === 0 ? 'text-sun' : option.dow === 6 ? 'text-sat' : 'text-gray-600',
            )}
          >
            ({option.weekday})
          </span>
        </span>
        {option.ratio !== undefined && (
          <span
            aria-hidden
            className={cn('h-1 w-8 shrink-0 overflow-hidden rounded-full bg-gray-200', !option.count && 'invisible')}
          >
            <span
              className={cn(
                'block h-full rounded-full transition-[width] duration-300 ease-out-expo',
                option.ratio === 1 && option.count ? 'bg-brand' : 'bg-gray-400',
              )}
              style={{ width: `${option.ratio * 100}%` }}
            />
          </span>
        )}
        {option.count !== undefined && (
          <span
            className={cn(
              'w-7 shrink-0 text-right text-sub font-medium tabular',
              option.count ? 'text-gray-700' : 'text-gray-400',
            )}
          >
            {option.count}명
          </span>
        )}
      </button>
      {voters.length > 0 ? (
        <VotersSheet dateLabel={`${option.label}(${option.weekday})`} voters={voters} />
      ) : (
        option.voters && (
          // 시트 버튼과 같은 구조의 빈칸
          <span aria-hidden className="flex shrink-0 items-center gap-0.5 pr-3 pl-1">
            <span className={VOTER_SLOT} />
            <span className="size-4" />
          </span>
        )
      )}
    </div>
  )
}
