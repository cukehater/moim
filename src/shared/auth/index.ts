import 'server-only'
import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { redirect } from 'next/navigation'
import { env } from '@/shared/config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login', error: '/login' },
  callbacks: {
    signIn: ({ profile }) => profile?.email_verified === true && profile.email === env.ADMIN_EMAIL,
    authorized: ({ auth }) => auth?.user?.email === env.ADMIN_EMAIL,
  },
})

export async function requireAdmin() {
  const session = await auth()
  if (session?.user?.email !== env.ADMIN_EMAIL) redirect('/login')
  return session
}
