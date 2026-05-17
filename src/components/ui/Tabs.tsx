import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TabItem<T extends string> {
  value: T
  label: ReactNode
  count?: number
}
interface Props<T extends string> {
  value: T
  onChange: (value: T) => void
  items: TabItem<T>[]
  className?: string
}

export function Tabs<T extends string>({ value, onChange, items, className }: Props<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex p-1 bg-surface rounded-md border border-line gap-0.5',
        className,
      )}
    >
      {items.map((it) => {
        const active = it.value === value
        return (
          <button
            key={it.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.value)}
            className={cn(
              'inline-flex items-center gap-1.5 h-8 px-3 text-[13px] font-medium rounded transition-colors',
              active
                ? 'bg-paper text-ink shadow-soft'
                : 'text-ink-soft hover:text-ink',
            )}
          >
            {it.label}
            {typeof it.count === 'number' && (
              <span
                className={cn(
                  'tabular text-[11px] rounded px-1.5 py-0.5',
                  active ? 'bg-surface text-ink-soft' : 'bg-paper text-ink-faint',
                )}
              >
                {it.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
