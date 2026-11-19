'use client'

import { CldUploadWidget } from 'next-cloudinary'
import { ImagePlus, X } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Thumbnail } from '@/shared/ui/thumbnail'
import { signUploadParams } from '../api/sign-upload.action'

type Props = { value: string | null; onChange: (publicId: string | null) => void }

// 위젯 내장 번역은 영어뿐이라 language: 'ko'만으로는 영어가 나옴. 쓰는 화면(내 파일·카메라·자르기·업로드 목록) 문구만 번역, 나머지는 영어로 대체됨
// 키 목록: https://upload-widget.cloudinary.com/global/text.json
const KO_TEXT = {
  or: '또는',
  back: '뒤로',
  close: '닫기',
  menu: { files: '내 파일', camera: '카메라', upload_sources: '사진 가져오기' },
  local: {
    browse: '사진 고르기',
    dd_title_single: '사진을 여기로 끌어다 놓으세요',
    dd_title_multi: '사진을 여기로 끌어다 놓으세요',
    drop_title_single: '놓으면 올라가요',
    drop_title_multiple: '놓으면 올라가요',
    choose_files_sr: '또는 올릴 사진 고르기',
  },
  camera: {
    capture: '촬영',
    cancel: '취소',
    take_pic: '사진을 찍어 올려요',
    explanation: '카메라가 연결돼 있고 브라우저에서 카메라 사용을 허용했는지 확인한 뒤 촬영을 눌러 주세요.',
    camera_error: '카메라를 열지 못했어요',
    retry: '다시 시도',
  },
  crop: {
    title: '자르기',
    crop_btn: '자르기',
    skip_btn: '건너뛰기',
    reset_btn: '되돌리기',
    close_btn: '네',
    close_prompt: '닫으면 업로드가 모두 취소돼요. 닫을까요?',
    image_error: '사진을 불러오지 못했어요',
    image_data_error: '파일이 너무 크거나 손상됐을 수 있어요.',
    corner_tooltip: '모서리를 끌어 크기 조절',
    handle_tooltip: '손잡이를 끌어 크기 조절',
  },
  queue: {
    title: '업로드 목록',
    title_uploading_with_counter: '{{num}}개 올리는 중',
    title_processing_with_counter: '{{num}}개 처리 중',
    title_uploading_processing_with_counters: '{{uploading}}개 올리는 중, {{processing}}개 처리 중',
    title_uploading: '올리는 중',
    mini_title: '올렸어요',
    mini_title_uploading: '올리는 중',
    mini_title_processing: '처리 중',
    retry_failed: '실패한 것 다시 시도',
    abort_all: '모두 취소',
    upload_more: '더 올리기',
    done: '완료',
    mini_upload_count: '{{num}}개 올림',
    mini_failed: '{{num}}개 실패',
    statuses: {
      uploading: '올리는 중…',
      processing: '처리 중…',
      error: '오류',
      uploaded: '완료',
      aborted: '취소됨',
    },
  },
  uploader: {
    errors: {
      file_too_large: '파일 크기({{size}})가 최대 크기({{allowed}})를 넘어요',
      max_number_of_files: '한 장만 올릴 수 있어요',
      allowed_formats: 'jpg, png, webp, heic 사진만 올릴 수 있어요',
      max_file_size: '파일이 너무 커요',
      min_file_size: '파일이 너무 작아요',
    },
    close_mid_upload: '올리는 중이에요. 확인을 누르면 업로드가 취소돼요.',
  },
  notifications: { general_error: '문제가 생겼어요. 다시 시도해 주세요.', general_prompt: '정말 할까요?' },
  landscape_overlay: { title: '가로 화면은 지원하지 않아요', description: '세로로 돌려 주세요.' },
}

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
            text: { ko: KO_TEXT },
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
