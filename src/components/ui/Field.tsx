import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from '@/lib/utils'

interface BaseProps {
  label?: string
  hint?: string
  error?: string
  className?: string
  iconLeft?: ReactNode
  iconRight?: ReactNode
}

const inputBase =
  'w-full bg-paper border border-line rounded-md text-sm text-ink placeholder:text-ink-faint ' +
  'focus:border-tonton-500 focus:outline-none focus:ring-0 transition-colors'

export const Input = forwardRef<HTMLInputElement, BaseProps & InputHTMLAttributes<HTMLInputElement>>(
  function Input({ label, hint, error, className, iconLeft, iconRight, id, ...props }, ref) {
    const inputId = id ?? props.name
    return (
      <label className={cn('block', className)} htmlFor={inputId}>
        {label && (
          <span className="block text-[12px] font-medium text-ink-soft mb-1.5 tracking-tightish">
            {label}
          </span>
        )}
        <div className="relative">
          {iconLeft && (
            <span className="absolute inset-y-0 left-3 grid place-items-center text-ink-faint pointer-events-none">
              {iconLeft}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              inputBase,
              'h-10',
              iconLeft && 'pl-9',
              iconRight && 'pr-9',
              !iconLeft && !iconRight && 'px-3',
              iconLeft && !iconRight && 'pr-3',
              !iconLeft && iconRight && 'pl-3',
              error && 'border-sick focus:border-sick',
            )}
            {...props}
          />
          {iconRight && (
            <span className="absolute inset-y-0 right-3 grid place-items-center text-ink-faint">
              {iconRight}
            </span>
          )}
        </div>
        {(hint || error) && (
          <span
            className={cn(
              'mt-1.5 block text-[12px]',
              error ? 'text-sick' : 'text-ink-faint',
            )}
          >
            {error ?? hint}
          </span>
        )}
      </label>
    )
  },
)

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ label, hint, error, className, id, ...props }, ref) {
  const inputId = id ?? props.name
  return (
    <label className={cn('block', className)} htmlFor={inputId}>
      {label && (
        <span className="block text-[12px] font-medium text-ink-soft mb-1.5 tracking-tightish">
          {label}
        </span>
      )}
      <textarea
        ref={ref}
        id={inputId}
        className={cn(inputBase, 'min-h-[88px] px-3 py-2 resize-y leading-snug', error && 'border-sick')}
        {...props}
      />
      {(hint || error) && (
        <span
          className={cn(
            'mt-1.5 block text-[12px]',
            error ? 'text-sick' : 'text-ink-faint',
          )}
        >
          {error ?? hint}
        </span>
      )}
    </label>
  )
})

export const Select = forwardRef<
  HTMLSelectElement,
  BaseProps & SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ label, hint, error, className, id, children, ...props }, ref) {
  const inputId = id ?? props.name
  return (
    <label className={cn('block', className)} htmlFor={inputId}>
      {label && (
        <span className="block text-[12px] font-medium text-ink-soft mb-1.5 tracking-tightish">
          {label}
        </span>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={inputId}
          className={cn(
            inputBase,
            'h-10 px-3 pr-9 appearance-none cursor-pointer',
            error && 'border-sick',
          )}
          {...props}
        >
          {children}
        </select>
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {(hint || error) && (
        <span
          className={cn(
            'mt-1.5 block text-[12px]',
            error ? 'text-sick' : 'text-ink-faint',
          )}
        >
          {error ?? hint}
        </span>
      )}
    </label>
  )
})
