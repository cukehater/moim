'use client'

import { Check, Link2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from './button'

export function CopyLinkButton({ path, className }: { path: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  // 복사했다는 표시는 토스트 대신 버튼 자리에서 잠깐만
  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1800)
    return () => clearTimeout(t)
  }, [copied])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(new URL(path, location.origin).href)
      setCopied(true)
    } catch {
      toast.error('복사하지 못했어요. 주소창의 링크를 직접 복사해 주세요')
    }
  }
  return (
    <Button type="button" onClick={copy} className={className}>
      {/* key로 바뀔 때마다 아이콘이 톡 튀어나옴 */}
      <span key={String(copied)} className="flex items-center gap-1.5 animate-in fade-in zoom-in-90 duration-200">
        {copied ? <Check strokeWidth={3} aria-hidden /> : <Link2 aria-hidden />}
        {copied ? '복사했어요' : '링크 복사'}
      </span>
    </Button>
  )
}
