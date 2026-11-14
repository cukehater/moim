"use client"

import { CircleAlert, CircleCheck, CircleX, Info, Loader2Icon } from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

// 하단 고정 버튼(약 70px) 위에 뜨도록
const BOTTOM = "calc(84px + env(safe-area-inset-bottom))"

/** 잉크색 토스트: 결과를 색 아이콘으로 바로 구분 (성공 초록 · 실패 빨강 · 주의 주황) */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="bottom-center"
      offset={{ bottom: BOTTOM }}
      mobileOffset={{ bottom: BOTTOM, left: 20, right: 20 }}
      gap={8}
      icons={{
        success: <CircleCheck className="size-[1.125rem] fill-emerald-400 text-gray-900" strokeWidth={2.5} />,
        info: <Info className="size-[1.125rem] fill-sky-400 text-gray-900" strokeWidth={2.5} />,
        warning: <CircleAlert className="size-[1.125rem] fill-amber-400 text-gray-900" strokeWidth={2.5} />,
        error: <CircleX className="size-[1.125rem] fill-red-400 text-gray-900" strokeWidth={2.5} />,
        loading: <Loader2Icon className="size-[1.125rem] animate-spin text-white/70" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-center gap-2.5 rounded-xl bg-gray-900/95 px-4 py-3 text-white shadow-[0_8px_24px_-6px_rgb(24_25_27/0.45)] backdrop-blur-md",
          icon: "flex shrink-0 items-center",
          title: "text-sub font-medium",
          description: "text-caption text-white/70",
          actionButton: "ml-auto shrink-0 rounded-full bg-white/15 px-3 py-1 text-caption font-semibold",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
