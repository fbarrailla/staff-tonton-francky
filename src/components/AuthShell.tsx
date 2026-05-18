import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/contexts/ThemeContext'
import { useLang } from '@/hooks/useLocale'
import { cn } from '@/lib/utils'

export function AuthShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const { theme, toggle } = useTheme()
  const [lang, setLang] = useLang()

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <div className="flex items-center justify-between p-6">
        <Link to="/connexion" className="flex items-center gap-2.5">
          <div className="grid place-items-center h-9 w-9 rounded-md bg-tonton-500 text-white font-display font-bold text-sm">
            tF
          </div>
          <span className="font-display text-[15px]">Staff · Tonton Francky</span>
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <div className="inline-flex items-center bg-surface border border-line rounded-md p-0.5">
            {(['fr', 'en'] as const).map((code) => (
              <button
                key={code}
                onClick={() => void setLang(code)}
                className={cn(
                  'h-6 px-2 text-[10.5px] font-medium rounded uppercase tracking-widish transition-colors',
                  lang === code
                    ? 'bg-paper text-ink shadow-soft'
                    : 'text-ink-faint hover:text-ink',
                )}
              >
                {code}
              </button>
            ))}
          </div>
          <button
            onClick={toggle}
            className="text-[12px] text-ink-faint hover:text-ink tracking-tightish"
          >
            {theme === 'dark' ? `☀︎ ${t('topbar.light_mode')}` : `☾ ${t('topbar.dark_mode')}`}
          </button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-6 pb-12">{children}</div>
    </div>
  )
}
