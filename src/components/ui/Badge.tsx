import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'approved' | 'pending' | 'rejected' | 'sick' | 'working' | 'neutral'

interface Props {
  tone?: Tone
  children: ReactNode
  className?: string
  dot?: boolean
}

const styles: Record<Tone, string> = {
  approved: 'bg-tonton-500/12 text-tonton-700 dark:text-tonton-300 ring-tonton-500/30',
  pending: 'bg-pending/12 text-pending ring-pending/30',
  rejected: 'bg-rejected/15 text-rejected ring-rejected/30',
  sick: 'bg-sick/12 text-sick ring-sick/30',
  working: 'bg-working/12 text-working ring-working/30',
  neutral: 'bg-surface text-ink-soft ring-line',
}

const dotColors: Record<Tone, string> = {
  approved: 'bg-tonton-500',
  pending: 'bg-pending',
  rejected: 'bg-rejected',
  sick: 'bg-sick',
  working: 'bg-working',
  neutral: 'bg-ink-faint',
}

export function Badge({ tone = 'neutral', children, className, dot }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium tracking-tightish',
        'ring-1 ring-inset',
        styles[tone],
        className,
      )}
    >
      {dot && <span className={cn('size-1.5 rounded-full', dotColors[tone])} />}
      {children}
    </span>
  )
}
