import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  side?: 'right' | 'center'
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  side = 'center',
  size = 'md',
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex animate-fade-in"
         style={side === 'center' ? { padding: '4vh 1rem' } : undefined}>
      <button
        className="absolute inset-0 bg-warm-900/40 dark:bg-warm-900/70 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Fermer"
      />
      <div
        ref={panelRef}
        className={cn(
          'relative bg-paper border border-line shadow-raise overflow-hidden',
          side === 'center'
            ? cn('m-auto w-full rounded-xl animate-pop', sizeMap[size])
            : 'ml-auto h-full w-full max-w-lg rounded-l-xl animate-fade-up flex flex-col',
        )}
      >
        {(title || description) && (
          <header className="px-6 pt-6 pb-4 border-b border-line">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                {title && (
                  <h2 className="display text-[22px] leading-tight text-ink">{title}</h2>
                )}
                {description && (
                  <p className="text-[13px] text-ink-soft mt-1 leading-snug">{description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-ink-faint hover:text-ink rounded p-1.5 -mt-1 -mr-1"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>
          </header>
        )}
        <div className={cn('px-6 py-5', side === 'right' && 'flex-1 overflow-y-auto nice-scroll')}>
          {children}
        </div>
        {footer && (
          <footer className="px-6 py-4 border-t border-line bg-surface/60 flex items-center justify-end gap-2">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  )
}
