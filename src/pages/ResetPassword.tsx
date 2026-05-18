import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Lock, Eye, EyeOff, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { AuthShell } from '@/components/AuthShell'
import { supabase } from '@/lib/supabase'
import { Spinner } from '@/components/ui/Spinner'

export function ResetPassword() {
  const { t } = useTranslation()
  const { setNewPassword } = useAuth()
  const navigate = useNavigate()

  const [checking, setChecking] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [pwd, setPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // When the user clicks the recovery email link, Supabase's detectSessionInUrl
  // exchanges the token for a session asynchronously. Wait briefly for it to
  // land, then mirror the result.
  useEffect(() => {
    if (!supabase) {
      setChecking(false)
      return
    }
    let cancelled = false

    async function check() {
      const { data } = await supabase!.auth.getSession()
      if (cancelled) return
      setHasSession(!!data.session)
      setChecking(false)
    }

    // Initial probe + a delayed retry to give detectSessionInUrl a chance
    void check()
    const t1 = setTimeout(() => { void check() }, 600)
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (cancelled) return
      setHasSession(!!session)
      setChecking(false)
    })

    return () => {
      cancelled = true
      clearTimeout(t1)
      sub.subscription.unsubscribe()
    }
  }, [])

  async function submit(e: FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (pwd.length < 8) errs.pwd = t('auth.password_too_short')
    if (pwd !== confirm) errs.confirm = t('auth.password_mismatch')
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitting(true)
    const { error } = await setNewPassword(pwd)
    setSubmitting(false)
    if (error) {
      setErrors({ pwd: error })
      return
    }
    setSuccess(true)
    // Sign the user back out after a successful reset so they re-enter their
    // new password — keeps the audit trail clean.
    setTimeout(() => {
      void supabase?.auth.signOut().then(() => navigate('/connexion', { replace: true }))
    }, 1500)
  }

  return (
    <AuthShell>
      <div className="w-full max-w-sm">
        <Link
          to="/connexion"
          className="inline-flex items-center gap-1 text-[12px] text-ink-faint hover:text-ink mb-4"
        >
          <ArrowLeft size={12} /> {t('auth.back_to_login')}
        </Link>

        {checking ? (
          <div className="flex flex-col items-center gap-3 py-8 text-ink-soft">
            <Spinner size={20} />
            <span className="text-[12.5px] tracking-tightish">{t('common.loading')}</span>
          </div>
        ) : success ? (
          <>
            <div className="grid place-items-center h-11 w-11 rounded-full bg-working/12 text-working mb-4">
              <CheckCircle2 size={20} />
            </div>
            <h1 className="display text-[28px] leading-tight text-ink">
              {t('auth.reset_success_title')}
            </h1>
            <p className="text-[14px] text-ink-soft mt-2 max-w-[36ch]">
              {t('auth.reset_success_body')}
            </p>
          </>
        ) : !hasSession ? (
          <>
            <div className="grid place-items-center h-11 w-11 rounded-full bg-sick/10 text-sick mb-4">
              <AlertTriangle size={20} />
            </div>
            <h1 className="display text-[28px] leading-tight text-ink">
              {t('auth.reset_no_session_title')}
            </h1>
            <p className="text-[14px] text-ink-soft mt-2 max-w-[36ch]">
              {t('auth.reset_no_session_body')}
            </p>
            <Link to="/mot-de-passe-oublie">
              <Button variant="primary" size="lg" className="mt-6 w-full">
                {t('auth.forgot_title')}
              </Button>
            </Link>
          </>
        ) : (
          <>
            <div className="label-caps mb-3">{t('auth.reset_title')}</div>
            <h1 className="display text-[28px] leading-tight text-ink">
              {t('auth.reset_title')}
            </h1>
            <p className="text-[14px] text-ink-soft mt-2 max-w-[36ch]">
              {t('auth.reset_subtitle')}
            </p>

            <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
              <Input
                label={t('auth.reset_new_password')}
                type={show ? 'text' : 'password'}
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                placeholder="••••••••"
                iconLeft={<Lock size={14} />}
                iconRight={
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    className="text-ink-faint hover:text-ink"
                    aria-label={show ? t('auth.hide_password') : t('auth.show_password')}
                  >
                    {show ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
                autoComplete="new-password"
                error={errors.pwd}
                hint={!errors.pwd ? t('auth.password_min') : undefined}
              />
              <Input
                label={t('auth.reset_confirm')}
                type={show ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                iconLeft={<Lock size={14} />}
                autoComplete="new-password"
                error={errors.confirm}
              />
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={submitting}
                iconRight={!submitting && <ArrowRight size={16} />}
                className="w-full"
              >
                {t('auth.reset_save')}
              </Button>
            </form>
          </>
        )}
      </div>
    </AuthShell>
  )
}
