import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { format, parseISO, type Locale } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import type { Lang } from '@/i18n'

const map: Record<Lang, Locale> = { fr, en: enUS }

export function useDateLocale() {
  const { i18n } = useTranslation()
  const lng = (i18n.resolvedLanguage as Lang) || 'fr'
  return map[lng] ?? fr
}

export function useFormatDate() {
  const locale = useDateLocale()
  return useMemo(
    () => (iso: string, pattern = 'd MMM yyyy') => {
      try {
        return format(parseISO(iso), pattern, { locale })
      } catch {
        return iso
      }
    },
    [locale],
  )
}

export function useFormatLongDate() {
  const fmt = useFormatDate()
  return useMemo(() => (iso: string) => fmt(iso, 'EEEE d MMMM yyyy'), [fmt])
}

export function useLang(): [Lang, (l: Lang) => Promise<unknown>] {
  const { i18n } = useTranslation()
  const current = (i18n.resolvedLanguage as Lang) || 'fr'
  const set = (l: Lang) => i18n.changeLanguage(l)
  return [current, set]
}
