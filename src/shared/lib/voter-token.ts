import 'server-only'
import { cookies } from 'next/headers'
import { createId } from './id'

const COOKIE = 'voterToken'

export async function getVoterToken() {
  return (await cookies()).get(COOKIE)?.value ?? null
}

/** 서버 액션 전용: 없으면 발급 */
export async function ensureVoterToken() {
  const store = await cookies()
  const existing = store.get(COOKIE)?.value
  if (existing) return existing
  const token = createId(21)
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
  return token
}
