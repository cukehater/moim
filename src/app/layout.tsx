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

// 숫자(0~9)만 Open Sans: 숫자 글리프만 담은 서브셋 + unicode-range로 한글·영문은 Pretendard 그대로
const openSansDigits = localFont({
  src: './fonts/OpenSansDigits.subset.woff2',
  variable: '--font-digits',
  weight: '300 800',
  display: 'swap',
  declarations: [{ prop: 'unicode-range', value: 'U+0030-0039' }],
  adjustFontFallback: false,
})

const DESCRIPTION = '참석 여부, 한 번에 모아요'

// 아이콘·OG 이미지는 app/ 파일 규칙(icon.svg, apple-icon.png, opengraph-image.png 등)으로 자동 등록
export const metadata: Metadata = {
  title: 'MOIM',
  description: DESCRIPTION,
  openGraph: { title: 'MOIM', description: DESCRIPTION, siteName: 'MOIM', locale: 'ko_KR', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'MOIM', description: DESCRIPTION },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
}

export function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={`${openSansDigits.variable} ${pretendard.variable}`}>
      <body>
        <div className="@container/shell mx-auto min-h-dvh w-full max-w-[500px] bg-white">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  )
}
