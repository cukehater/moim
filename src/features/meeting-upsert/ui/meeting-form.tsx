'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns/format'
import { parseISO } from 'date-fns/parseISO'
import { ko } from 'date-fns/locale/ko'
import { useRouter } from 'next/navigation'
import { type ReactNode, useState, useTransition } from 'react'
import { Controller, type Path, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { meetingInputSchema, type MeetingInput } from '@/entities/meeting'
import { formatDay } from '@/shared/lib'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog'
import { Button } from '@/shared/ui/button'
import { Calendar } from '@/shared/ui/calendar'
import { FieldError } from '@/shared/ui/field-error'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group'
import { Switch } from '@/shared/ui/switch'
import { Textarea } from '@/shared/ui/textarea'
import { upsertMeeting } from '../api/upsert-meeting.action'

type Props = {
  meetingId: string | null
  defaultValues: MeetingInput
  hasVotes: boolean
  renderThumbnail: (field: { value: string | null; onChange: (v: string | null) => void }) => ReactNode
}

const VISIBILITY = [
  { value: 'always', label: '항상 공개' },
  { value: 'after_vote', label: '투표한 사람에게만 공개' },
  { value: 'after_close', label: '마감 후 공개' },
] as const

export function MeetingForm({ meetingId, defaultValues, hasVotes, renderThumbnail }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  // 투표가 있는 모임 수정 시 경고 확인 대기 중인 값
  const [confirming, setConfirming] = useState<{ values: MeetingInput; warnings: string[] } | null>(null)
  const form = useForm<MeetingInput>({ resolver: zodResolver(meetingInputSchema), defaultValues })
  const { register, control, handleSubmit, setError, formState } = form
  const err = (name: keyof MeetingInput) => formState.errors[name]?.message

  const save = (values: MeetingInput) =>
    startTransition(async () => {
      const result = await upsertMeeting(meetingId, values)
      if (result.ok) {
        toast.success(meetingId ? '모임을 수정했어요' : '모임을 만들었어요')
        router.push(`/dashboard/${result.data.id}`)
        return
      }
      for (const [name, messages] of Object.entries(result.fieldErrors ?? {})) {
        if (messages?.[0]) setError(name as Path<MeetingInput>, { message: messages[0] })
      }
      if (result.message) toast.error(result.message)
    })

  const onValid = (values: MeetingInput) => {
    const w: string[] = []
    if (meetingId && hasVotes) {
      if (defaultValues.dates.some((d) => !values.dates.includes(d)))
        w.push('삭제한 후보 날짜에 들어온 투표는 함께 지워져요.')
      if (!defaultValues.isAnonymous && values.isAnonymous)
        w.push('익명으로 바꾸면 투표자 이름이 숨겨져요. 이름 데이터는 보존돼요.')
      if (defaultValues.isAnonymous && !values.isAnonymous)
        w.push('기명으로 바꾸면 기존 투표는 "(이름 없음)"으로 표시돼요.')
    }
    if (w.length) return setConfirming({ values, warnings: w })
    save(values)
  }

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className="flex flex-col gap-6 px-4 pt-4 pb-28">
      <section className="flex flex-col gap-2">
        <Label>썸네일</Label>
        <Controller control={control} name="thumbnailId" render={({ field }) => <>{renderThumbnail(field)}</>} />
      </section>

      <Field label="제목" htmlFor="title" required error={err('title')}>
        <Input id="title" maxLength={80} aria-invalid={!!err('title')} {...register('title')} />
      </Field>
      <Field label="모임장" htmlFor="host" required error={err('host')}>
        <Input id="host" maxLength={30} aria-invalid={!!err('host')} {...register('host')} />
      </Field>
      <Field label="장소" htmlFor="location" error={err('location')}>
        <Input id="location" maxLength={100} {...register('location')} />
      </Field>
      <Field label="설명" htmlFor="description" error={err('description')}>
        <Textarea id="description" maxLength={500} rows={3} {...register('description')} />
      </Field>

      <Controller
        control={control}
        name="dates"
        render={({ field, fieldState }) => (
          <section className="flex flex-col gap-2">
            <Label>
              후보 날짜 <span className="text-primary">*</span>
            </Label>
            <div className="rounded-xl border">
              <Calendar
                mode="multiple"
                locale={ko}
                selected={field.value.map((d) => parseISO(d))}
                onSelect={(days) => field.onChange((days ?? []).map((d) => format(d, 'yyyy-MM-dd')).sort())}
                className="mx-auto [--cell-size:2.75rem]"
              />
            </div>
            {field.value.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {field.value.length}개 · {field.value.map(formatDay).join(', ')}
              </p>
            )}
            <FieldError message={fieldState.error?.message ?? fieldState.error?.root?.message} />
          </section>
        )}
      />

      <div className="grid grid-cols-2 gap-3">
        <Field label="투표 시작" htmlFor="startsAt" error={err('startsAt')}>
          <Input id="startsAt" type="datetime-local" {...register('startsAt')} />
        </Field>
        <Field label="투표 종료" htmlFor="endsAt" error={err('endsAt')}>
          <Input id="endsAt" type="datetime-local" aria-invalid={!!err('endsAt')} {...register('endsAt')} />
        </Field>
      </div>

      <section className="flex flex-col divide-y rounded-xl border">
        <Controller
          control={control}
          name="isAnonymous"
          render={({ field }) => (
            <ToggleRow id="isAnonymous" label="익명 투표" hint="투표자 이름을 받지 않아요" checked={field.value} onChange={field.onChange} />
          )}
        />
        <Controller
          control={control}
          name="allowMultiple"
          render={({ field }) => (
            <ToggleRow id="allowMultiple" label="여러 날짜 선택 허용" hint="끄면 날짜를 하나만 고를 수 있어요" checked={field.value} onChange={field.onChange} />
          )}
        />
      </section>

      <Controller
        control={control}
        name="resultVisibility"
        render={({ field }) => (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">결과 공개</legend>
            <RadioGroup value={field.value} onValueChange={field.onChange} className="gap-0 rounded-xl border">
              {VISIBILITY.map((v) => (
                <Label key={v.value} className="flex min-h-tap items-center gap-3 px-4 font-normal not-last:border-b">
                  <RadioGroupItem value={v.value} />
                  {v.label}
                </Label>
              ))}
            </RadioGroup>
          </fieldset>
        )}
      />

      <div className="bottom-bar bg-background/95 border-t backdrop-blur">
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? '저장 중…' : meetingId ? '수정하기' : '모임 만들기'}
        </Button>
      </div>

      <AlertDialog open={!!confirming} onOpenChange={(open) => !open && setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이미 투표가 있어요</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <ul className="list-disc pl-5 text-left">
                {confirming?.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirming && save(confirming.values)}>
              그래도 저장
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  )
}

function Field(props: { label: string; htmlFor: string; required?: boolean; error?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={props.htmlFor}>
        {props.label}
        {props.required && <span className="text-primary">*</span>}
      </Label>
      {props.children}
      <FieldError message={props.error} />
    </div>
  )
}

function ToggleRow(props: { id: string; label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex min-h-tap items-center justify-between gap-3 px-4 py-3">
      <Label htmlFor={props.id} className="flex flex-col items-start gap-0.5">
        <span>{props.label}</span>
        <span className="text-xs font-normal text-muted-foreground">{props.hint}</span>
      </Label>
      <Switch id={props.id} checked={props.checked} onCheckedChange={props.onChange} />
    </div>
  )
}
