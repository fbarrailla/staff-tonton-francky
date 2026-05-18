import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Sun, Moon, LogOut, ChevronDown, Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from './ui/Avatar'
import { GlobalSearch } from './GlobalSearch'
import { cn } from '@/lib/utils'
import { useFormatLongDate, useLang } from '@/hooks/useLocale'
import { todayISO } from '@/lib/utils'

interface Props {
  title?: ReactNode
  eyebrow?: ReactNode
}

export function Topbar({ title, eyebrow }: Props) {
  const { t } = useTranslation()
  const { theme, toggle } = useTheme()
  const { user, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [lang, setLang] = useLang()
  const formatLongDate = useFormatLongDate()

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur">
      <div className="flex items-center gap-4 px-5 lg:px-8 h-16">
        <div className="min-w-0 flex-1 flex items-center gap-4">
          <div className="lg:hidden flex items-center gap-2.5">
            <div className="grid place-items-center h-8 w-8 rounded-md bg-tonton-500 text-white font-display font-bold text-[13px]">
              tF
            </div>
            <span className="font-display text-[15px] text-ink">Staff</span>
          </div>
          <div className="hidden lg:block min-w-0">
            {eyebrow && (
              <div className="label-caps mb-0.5">{eyebrow}</div>
            )}
            {title ? (
              <h1 className="display text-[20px] leading-none text-ink truncate">{title}</h1>
            ) : (
              <div className="text-[13px] text-ink-soft tabular tracking-tightish">
                {formatLongDate(todayISO())}
              </div>
            )}
          </div>
        </div>

        <GlobalSearch />

        {/* Language switcher */}
        <div className="inline-flex items-center bg-surface border border-line rounded-md p-0.5 h-9">
          <Globe size={13} className="text-ink-faint mx-1.5 hidden sm:block" />
          {(['fr', 'en'] as const).map((code) => (
            <button
              key={code}
              onClick={() => void setLang(code)}
              className={cn(
                'h-7 px-2 text-[11px] font-medium rounded uppercase tracking-widish transition-colors',
                lang === code
                  ? 'bg-paper text-ink shadow-soft'
                  : 'text-ink-faint hover:text-ink',
              )}
              aria-pressed={lang === code}
              aria-label={t(`lang.${code}`)}
            >
              {code}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={toggle}
          aria-label={theme === 'dark' ? t('topbar.to_light') : t('topbar.to_dark')}
          className="grid place-items-center h-9 w-9 rounded-md border border-line bg-surface text-ink-soft hover:text-ink hover:border-line-strong transition-colors"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <div className="hidden md:block h-7 w-px bg-line" />

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 h-9 pl-1 pr-2.5 rounded-md hover:bg-surface transition-colors"
          >
            <Avatar name={user?.display_name ?? user?.email ?? '?'} size={28} />
            <div className="hidden md:flex flex-col items-start leading-tight">
              <span className="text-[12.5px] font-medium text-ink truncate max-w-[140px]">
                {user?.display_name || user?.email}
              </span>
              <span className="text-[10.5px] text-ink-faint tracking-tightish">
                {t('topbar.connected')}
              </span>
            </div>
            <ChevronDown size={13} className="text-ink-faint" />
          </button>

          {menuOpen && (
            <>
              <button
                className="fixed inset-0 z-30"
                onClick={() => setMenuOpen(false)}
                aria-hidden
              />
              <div
                className={cn(
                  'absolute right-0 top-full mt-2 z-40 w-64 rounded-lg border border-line bg-paper shadow-raise overflow-hidden animate-pop origin-top-right',
                )}
              >
                <div className="px-4 py-3 border-b border-line">
                  <div className="text-[12.5px] font-medium text-ink truncate">
                    {user?.display_name}
                  </div>
                  <div className="text-[11.5px] text-ink-faint truncate">{user?.email}</div>
                </div>
                <div className="p-1">
                  <Link
                    to="/reglages"
                    onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2 text-[13px] rounded text-ink-soft hover:bg-surface hover:text-ink"
                  >
                    {t('topbar.settings')}
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      void signOut()
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[13px] rounded text-ink-soft hover:bg-surface hover:text-sick"
                  >
                    <LogOut size={14} /> {t('topbar.logout')}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
