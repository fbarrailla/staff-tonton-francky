import { useState } from 'react'
import { Sun, Moon, LogOut, Database, Languages, Building2, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Layout } from '@/components/Layout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useToast } from '@/contexts/ToastContext'
import { Avatar } from '@/components/ui/Avatar'
import { useLang } from '@/hooks/useLocale'
import type { Lang } from '@/i18n'
import { cn } from '@/lib/utils'

export function SettingsPage() {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const { user, signOut } = useAuth()
  const toast = useToast()
  const [lang, setLang] = useLang()
  const [quota, setQuota] = useState(4)
  const [businessName, setBusinessName] = useState('Tonton Francky')

  return (
    <Layout eyebrow={t('settings.eyebrow')} title={t('settings.title')}>
      <div className="grid lg:grid-cols-[220px_1fr] gap-8">
        <aside className="hidden lg:block">
          <ul className="space-y-1 text-[13px] text-ink-soft sticky top-24">
            <li><a href="#apparence" className="hover:text-ink">{t('settings.nav_appearance')}</a></li>
            <li><a href="#equipe" className="hover:text-ink">{t('settings.nav_team')}</a></li>
            <li><a href="#langue" className="hover:text-ink">{t('settings.nav_language')}</a></li>
            <li><a href="#compte" className="hover:text-ink">{t('settings.nav_account')}</a></li>
            <li><a href="#donnees" className="hover:text-ink">{t('settings.nav_data')}</a></li>
          </ul>
        </aside>

        <div className="space-y-8 max-w-2xl">
          <section id="apparence" className="surface-card p-6">
            <Heading icon={<Sparkles size={14} />}>{t('settings.appearance_title')}</Heading>
            <p className="text-[13px] text-ink-soft mt-1">{t('settings.appearance_intro')}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <ThemeChoice
                active={theme === 'light'}
                onClick={() => setTheme('light')}
                icon={<Sun size={16} />}
                label={t('settings.theme_light')}
                description={t('settings.theme_light_desc')}
                bg="bg-warm-50"
                fg="text-warm-700"
                activeLabel={t('settings.theme_active')}
              />
              <ThemeChoice
                active={theme === 'dark'}
                onClick={() => setTheme('dark')}
                icon={<Moon size={16} />}
                label={t('settings.theme_dark')}
                description={t('settings.theme_dark_desc')}
                bg="bg-warm-800"
                fg="text-warm-100"
                activeLabel={t('settings.theme_active')}
              />
            </div>
          </section>

          <section id="equipe" className="surface-card p-6">
            <Heading icon={<Building2 size={14} />}>{t('settings.team_title')}</Heading>
            <p className="text-[13px] text-ink-soft mt-1">{t('settings.team_intro')}</p>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <Input
                label={t('settings.business_name')}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
              <Input
                label={t('settings.monthly_quota')}
                type="number"
                min={0}
                max={31}
                value={quota}
                onChange={(e) => setQuota(Number(e.target.value))}
                hint={t('settings.monthly_quota_hint')}
              />
            </div>
            <Button
              variant="primary"
              className="mt-5"
              onClick={() => toast.success(t('settings.saved_title'), t('settings.saved_body'))}
            >
              {t('settings.save_btn')}
            </Button>
          </section>

          <section id="langue" className="surface-card p-6">
            <Heading icon={<Languages size={14} />}>{t('settings.language_title')}</Heading>
            <p className="text-[13px] text-ink-soft mt-1">{t('settings.language_intro')}</p>
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              <LangChoice
                active={lang === 'fr'}
                onClick={() => void setLang('fr')}
                code="FR"
                label={t('settings.lang_fr')}
                description={t('settings.lang_fr_desc')}
                activeLabel={t('settings.enabled')}
              />
              <LangChoice
                active={lang === 'en'}
                onClick={() => void setLang('en')}
                code="EN"
                label={t('settings.lang_en')}
                description={t('settings.lang_en_desc')}
                activeLabel={t('settings.enabled')}
              />
            </div>
          </section>

          <section id="compte" className="surface-card p-6">
            <Heading>{t('settings.account')}</Heading>
            <div className="mt-4 flex items-center gap-4 p-4 rounded-md border border-line bg-surface">
              <Avatar name={user?.display_name ?? user?.email ?? '?'} size={48} />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium text-ink truncate">{user?.display_name}</div>
                <div className="text-[12.5px] text-ink-soft truncate">{user?.email}</div>
                <div className="text-[11.5px] text-ink-faint mt-1">{t('settings.connected_via')}</div>
              </div>
              <Button variant="ghost" iconLeft={<LogOut size={14} />} onClick={() => void signOut()}>
                {t('settings.logout')}
              </Button>
            </div>
          </section>

          <section id="donnees" className="surface-card p-6">
            <Heading icon={<Database size={14} />}>{t('settings.data')}</Heading>
            <p className="text-[13px] text-ink-soft mt-1 max-w-prose">{t('settings.data_intro')}</p>
          </section>
        </div>
      </div>
    </Layout>
  )
}

function Heading({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      {icon && <span className="text-tonton-500">{icon}</span>}
      <h2 className="display text-[20px] text-ink">{children}</h2>
    </div>
  )
}

function ThemeChoice({
  active, onClick, icon, label, description, bg, fg, activeLabel,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  description: string
  bg: string
  fg: string
  activeLabel: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-md border p-3 text-left transition-all',
        active ? 'border-tonton-500 shadow-soft' : 'border-line hover:border-line-strong',
      )}
    >
      <span className={cn('grid place-items-center h-10 w-10 rounded-md', bg, fg)}>{icon}</span>
      <span className="min-w-0">
        <span className="block text-[13.5px] font-medium text-ink">{label}</span>
        <span className="block text-[11.5px] text-ink-soft mt-0.5">{description}</span>
      </span>
      {active && <span className="ml-auto text-[11px] text-tonton-500 font-medium tracking-tightish">{activeLabel}</span>}
    </button>
  )
}

function LangChoice({
  active, onClick, code, label, description, activeLabel,
}: {
  active: boolean
  onClick: () => void
  code: string
  label: string
  description: string
  activeLabel: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-md border p-3 text-left transition-all',
        active ? 'border-tonton-500 shadow-soft' : 'border-line hover:border-line-strong',
      )}
    >
      <span className={cn(
        'grid place-items-center h-10 w-10 rounded-md font-display font-bold text-[13px] tracking-tightish',
        active ? 'bg-tonton-500/15 text-tonton-700 dark:text-tonton-300' : 'bg-surface text-ink-soft',
      )}>
        {code}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-medium text-ink">{label}</span>
        <span className="block text-[11.5px] text-ink-soft mt-0.5">{description}</span>
      </span>
      {active && <span className="text-[11px] text-tonton-600 font-medium">{activeLabel}</span>}
    </button>
  )
}
