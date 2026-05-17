import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle'
type Size = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  iconLeft?: ReactNode
  iconRight?: ReactNode
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-tonton-500 text-white hover:bg-tonton-600 active:bg-tonton-700 shadow-soft border border-tonton-600/40',
  secondary:
    'bg-raised text-ink border border-line hover:border-line-strong hover:bg-surface',
  ghost:
    'text-ink-soft hover:text-ink hover:bg-surface',
  subtle:
    'bg-surface text-ink border border-transparent hover:border-line',
  danger:
    'bg-sick text-white hover:bg-sick/90 border border-sick/40 shadow-soft',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded',
  md: 'h-10 px-4 text-sm gap-2 rounded-md',
  lg: 'h-12 px-5 text-[15px] gap-2 rounded-lg',
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = 'secondary', size = 'md', iconLeft, iconRight, loading, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium tracking-tightish select-none',
        'transition-[background,color,border,box-shadow,transform] duration-150 ease-out-quart',
        'disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-px',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <span className="size-3.5 rounded-full border-2 border-current/30 border-t-current animate-spin" />
      ) : (
        iconLeft
      )}
      {children}
      {iconRight}
    </button>
  )
})
