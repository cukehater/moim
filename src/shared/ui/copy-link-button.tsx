'use client'

import { Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from './button'

export function CopyLinkButton({ path, className }: { path: string; className?: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(new URL(path, location.origin).href)
      toast.success('링크를 복사했어요')
    } catch {
      toast.error('복사하지 못했어요. 주소창의 링크를 직접 복사해 주세요')
    }
  }
  return (
    <Button type="button" variant="secondary" onClick={copy} className={className}>
      <Link2 aria-hidden />
      링크 복사
    </Button>
  )
}
