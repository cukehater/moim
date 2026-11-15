'use client'

import { CldUploadWidget } from 'next-cloudinary'
import { ImagePlus, X } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Thumbnail } from '@/shared/ui/thumbnail'
import { signUploadParams } from '../api/sign-upload.action'

type Props = { value: string | null; onChange: (publicId: string | null) => void }

export function ThumbnailUpload({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div className="relative overflow-hidden rounded-lg border border-gray-200">
        {/* 바로 아래 버튼이 설명하므로 장식용 alt */}
        <Thumbnail publicId={value} alt="" sizes="(max-width: 500px) 100vw, 500px" />
        {value && (
          <button
            type="button"
            aria-label="썸네일 삭제"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-gray-900/60 text-white backdrop-blur-sm transition-colors after:absolute after:-inset-1.5 hover:bg-gray-900/80"
          >
            <X className="size-4" strokeWidth={2.25} aria-hidden />
          </button>
        )}
      </div>
      <div>
        <CldUploadWidget
          options={{
            multiple: false,
            maxFiles: 1,
            sources: ['local', 'camera'],
            resourceType: 'image',
            clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'heic'],
            // 큰 사진도 받음: 프리셋(c_crop,g_custom/c_limit,w_1600,h_1600,q_auto:good + webp)이
            // 저장 전에 자른 영역만 남기고 긴 변 1600px·webp로 줄임 (보통 수백 KB)
            uploadPreset: 'moim_thumbnail',
            maxFileSize: 10_000_000, // Cloudinary 무료 플랜 이미지 한도
            // 업로드 전에 브라우저에서 먼저 줄임: 모바일 업로드량 감소, 무료 플랜 해상도 한도(약 25MP) 회피
            maxImageWidth: 2400,
            maxImageHeight: 2400,
            cropping: true,
            croppingAspectRatio: 1200 / 630,
            showSkipCropButton: false,
            language: 'ko',
            // 서명은 서버 액션에서만 발급 (route handler 없이)
            uploadSignature: (cb: (signature: string) => void, params: Record<string, string | number>) => {
              signUploadParams(params).then(cb)
            },
          }}
          onSuccess={(result) => {
            if (typeof result.info === 'object' && result.info?.public_id) onChange(result.info.public_id)
          }}
        >
          {({ open, isLoading }) => (
            <Button type="button" variant="secondary" className="w-full" disabled={isLoading} onClick={() => open()}>
              <ImagePlus aria-hidden />
              {value ? '썸네일 바꾸기' : '썸네일 올리기'}
            </Button>
          )}
        </CldUploadWidget>
        <p className="pt-1.5 text-caption text-gray-600">10MB 이하 사진은 자동으로 가볍게 바꿔서 올려요.</p>
      </div>
    </div>
  )
}
