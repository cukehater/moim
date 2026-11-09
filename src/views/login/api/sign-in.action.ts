'use server'

import { signIn } from '@/shared/auth'

export async function signInWithGoogle() {
  await signIn('google', { redirectTo: '/dashboard' })
}
