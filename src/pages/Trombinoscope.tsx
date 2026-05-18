import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X, UsersRound, ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Layout } from '@/components/Layout'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { useEmployees } from '@/hooks/useStore'
import { useRoleLabel } from '@/hooks/useLabels'
import { avatarColors, cn } from '@/lib/utils'

export function TrombinoscopePage() {
  const { t } = useTranslation()
  const employees = useEmployees()
  const roleLabel = useRoleLabel()

  const ordered = useMemo(
    () => [...employees].sort((a, b) => a.full_name.localeCompare(b.full_name)),
    [employees],
  )

  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const current = openIndex !== null ? ordered[openIndex] : null

  const prev = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i - 1 + ordered.length) % ordered.length)),
    [ordered.length],
  )
  const next = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i + 1) % ordered.length)),
    [ordered.length],
  )
  const close = useCallback(() => setOpenIndex(null), [])

  // Keyboard nav when fullscreen
  useEffect(() => {
    if (openIndex === null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [openIndex, close, prev, next])

  return (
    <Layout eyebrow={t('trombinoscope.eyebrow')} title={t('trombinoscope.title')}>
      <p className="text-[14px] text-ink-soft max-w-[60ch] mb-6">{t('trombinoscope.intro')}</p>

      {ordered.length === 0 ? (
        <EmptyState
          icon={<UsersRound size={20} />}
          title={t('trombinoscope.empty_title')}
          description={t('trombinoscope.empty_desc')}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {ordered.map((e, idx) => {
            const [c1, c2] = avatarColors(e.full_name)
            return (
              <button
                key={e.id}
                onClick={() => setOpenIndex(idx)}
                className={cn(
                  'group relative aspect-[3/4] rounded-xl overflow-hidden',
                  'border border-line shadow-soft hover:shadow-raise transition-all',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-tonton-500/40',
                )}
              >
                {e.avatar_url ? (
                  <img
                    src={e.avatar_url}
                    alt={e.full_name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div
                    className="absolute inset-0 grid place-items-center transition-transform duration-500 group-hover:scale-[1.03]"
                    style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                  >
                    <span className="font-display text-white text-[clamp(40px,8vw,84px)] font-bold tracking-tightish leading-none drop-shadow-sm">
                      {e.full_name
                        .split(/\s+/)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((s) => s[0]?.toUpperCase() ?? '')
                        .join('')}
                    </span>
                  </div>
                )}

                {/* Bottom gradient + text */}
                <div className="absolute inset-x-0 bottom-0 pt-12 pb-3 px-3 bg-gradient-to-t from-warm-900/85 via-warm-900/45 to-transparent text-white">
                  <div className="display text-[15px] leading-tight truncate">{e.full_name}</div>
                  <div className="text-[11.5px] opacity-80 truncate tracking-tightish">
                    {roleLabel(e.role)}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {current && openIndex !== null && (
        <FullscreenViewer
          employee={current}
          index={openIndex}
          total={ordered.length}
          onClose={close}
          onPrev={prev}
          onNext={next}
          roleLabel={roleLabel}
        />
      )}
    </Layout>
  )
}

function FullscreenViewer({
  employee, index, total, onClose, onPrev, onNext, roleLabel,
}: {
  employee: ReturnType<typeof useEmployees>[number]
  index: number
  total: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  roleLabel: (r: ReturnType<typeof useEmployees>[number]['role']) => string
}) {
  const { t } = useTranslation()
  const [c1, c2] = avatarColors(employee.full_name)
  const initials = employee.full_name
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '').join('')

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-warm-900/95 dark:bg-warm-900/97 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={employee.full_name}
    >
      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between gap-4 px-5 lg:px-10 py-5">
        <div className="text-[11px] uppercase tracking-caps text-warm-100/70 tabular">
          {t('trombinoscope.counter', { current: index + 1, total })}
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/equipe/${employee.id}`}
            onClick={onClose}
            className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-warm-100/10 hover:bg-warm-100/20 text-warm-100 text-[12.5px] font-medium tracking-tightish transition-colors"
          >
            <ExternalLink size={13} /> {t('trombinoscope.view_profile')}
          </Link>
          <button
            onClick={onClose}
            className="grid place-items-center h-10 w-10 rounded-full bg-warm-100/10 hover:bg-warm-100/20 text-warm-100 transition-colors"
            aria-label={t('trombinoscope.close')}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Prev / Next */}
      <button
        onClick={onPrev}
        className="absolute left-3 lg:left-6 top-1/2 -translate-y-1/2 z-10 grid place-items-center h-12 w-12 rounded-full bg-warm-100/10 hover:bg-warm-100/20 text-warm-100 transition-colors"
        aria-label={t('trombinoscope.prev')}
      >
        <ChevronLeft size={22} />
      </button>
      <button
        onClick={onNext}
        className="absolute right-3 lg:right-6 top-1/2 -translate-y-1/2 z-10 grid place-items-center h-12 w-12 rounded-full bg-warm-100/10 hover:bg-warm-100/20 text-warm-100 transition-colors"
        aria-label={t('trombinoscope.next')}
      >
        <ChevronRight size={22} />
      </button>

      {/* Centerpiece — photo + caption card */}
      <div
        key={employee.id}
        className="absolute inset-0 flex flex-col items-center justify-center gap-6 lg:gap-8 px-8 lg:px-20 py-24 animate-fade-up"
      >
        <div className="relative w-full max-w-[min(82vh,560px)] aspect-square rounded-2xl overflow-hidden shadow-raise">
          {employee.avatar_url ? (
            <img
              src={employee.avatar_url}
              alt={employee.full_name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div
              className="absolute inset-0 grid place-items-center"
              style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
            >
              <span className="font-display text-white font-bold tracking-tightish text-[clamp(96px,18vw,240px)] leading-none drop-shadow-md">
                {initials}
              </span>
            </div>
          )}
        </div>

        <div className="text-center text-warm-100 max-w-2xl">
          <div className="text-[11px] uppercase tracking-caps text-warm-100/60 mb-2">
            {roleLabel(employee.role)}
          </div>
          <h2 className="display text-[clamp(28px,4vw,44px)] leading-tight text-balance">
            {employee.full_name}
          </h2>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[13px] text-warm-100/70">
            <span className="truncate">{employee.email}</span>
            {employee.phone && <span className="tabular">{employee.phone}</span>}
          </div>
          {employee.skills.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              {employee.skills.slice(0, 6).map((s) => (
                <span
                  key={s}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-warm-100/10 text-warm-100/85"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Click-anywhere-on-empty-space to close (background) */}
      <button
        onClick={onClose}
        className="absolute inset-0 -z-10"
        aria-hidden
        tabIndex={-1}
      />
    </div>,
    document.body,
  )
}
