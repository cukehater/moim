'use client'

import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { FieldError } from '@/shared/ui/field-error'
import { Input } from '@/shared/ui/input'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultName: string
  serverError?: string
  onConfirm: (name: string) => void
}

export function NameDialog({ open, onOpenChange, defaultName, serverError, onConfirm }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* 열 때마다 입력값·에러 초기화 */}
        {open && <NameForm defaultName={defaultName} serverError={serverError} onConfirm={onConfirm} />}
      </DialogContent>
    </Dialog>
  )
}

function NameForm({ defaultName, serverError, onConfirm }: Omit<Props, 'open' | 'onOpenChange'>) {
  const [name, setName] = useState(defaultName)
  const [error, setError] = useState(serverError)
  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        // voterNameSchema와 같은 규칙. 투표 페이지 번들에서 zod를 빼려고 직접 검사 (서버에서 zod로 재검증)
        const trimmed = name.trim()
        if (!trimmed) return setError('이름을 입력해 주세요')
        if (trimmed.length > 20) return setError('20자 이내로 입력해 주세요')
        onConfirm(trimmed)
      }}
    >
      <DialogHeader>
        <DialogTitle>이름을 알려주세요</DialogTitle>
        <DialogDescription>다른 참여자에게 이 이름으로 보여요.</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Input
          autoFocus
          className="bg-gray-100"
          aria-label="이름"
          aria-invalid={!!error}
          aria-describedby={error ? 'voter-name-error' : undefined}
          maxLength={20}
          autoComplete="nickname"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError(undefined)
          }}
        />
        <FieldError id="voter-name-error" message={error} />
      </div>
      <DialogFooter>
        <Button type="submit" size="lg" className="w-full">
          확인
        </Button>
      </DialogFooter>
    </form>
  )
}
