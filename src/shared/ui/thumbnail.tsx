import { ImageIcon } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

type Props = {
  publicId: string | null
  alt: string
  sizes: string
  priority?: boolean
  /** 가로:세로 (기본 16:9) */
  ratio?: [number, number]
  className?: string
}

const WIDTHS = [390, 640, 828, 1000]

// CldImage 대신 URL 직접 생성: 투표 페이지 초기 JS에서 Cloudinary SDK(~48KB gzip) 제외
const cldUrl = (publicId: string, width: number, [w, h]: [number, number]) =>
  `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,g_auto,ar_${w}:${h},w_${width},f_auto,q_auto/${publicId}`

/** 썸네일 (기본 16:9). 없으면 플레이스홀더 */
export function Thumbnail({ publicId, alt, sizes, priority, ratio = [16, 9], className }: Props) {
  return (
    <div
      className={cn('relative w-full overflow-hidden bg-gray-100', className)}
      style={{ aspectRatio: `${ratio[0]} / ${ratio[1]}` }}
    >
      {publicId ? (
        // eslint-disable-next-line @next/next/no-img-element -- Cloudinary가 f_auto/q_auto로 최적화
        <img
          src={cldUrl(publicId, 640, ratio)}
          srcSet={WIDTHS.map((w) => `${cldUrl(publicId, w, ratio)} ${w}w`).join(', ')}
          sizes={sizes}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <div className="flex size-full items-center justify-center text-gray-300">
          <ImageIcon className="size-[28%] max-w-12" strokeWidth={1.5} aria-hidden />
        </div>
      )}
    </div>
  )
}
