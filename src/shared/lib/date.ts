import { TZDate } from '@date-fns/tz'
import { differenceInMinutes } from 'date-fns/differenceInMinutes'
import { format } from 'date-fns/format'
import { parseISO } from 'date-fns/parseISO'
import { ko } from 'date-fns/locale/ko'

const TZ = 'Asia/Seoul'

/** 'yyyy-MM-dd' → '12/20(토)' */
export const formatDay = (day: string) => format(parseISO(day), 'M/d(EEE)', { locale: ko })

/** → '12/20(토) 19:00' (KST) */
export const formatDateTime = (d: Date) => format(new TZDate(d, TZ), 'M/d(EEE) HH:mm', { locale: ko })

/** → '2026.12.20 19:00' (KST) */
export const formatPeriod = (d: Date) => format(new TZDate(d, TZ), 'yyyy.MM.dd HH:mm')

/** datetime-local 입력값 (KST) */
export const toKstInput = (d: Date) => format(new TZDate(d, TZ), "yyyy-MM-dd'T'HH:mm")

// 한국은 DST가 없어 +09:00 고정 오프셋으로 충분
export const fromKstInput = (value: string) => new Date(`${value}:00+09:00`)

export function formatRemaining(end: Date, now: Date) {
  const minutes = differenceInMinutes(end, now)
  if (minutes >= 60 * 24) return `${Math.floor(minutes / (60 * 24))}일 남았어요`
  if (minutes >= 60) return `${Math.floor(minutes / 60)}시간 남았어요`
  return `${Math.max(minutes, 1)}분 남았어요`
}

/** 'yyyy-MM-dd' → { label: '12월 20일', weekday: '토', dow: 6 } */
export function dayParts(day: string) {
  const d = parseISO(day)
  return { label: format(d, 'M월 d일'), weekday: format(d, 'EEE', { locale: ko }), dow: d.getDay() }
}
