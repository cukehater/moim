import { OptionCard, type VoteOption } from './option-card'

/** 읽기 전용 목록 (예정·마감 배경) */
export function OptionList({ options, multiple }: { options: VoteOption[]; multiple: boolean }) {
  const max = Math.max(0, ...options.map((o) => o.count ?? 0))
  return (
    <div className="flex flex-col gap-2" aria-label="후보 날짜">
      {options.map((o) => (
        <OptionCard key={o.id} option={o} max={max} multiple={multiple} />
      ))}
    </div>
  )
}
