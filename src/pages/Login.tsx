import { FormEvent, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { useTheme } from '@/contexts/ThemeContext'
import { useLang } from '@/hooks/useLocale'
import { cn } from '@/lib/utils'

export function Login() {
  const { t } = useTranslation()
  const { user, signIn } = useAuth()
  const { theme, toggle } = useTheme()
  const [lang, setLang] = useLang()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (user) return <Navigate to={from} replace />

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = await signIn(email, password)
    setSubmitting(false)
    if (error) {
      setError(error)
      toast.error(t('auth.sign_in_failed_title'), error)
    } else {
      toast.success(t('auth.welcome_title'), t('auth.welcome_body'))
      navigate(from, { replace: true })
    }
  }

  // Split the multi-line title at the newline
  const [titleA, titleB] = t('auth.title').split('\n')

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-paper">
      {/* Visual side */}
      <div className="hidden lg:flex relative overflow-hidden bg-warm-100 dark:bg-warm-800">
        <div className="absolute inset-0 grid-stripes opacity-40" />
        <div className="absolute -top-32 -left-24 size-[480px] rounded-full bg-tonton-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 size-[420px] rounded-full bg-tonton-500/15 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-2.5">
            <div className="grid place-items-center h-10 w-10 rounded-md bg-tonton-500 text-white font-display font-bold text-base shadow-soft">
              tF
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-caps text-ink-faint">{t('nav.backoffice')}</div>
              <div className="font-display text-[15px] text-ink leading-tight">
                Tonton Francky
              </div>
            </div>
          </div>

          <div className="max-w-md">
            <div className="label-caps mb-3">{t('auth.edition')}</div>
            <h2 className="display text-[clamp(36px,4.4vw,56px)] leading-[0.95] text-ink text-balance">
              {t('auth.team_pre')}<br />
              <span className="text-tonton-600 dark:text-tonton-400">{t('auth.team_post')}</span>
            </h2>
            <p className="text-[15px] text-ink-soft mt-5 max-w-[34ch] leading-relaxed">
              {t('auth.intro')}
            </p>

            <div className="mt-10 flex items-center gap-6 text-[12.5px] text-ink-soft">
              <Stat n="12" label={t('auth.stat_employees')} />
              <span className="h-8 w-px bg-line" />
              <Stat n="4" label={t('auth.stat_days')} />
              <span className="h-8 w-px bg-line" />
              <Stat n={t('auth.service_value')} label={t('auth.stat_service')} />
            </div>
          </div>

          <p className="text-[11.5px] text-ink-faint tracking-tightish">
            {t('auth.footer_quote')}
          </p>
        </div>
      </div>

      {/* Form side */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-6">
          <div className="lg:hidden flex items-center gap-2.5">
            <div className="grid place-items-center h-9 w-9 rounded-md bg-tonton-500 text-white font-display font-bold text-sm">
              tF
            </div>
            <span className="font-display text-[15px]">Staff · Tonton Francky</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {/* Inline FR/EN switch */}
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

        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm">
            <div className="label-caps mb-3">{t('auth.section_label')}</div>
            <h1 className="display text-[34px] leading-tight text-ink">
              {titleA}<br />{titleB}
            </h1>
            <p className="text-[14px] text-ink-soft mt-2 max-w-[32ch]">
              {t('auth.subtitle')}
            </p>

            <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
              <Input
                label={t('auth.email_label')}
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.email_ph')}
                iconLeft={<Mail size={14} />}
                autoComplete="email"
                required
              />
              <Input
                label={t('auth.password_label')}
                type={showPw ? 'text' : 'password'}
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                iconLeft={<Lock size={14} />}
                iconRight={
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="text-ink-faint hover:text-ink"
                    aria-label={showPw ? t('auth.hide_password') : t('auth.show_password')}
                  >
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
                autoComplete="current-password"
                required
              />

              {error && (
                <div className="text-[12.5px] text-sick bg-sick/8 border border-sick/30 rounded px-3 py-2">
                  {error}
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                loading={submitting}
                iconRight={!submitting && <ArrowRight size={16} />}
                className="mt-2 w-full"
                type="submit"
              >
                {t('auth.sign_in')}
              </Button>

              <div className="flex items-center justify-between text-[12px] text-ink-faint pt-1">
                <Link to="/mot-de-passe-oublie" className="hover:text-ink">{t('auth.forgot_password')}</Link>
                <a href="#" className="hover:text-ink">{t('auth.help')}</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div className="display text-2xl text-ink leading-none">{n}</div>
      <div className="text-[11px] uppercase tracking-caps text-ink-faint mt-1">{label}</div>
    </div>
  )
}
