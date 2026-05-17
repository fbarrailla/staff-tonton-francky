import { cn } from '@/lib/utils'

export function Spinner({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn(
        'inline-block rounded-full border-2 border-current/25 border-t-current animate-spin',
        className,
      )}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Chargement"
    />
  )
}
