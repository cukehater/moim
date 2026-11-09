'use client'

import type { ComponentProps } from 'react'
import { MeetingForm } from '@/features/meeting-upsert'
import { ThumbnailUpload } from '@/features/thumbnail-upload'

/** 기능 간 조합(폼 + 썸네일 업로드)은 상위 레이어에서 */
export function MeetingFormClient(props: Omit<ComponentProps<typeof MeetingForm>, 'renderThumbnail'>) {
  return <MeetingForm {...props} renderThumbnail={(field) => <ThumbnailUpload {...field} />} />
}
