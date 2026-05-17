import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Search, Sun, Moon, LogOut, ChevronDown, Plus } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from './ui/Avatar'
import { cn, formatLongDate, todayISO } from '@/lib/utils'

interface Props {
  title?: ReactNode
  eyebrow?: ReactNode
}

export function Topbar({ title, eyebrow }: Props) {
  const { theme, toggle } = useTheme()
  const { user, signOut, isMock } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

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

        <div className="hidden md:flex relative w-72 max-w-full">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <input
            type="search"
            placeholder="Rechercher un·e salarié·e, un congé…"
            className="w-full h-9 pl-9 pr-12 text-[13px] rounded-md bg-surface border border-line focus:border-tonton-500 outline-none placeholder:text-ink-faint"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-ink-faint bg-paper border border-line rounded px-1.5 py-0.5">
            ⌘K
          </kbd>
        </div>

        <button
          type="button"
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
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
                {isMock ? 'Démo locale' : 'Connecté·e'}
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
                    Réglages
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      void signOut()
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[13px] rounded text-ink-soft hover:bg-surface hover:text-sick"
                  >
                    <LogOut size={14} /> Se déconnecter
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {isMock && (
        <div className="px-5 lg:px-8 py-1.5 border-t border-line bg-tonton-500/8 text-[11.5px] text-tonton-700 dark:text-tonton-300 tracking-tightish flex items-center gap-2 justify-center">
          <Plus size={11} className="opacity-70" />
          Mode démonstration · les données sont locales (localStorage). Configurez Supabase pour passer en mode réel.
        </div>
      )}
    </header>
  )
}
