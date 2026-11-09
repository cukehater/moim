import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import type { ReactNode } from 'react'
import { Toaster } from '@/shared/ui/sonner'
import './globals.css'

// KS X 1001 한글 2,350자 + ASCII 서브셋 (Pretendard Variable)
const pretendard = localFont({
  src: './fonts/PretendardVariable.subset.woff2',
  variable: '--font-pretendard',
  weight: '45 920',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'MOIM',
  description: '언제 시간 되세요? 링크 하나로 모임 날짜를 정해요.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
}

export function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body>
        <div className="@container/shell mx-auto min-h-dvh w-full max-w-[640px] bg-background shadow-[0_0_0_1px_var(--border)]">
          {children}
        </div>
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
