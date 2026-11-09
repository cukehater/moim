import { Suspense } from 'react'
import { Button } from '@/shared/ui/button'
import { signInWithGoogle } from '../api/sign-in.action'

export function LoginPage({ searchParams }: PageProps<'/login'>) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6">
      <div className="flex flex-col items-center gap-2">
        <p className="text-4xl font-extrabold tracking-tight">MOIM</p>
        <p className="text-muted-foreground">운영자 로그인</p>
      </div>
      <form action={signInWithGoogle} className="w-full">
        <Button type="submit" size="lg" className="w-full">
          Google로 로그인
        </Button>
      </form>
      <Suspense>
        <LoginError searchParams={searchParams} />
      </Suspense>
    </main>
  )
}

async function LoginError({ searchParams }: Pick<PageProps<'/login'>, 'searchParams'>) {
  const { error } = await searchParams
  if (!error) return null
  return (
    <p role="alert" className="text-sm text-destructive">
      {error === 'AccessDenied' ? '운영자 계정만 로그인할 수 있어요' : '로그인하지 못했어요. 다시 시도해 주세요'}
    </p>
  )
}
