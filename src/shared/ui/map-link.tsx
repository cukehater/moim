'use client'

import { cn } from '@/shared/lib/cn'
import { mapHrefs } from '@/shared/lib/map'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'

type Props = {
  location: string
  naverMapUrl: string | null
  kakaoMapUrl: string | null
}

// 두 로고 모두 마커가 이미지 높이의 77%라 같은 크기로 그리면 마커 크기가 같음
// 네이버 로고는 흰 바탕이라 윤곽선을 둘러 카카오 노란 타일과 같은 앱 아이콘 무게로 맞춤
const APPS = [
  { key: 'naver', label: '네이버 지도', src: '/images/naver_map.webp', tile: 'ring-1 ring-gray-200' },
  { key: 'kakao', label: '카카오맵', src: '/images/kakao_map.webp', tile: '' },
] as const

/** 장소명을 누르면 어느 지도 앱으로 열지 고르는 모달 */
export function MapLink({ location, naverMapUrl, kakaoMapUrl }: Props) {
  const hrefs = mapHrefs(location, naverMapUrl, kakaoMapUrl)
  return (
    <Dialog>
      <DialogTrigger className="rounded-sm text-left underline decoration-gray-300 underline-offset-4 outline-none hover:decoration-gray-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
        {location}
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>어떤 앱으로 장소를 볼까요?</DialogTitle>
        </DialogHeader>
        {/* 두 버튼 폭은 긴 쪽(네이버 지도)에 맞춰 같게 */}
        <DialogFooter className="mx-auto grid w-fit grid-cols-2">
          {APPS.map((app) => (
            // 보이는 높이 36px, 누르는 영역은 위아래로 넓혀 44px
            <Button
              key={app.key}
              asChild
              variant="outline"
              className="relative h-9 gap-1.5 px-3 after:absolute after:-inset-y-1 after:inset-x-0"
            >
              <a href={hrefs[app.key]} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element -- 작은 정적 로고 */}
                <img src={app.src} alt="" width={20} height={20} className={cn('size-5 rounded-[5px]', app.tile)} />
                {app.label}
              </a>
            </Button>
          ))}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
