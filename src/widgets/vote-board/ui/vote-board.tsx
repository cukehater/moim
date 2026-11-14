'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { CancelVoteButton } from '@/features/vote-cancel'
import { NameDialog, renameVoter, submitVote } from '@/features/vote-submit'
import { Button } from '@/shared/ui/button'
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
  const [selected, setSelected] = useState(myVote?.optionIds ?? [])
  const [name, setName] = useState(myVote?.name ?? '')
  const [nameDialog, setNameDialog] = useState<{ pendingId?: string; error?: string } | null>(null)
  const [pending, startTransition] = useTransition()

  const apply = (id: string) =>
    setSelected((s) => (allowMultiple ? (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]) : [id]))

  const onTap = (id: string) => {
    if (!isAnonymous && !name) return setNameDialog({ pendingId: id })
    apply(id)
  }

  const submit = () =>
    startTransition(async () => {
      const r = await submitVote(meetingId, { optionIds: selected, name: isAnonymous ? undefined : name })
      if (r.ok) return void toast.success(myVote ? '투표를 수정했어요' : '투표했어요')
      const nameError = r.fieldErrors?.name?.[0]
      if (nameError) return setNameDialog({ error: nameError })
      toast.error(r.message ?? '투표하지 못했어요')
    })

  const dirty = !myVote || !sameSet(selected, myVote.optionIds) || (!isAnonymous && name !== (myVote.name ?? ''))

  return (
    <>
      <div
        role={allowMultiple ? 'group' : 'radiogroup'}
        aria-label={allowMultiple ? '참석 가능한 날짜 (여러 개 선택 가능)' : '참석 가능한 날짜 (하나만 선택)'}
        className="flex flex-col gap-2"
      >
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
        <p className="mt-3 text-caption text-gray-600">
          <b className="font-semibold text-gray-700">{name}</b>님으로 투표해요 ·{' '}
          <button type="button" onClick={() => setNameDialog({})} className="py-2 font-semibold text-brand underline-offset-2 hover:underline">
            이름 변경
          </button>
        </p>
      )}

      <div className="bottom-bar flex gap-2">
        {myVote ? (
          <>
            <CancelVoteButton meetingId={meetingId} onCanceled={() => setSelected([])} />
            <Button size="lg" className="flex-1" disabled={pending || !dirty || selected.length === 0} onClick={submit}>
              {pending ? '저장 중…' : '수정하기'}
            </Button>
          </>
        ) : (
          <Button size="lg" className="w-full" disabled={pending || selected.length === 0} onClick={submit}>
            {pending ? '투표 중…' : '투표하기'}
          </Button>
        )}
      </div>

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
          if (nameDialog?.pendingId) apply(nameDialog.pendingId)
          setNameDialog(null)
        }}
      />
    </>
  )
}
