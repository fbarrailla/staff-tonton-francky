import { avatarColors, cn, initials } from '@/lib/utils'

interface Props {
  name: string
  src?: string | null
  size?: number
  className?: string
  ring?: boolean
}

export function Avatar({ name, src, size = 36, className, ring }: Props) {
  const [c1, c2] = avatarColors(name)
  const px = `${size}px`
  return (
    <span
      className={cn(
        'inline-flex shrink-0 overflow-hidden items-center justify-center rounded-full text-white font-medium select-none',
        ring && 'ring-2 ring-paper',
        className,
      )}
      style={{
        width: px,
        height: px,
        background: src ? undefined : `linear-gradient(135deg, ${c1}, ${c2})`,
        fontSize: Math.max(10, Math.round(size * 0.36)),
        letterSpacing: '0.02em',
      }}
      aria-label={name}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className="font-display">{initials(name)}</span>
      )}
    </span>
  )
}
