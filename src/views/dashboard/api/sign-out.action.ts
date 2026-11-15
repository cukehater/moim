'use server'

import { signOut } from '@/shared/auth'

export async function signOutToLogin() {
  await signOut({ redirectTo: '/login' })
}
