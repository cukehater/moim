export function NotFoundPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-2 px-6 text-center">
      <p className="text-5xl font-extrabold tracking-tight text-muted-foreground/50">404</p>
      <h1 className="text-lg font-semibold">모임을 찾을 수 없어요</h1>
      <p className="text-sm text-muted-foreground">링크가 잘못됐거나 삭제된 모임이에요.</p>
    </main>
  )
}
