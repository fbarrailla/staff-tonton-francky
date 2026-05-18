import { FormEvent, useState } from 'react'
import {
  Sun, Moon, LogOut, Database, Languages, Building2, Sparkles, Lock, Eye, EyeOff, KeyRound,
} from 'lucide-react'
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

            <div className="mt-6 pt-6 border-t border-line">
              <ChangePasswordForm />
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

function ChangePasswordForm() {
  const { t } = useTranslation()
  const { changePassword } = useAuth()
  const toast = useToast()

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!current) errs.current = t('settings.password_err_current')
    if (next.length < 8) errs.next = t('settings.password_err_too_short')
    if (next && confirm && next !== confirm) errs.confirm = t('settings.password_err_mismatch')
    if (current && next && current === next) errs.next = t('settings.password_err_same')
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitting(true)
    const { error } = await changePassword(current, next)
    setSubmitting(false)
    if (error === 'current_invalid') {
      setErrors({ current: t('settings.password_err_current') })
      return
    }
    if (error) {
      toast.error(t('settings.password_title'), error)
      return
    }
    setCurrent('')
    setNext('')
    setConfirm('')
    setErrors({})
    toast.success(t('settings.password_saved_title'), t('settings.password_saved_body'))
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center gap-2">
        <KeyRound size={14} className="text-tonton-500" />
        <h3 className="display text-[17px] text-ink">{t('settings.password_title')}</h3>
      </div>
      <p className="text-[12.5px] text-ink-soft -mt-2 max-w-prose">
        {t('settings.password_intro')}
      </p>

      <Input
        label={t('settings.password_current')}
        type={showCurrent ? 'text' : 'password'}
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        placeholder="••••••••"
        iconLeft={<Lock size={14} />}
        iconRight={
          <button
            type="button"
            onClick={() => setShowCurrent((v) => !v)}
            className="text-ink-faint hover:text-ink"
            aria-label={showCurrent ? t('settings.password_hide') : t('settings.password_show')}
          >
            {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        }
        autoComplete="current-password"
        error={errors.current}
      />

      <div className="grid sm:grid-cols-2 gap-3">
        <Input
          label={t('settings.password_new')}
          type={showNext ? 'text' : 'password'}
          value={next}
          onChange={(e) => setNext(e.target.value)}
          placeholder="••••••••"
          iconLeft={<Lock size={14} />}
          iconRight={
            <button
              type="button"
              onClick={() => setShowNext((v) => !v)}
              className="text-ink-faint hover:text-ink"
              aria-label={showNext ? t('settings.password_hide') : t('settings.password_show')}
            >
              {showNext ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          }
          autoComplete="new-password"
          error={errors.next}
          hint={!errors.next ? t('settings.password_hint') : undefined}
        />
        <Input
          label={t('settings.password_confirm')}
          type={showNext ? 'text' : 'password'}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          iconLeft={<Lock size={14} />}
          autoComplete="new-password"
          error={errors.confirm}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" variant="primary" loading={submitting}>
          {t('settings.password_save')}
        </Button>
      </div>
    </form>
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
