'use client'

import { Check } from 'lucide-react'
import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { CancelVoteButton } from '@/features/vote-cancel'
import { AlreadyVotedDialog, NameDialog, renameVoter, submitVote, VoteSuccessDialog } from '@/features/vote-submit'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button'
import { Switch } from '@/shared/ui/switch'
import { OptionCard, type VoteOption } from './option-card'

type Props = {
  meetingId: string
  options: VoteOption[]
  allowMultiple: boolean
  isAnonymous: boolean
  myVote: { optionIds: string[]; name: string | null } | null
}

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x))

export function VoteBoard({ meetingId, options, allowMultiple, isAnonymous, myVote }: Props) {
  const [picked, setSelected] = useState(myVote?.optionIds ?? [])
  // 갱신으로 사라진 후보 날짜는 선택에서 제외 (숨은 id가 남아 제출이 계속 거부되지 않게)
  const selected = picked.filter((id) => options.some((o) => o.id === id))
  const [name, setName] = useState(myVote?.name ?? '')
  const [nameDialog, setNameDialog] = useState<{ onNamed?: () => void; error?: string } | null>(null)
  const [success, setSuccess] = useState({ open: false, title: '', dates: [] as string[] })
  const [pending, startTransition] = useTransition()
  const listRef = useRef<HTMLDivElement>(null)
  // 페이지를 열 때 이미 투표한 사람만. 이 페이지에서 투표·취소하면 끔: 취소 후 재투표로 myVote가 다시 생겨도 안 띄움
  const [returning, setReturning] = useState(!!myVote)

  const dateLabels = (ids: string[]) =>
    options.filter((o) => ids.includes(o.id)).map((o) => `${o.label} (${o.weekday})`)

  const apply = (id: string) =>
    setSelected((s) => (allowMultiple ? (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]) : [id]))

  const onTap = (id: string) => {
    if (!isAnonymous && !name) return setNameDialog({ onNamed: () => apply(id) })
    apply(id)
  }

  const allSelected = selected.length === options.length
  const toggleAll = () => setSelected(allSelected ? [] : options.map((o) => o.id))
  const onTapAll = () => {
    if (!isAnonymous && !name) return setNameDialog({ onNamed: toggleAll })
    toggleAll()
  }

  const submit = () =>
    startTransition(async () => {
      const r = await submitVote(meetingId, { optionIds: selected, name: isAnonymous ? undefined : name })
      if (r.ok) {
        setReturning(false)
        return setSuccess({ open: true, title: myVote ? '투표를 수정했어요' : '투표했어요', dates: dateLabels(selected) })
      }
      const nameError = r.fieldErrors?.name?.[0]
      if (nameError) return setNameDialog({ error: nameError })
      toast.error(r.message ?? '투표하지 못했어요')
    })

  const ctaLabel = pending
    ? '투표 중…'
    : !selected.length
      ? '날짜를 골라 주세요'
      : allowMultiple
        ? `${selected.length}개 날짜로 투표하기`
        : '이 날짜로 투표하기'

  const dirty = !myVote || !sameSet(selected, myVote.optionIds) || (!isAnonymous && name !== (myVote.name ?? ''))

  return (
    <>
      <div
        ref={listRef}
        role={allowMultiple ? 'group' : 'radiogroup'}
        aria-label={allowMultiple ? '참석 가능한 날짜 (여러 개 선택 가능)' : '참석 가능한 날짜 (하나만 선택)'}
        className="stagger-rise flex flex-col divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200"
      >
        {allowMultiple && options.length > 1 && (
          // 목록 머리 줄: 날짜(체크박스)와 구분되게 회색 면 + 스위치. 줄 전체가 label이라 문구를 눌러도 토글
          <label
            className={cn(
              'flex min-h-[max(44px,2.75rem)] cursor-pointer items-center justify-between gap-3 bg-gray-50 pr-3 pl-3 text-sub font-semibold transition-colors duration-200',
              allSelected ? 'text-brand-600' : 'text-gray-700',
            )}
          >
            모든 날짜 참석 가능해요
            <Switch checked={allSelected} onCheckedChange={onTapAll} />
          </label>
        )}
        {options.map((o) => (
          <OptionCard
            key={o.id}
            option={o}
            multiple={allowMultiple}
            selected={selected.includes(o.id)}
            onClick={() => onTap(o.id)}
          />
        ))}
      </div>

      {!isAnonymous && name && (
        <p className="mt-3 text-caption text-gray-600 animate-in fade-in slide-in-from-top-1 duration-300 ease-out-expo">
          <b className="font-medium text-gray-900">{name}</b>님으로 투표해요 ·{' '}
          <button type="button" onClick={() => setNameDialog({})} className="py-2 font-medium text-brand underline-offset-2 hover:underline">
            이름 변경
          </button>
        </p>
      )}

      <div className="bottom-bar flex gap-2">
        {myVote ? (
          <>
            <CancelVoteButton meetingId={meetingId} onCanceled={() => {
              setSelected([])
              setReturning(false)
            }} />
            <Button size="lg" className="flex-1" disabled={pending || !dirty || selected.length === 0} onClick={submit}>
              <Check strokeWidth={2.75} aria-hidden />
              {pending ? '저장 중…' : '수정하기'}
            </Button>
          </>
        ) : (
          <Button size="lg" className="w-full" disabled={pending || selected.length === 0} onClick={submit}>
            {/* 고른 개수가 바뀔 때마다 문구가 아래에서 살짝 올라옴: 탭이 반영됐다는 확인 */}
            <span key={ctaLabel} className="flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-1 duration-200 ease-out-expo">
              {selected.length > 0 && <Check strokeWidth={2.75} aria-hidden />}
              {ctaLabel}
            </span>
          </Button>
        )}
      </div>

      <VoteSuccessDialog
        {...success}
        // 닫히는 애니메이션 동안 내용 유지
        onOpenChange={(open) => setSuccess((s) => ({ ...s, open }))}
      />

      {returning && myVote && (
        <AlreadyVotedDialog
          name={myVote.name}
          dates={dateLabels(myVote.optionIds)}
          onEdit={() => listRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })}
        />
      )}

      <NameDialog
        open={!!nameDialog}
        onOpenChange={(open) => !open && setNameDialog(null)}
        defaultName={name}
        serverError={nameDialog?.error}
        onConfirm={async (n) => {
          // 이미 투표했으면 이름만 바로 저장 (모든 날짜에 반영)
          if (myVote && n !== myVote.name) {
            const r = await renameVoter(meetingId, n)
            if (!r.ok) return r.fieldErrors?.name?.[0] ?? r.message ?? '이름을 바꾸지 못했어요'
            toast.success('이름을 바꿨어요')
          }
          setName(n)
          nameDialog?.onNamed?.()
          setNameDialog(null)
        }}
      />
    </>
  )
}
