import { type ReactNode, ViewTransition } from 'react'

const SLIDE = { 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }

/** 운영자 화면 전환: 앞으로 가는 링크는 왼쪽으로, 뒤로 가는 링크는 오른쪽으로 밀림. 브라우저 뒤로가기는 타입이 없어 전환 없음 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter={SLIDE} exit={SLIDE} default="none">
      {children}
    </ViewTransition>
  )
}
