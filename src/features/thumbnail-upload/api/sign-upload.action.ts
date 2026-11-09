'use server'

import { createHash } from 'node:crypto'
import { requireAdmin } from '@/shared/auth'
import { env } from '@/shared/config'

/** Cloudinary 업로드 위젯의 paramsToSign 서명 (API secret은 서버에만) */
export async function signUploadParams(paramsToSign: Record<string, string | number>) {
  await requireAdmin()
  const payload = Object.keys(paramsToSign)
    .sort()
    .map((k) => `${k}=${paramsToSign[k]}`)
    .join('&')
  return createHash('sha1')
    .update(payload + env.CLOUDINARY_API_SECRET)
    .digest('hex')
}
