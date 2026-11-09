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
      <div className="overflow-hidden rounded-2xl">
        <Thumbnail publicId={value} alt="썸네일 미리보기" sizes="(max-width: 500px) 100vw, 500px" />
      </div>
      <div className="flex gap-2">
        <CldUploadWidget
          options={{
            multiple: false,
            maxFiles: 1,
            sources: ['local', 'camera'],
            resourceType: 'image',
            clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'heic'],
            maxFileSize: 10_000_000,
            cropping: true,
            croppingAspectRatio: 16 / 9,
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
            <Button type="button" variant="secondary" className="flex-1" disabled={isLoading} onClick={() => open()}>
              <ImagePlus aria-hidden />
              {value ? '썸네일 바꾸기' : '썸네일 올리기'}
            </Button>
          )}
        </CldUploadWidget>
        {value && (
          <Button type="button" variant="ghost" onClick={() => onChange(null)}>
            <X aria-hidden />
            삭제
          </Button>
        )}
      </div>
    </div>
  )
}
