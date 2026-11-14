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
            maxFileSize: 1_000_000, // 1MB
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
        <p className="pt-1.5 text-caption text-gray-600">1MB 이하 이미지만 올릴 수 있어요.</p>
      </div>
    </div>
  )
}
