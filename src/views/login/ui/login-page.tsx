import { Suspense } from 'react'
import { Button } from '@/shared/ui/button'
import { signInWithGoogle } from '../api/sign-in.action'

export function LoginPage({ searchParams }: PageProps<'/login'>) {
  return (
    <main className="flex min-h-dvh flex-col bg-white px-5 pt-[28dvh] pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1>
          {/* eslint-disable-next-line @next/next/no-img-element -- 정적 SVG 로고 */}
          <img src="/logo.svg" alt="MOIM" width={316} height={100} className="h-14 w-auto" />
        </h1>
        <p className="mt-1 text-body text-gray-500">참석 여부, 한 번에 모아요</p>
      </div>
      <div className="mt-auto flex flex-col gap-3">
        <Suspense>
          <LoginError searchParams={searchParams} />
        </Suspense>
        <form action={signInWithGoogle}>
          <Button type="submit" size="lg" variant="secondary" className="w-full">
            <GoogleMark />
            Google로 계속하기
          </Button>
        </form>
        <p className="text-center text-caption text-gray-500">운영자 계정만 로그인할 수 있어요</p>
      </div>
    </main>
  )
}

async function LoginError({ searchParams }: Pick<PageProps<'/login'>, 'searchParams'>) {
  const { error } = await searchParams
  if (!error) return null
  return (
    <p role="alert" className="rounded-xl bg-white px-4 py-3 text-sub text-destructive">
      {error === 'AccessDenied' ? '운영자 계정만 로그인할 수 있어요' : '로그인하지 못했어요. 다시 시도해 주세요'}
    </p>
  )
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}
