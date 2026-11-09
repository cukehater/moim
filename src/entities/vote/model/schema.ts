import { z } from 'zod'

export const voterNameSchema = z
  .string()
  .trim()
  .min(1, '이름을 입력해 주세요')
  .max(20, '20자 이내로 입력해 주세요')

export const selectionSchema = (allowMultiple: boolean) =>
  z
    .array(z.string().min(1))
    .refine((ids) => new Set(ids).size === ids.length, '같은 날짜가 중복됐어요')
    .refine(
      (ids) => (allowMultiple ? ids.length >= 1 : ids.length === 1),
      allowMultiple ? '날짜를 1개 이상 골라 주세요' : '날짜를 1개만 골라 주세요',
    )
