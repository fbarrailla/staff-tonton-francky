import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  label: string
  onRemove?: () => void
  selected?: boolean
  onClick?: () => void
  className?: string
}

export function SkillChip({ label, onRemove, selected, onClick, className }: Props) {
  const interactive = !!onClick || !!onRemove
  return (
    <span
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-full text-[12px] px-2.5 py-1',
        'border tracking-tightish',
        selected
          ? 'border-tonton-500 bg-tonton-500/10 text-tonton-700 dark:text-tonton-300'
          : 'border-line bg-surface text-ink-soft hover:text-ink',
        interactive && 'cursor-pointer transition-colors',
        className,
      )}
    >
      {label}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="text-ink-faint hover:text-sick rounded-full -mr-1"
          aria-label={`Retirer ${label}`}
        >
          <X size={12} />
        </button>
      )}
    </span>
  )
}
