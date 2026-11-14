import type { Viewport } from 'next'

// 운영자 화면 인풋은 14px: iOS 포커스 자동 확대를 막음 (투표자 페이지는 16px 인풋으로 대응)
export const viewport: Viewport = { maximumScale: 1 }

export default function DashboardLayout({ children }: LayoutProps<'/dashboard'>) {
  return children
}
