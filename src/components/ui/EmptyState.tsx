import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  title: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
  className?: string
}

export function EmptyState({ title, description, action, icon, className }: Props) {
  return (
    <div
      className={cn(
        'rounded-lg border border-dashed border-line-strong/60 bg-surface/40 px-8 py-12 text-center',
        className,
      )}
    >
      {icon && (
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-tonton-500/10 text-tonton-500">
          {icon}
        </div>
      )}
      <h3 className="display text-lg text-ink">{title}</h3>
      {description && (
        <p className="text-sm text-ink-soft max-w-sm mx-auto mt-1.5 leading-snug">{description}</p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}
