import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// globals.css의 커스텀 타입 스케일을 font-size로 등록 (미등록 시 text-white 같은 색 클래스를 지워버림)
const twMerge = extendTailwindMerge({
  extend: { classGroups: { 'font-size': [{ text: ['title', 'heading', 'body', 'sub', 'caption', 'input-safe'] }] } },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
