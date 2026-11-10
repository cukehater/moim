import { OptionCard, type VoteOption } from './option-card'

/** 읽기 전용 목록 (예정·마감 배경) */
export function OptionList({ options, multiple }: { options: VoteOption[]; multiple: boolean }) {
  return (
    <div className="flex flex-col gap-2" aria-label="후보 날짜">
      {options.map((o) => (
        <OptionCard key={o.id} option={o} multiple={multiple} />
      ))}
    </div>
  )
}
