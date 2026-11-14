'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns/format'
import { parseISO } from 'date-fns/parseISO'
import { startOfToday } from 'date-fns/startOfToday'
import { ko } from 'date-fns/locale/ko'
import { Check, X } from 'lucide-react'
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
  // 익명으로 받은 투표가 있으면 기명 전환 금지 (서버에서도 막음)
  const anonymousLocked = !!meetingId && hasVotes && defaultValues.isAnonymous

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
    }
    if (w.length) return setConfirming({ values, warnings: w })
    save(values)
  }

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className="flex flex-col gap-7 px-5 pt-4 pb-32">
      <section>
        <Controller control={control} name="thumbnailId" render={({ field }) => <>{renderThumbnail(field)}</>} />
      </section>

      <Group label="기본 정보" boxed={false} errors={[err('title'), err('host'), err('location'), err('mapUrl'), err('description')]}>
        <div>
          <Input aria-label="제목" placeholder="제목 (필수)" maxLength={80} aria-invalid={!!err('title')} {...register('title')} />
        </div>
        <div>
          <Input aria-label="모임장" placeholder="모임장 (필수)" maxLength={30} aria-invalid={!!err('host')} {...register('host')} />
        </div>
        <div>
          <Input aria-label="장소" placeholder="장소" maxLength={100} aria-invalid={!!err('location')} {...register('location')} />
        </div>
        <div>
          <Input
            type="url"
            inputMode="url"
            aria-label="네이버 지도 링크"
            placeholder="네이버 지도 링크 (선택)"
            maxLength={300}
            aria-invalid={!!err('mapUrl')}
            {...register('mapUrl')}
          />
        </div>
        <div>
          <Textarea aria-label="설명" placeholder="설명" maxLength={500} rows={3} {...register('description')} />
        </div>
      </Group>

      <Controller
        control={control}
        name="dates"
        render={({ field, fieldState }) => (
          <Group
            label="후보 날짜"
            footer={
              field.value.length > 0 ? (
                <SelectedDates dates={field.value} onRemove={(d) => field.onChange(field.value.filter((v) => v !== d))} />
              ) : (
                '달력에서 날짜를 눌러 고르세요.'
              )
            }
            errors={[fieldState.error?.message ?? fieldState.error?.root?.message]}
          >
            <div className="px-2 py-2">
              <Calendar
                mode="multiple"
                locale={ko}
                selected={field.value.map((d) => parseISO(d))}
                // 지난 날짜는 후보로 고를 수 없음
                disabled={{ before: startOfToday() }}
                showOutsideDays={false}
                onSelect={(days) => field.onChange((days ?? []).map((d) => format(d, 'yyyy-MM-dd')).sort())}
                className="mx-auto w-full bg-transparent p-1 [--cell-size:2.25rem]"
              />
            </div>
          </Group>
        )}
      />

      <Group label="투표 기간" errors={[err('startsAt'), err('endsAt')]}>
        <Row label="시작" htmlFor="startsAt">
          <Input id="startsAt" type="datetime-local" className={DATE_INPUT} {...register('startsAt')} />
        </Row>
        <Row label="종료" htmlFor="endsAt">
          <Input id="endsAt" type="datetime-local" className={DATE_INPUT} aria-invalid={!!err('endsAt')} {...register('endsAt')} />
        </Row>
      </Group>

      <Group
        label="투표 방식"
        footer={
          anonymousLocked
            ? '익명으로 투표가 들어와서 기명으로 바꿀 수 없어요.'
            : '익명이면 이름을 묻지 않아요. 여러 날짜를 끄면 하루만 고를 수 있어요.'
        }
        errors={[err('isAnonymous')]}
      >
        <Controller
          control={control}
          name="isAnonymous"
          render={({ field }) => (
            <Row label="익명 투표" htmlFor="isAnonymous">
              <Switch
                id="isAnonymous"
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={anonymousLocked}
              />
            </Row>
          )}
        />
        <Controller
          control={control}
          name="allowMultiple"
          render={({ field }) => (
            <Row label="여러 날짜 선택" htmlFor="allowMultiple">
              <Switch id="allowMultiple" checked={field.value} onCheckedChange={field.onChange} />
            </Row>
          )}
        />
      </Group>

      <Controller
        control={control}
        name="resultVisibility"
        render={({ field }) => (
          <Group label="결과 공개">
            {VISIBILITY.map((v) => (
              <button
                key={v.value}
                type="button"
                role="radio"
                aria-checked={field.value === v.value}
                onClick={() => field.onChange(v.value)}
                className="flex min-h-tap w-full items-center px-4 text-left text-sub hover:bg-gray-50 active:bg-gray-100"
              >
                <span className="flex-1">{v.label}</span>
                {field.value === v.value && <Check className="size-4 text-brand" strokeWidth={2.5} aria-hidden />}
              </button>
            ))}
          </Group>
        )}
      />

      <div className="bottom-bar">
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

const DATE_INPUT = 'h-9 w-auto rounded-md border-0 bg-gray-100 px-2.5 text-right shadow-none'

/** 섹션: 머리말 + 테두리 묶음(boxed) 또는 쌓인 인풋 + 꼬리말/에러 */
function Group(props: {
  label: string
  footer?: ReactNode
  errors?: (string | undefined)[]
  boxed?: boolean
  children: ReactNode
}) {
  const errors = props.errors?.filter(Boolean) ?? []
  return (
    <section>
      <h2 className="section-label">{props.label}</h2>
      <div className={props.boxed === false ? 'flex flex-col gap-2' : 'grouped'}>{props.children}</div>
      {props.footer && <div className="pt-2 text-caption text-gray-600">{props.footer}</div>}
      {errors.map((e) => (
        <div key={e} className="pt-1.5">
          <FieldError message={e} />
        </div>
      ))}
    </section>
  )
}

/** 고른 후보 날짜: 개수 + 하나씩 뺄 수 있는 칩 */
function SelectedDates({ dates, onRemove }: { dates: string[]; onRemove: (date: string) => void }) {
  return (
    <>
      <p className="pb-2">
        <b className="font-semibold text-gray-900 tabular">{dates.length}개</b> 골랐어요
      </p>
      <ul className="grid grid-cols-4 gap-1.5">
        {dates.map((d) => (
          <li
            key={d}
            className="flex h-7 items-center justify-between rounded-md bg-gray-100 pr-1 pl-2 text-caption font-medium text-gray-900 tabular"
          >
            {formatDay(d)}
            <button
              type="button"
              aria-label={`${formatDay(d)} 빼기`}
              onClick={() => onRemove(d)}
              className="relative flex size-5 items-center justify-center rounded text-gray-500 after:absolute after:-inset-2 hover:bg-gray-200 hover:text-gray-900"
            >
              <X className="size-3" strokeWidth={2.5} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}

function Row(props: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="flex min-h-tap items-center justify-between gap-3 py-1.5 pr-3 pl-4">
      <Label htmlFor={props.htmlFor} className="text-sub font-normal text-gray-900">
        {props.label}
      </Label>
      {props.children}
    </div>
  )
}
