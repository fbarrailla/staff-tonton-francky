import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Mail, CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { AuthShell } from '@/components/AuthShell'

export function ForgotPassword() {
  const { t } = useTranslation()
  const { requestPasswordReset } = useAuth()

  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!email) return
    setSubmitting(true)
    setError(null)
    const { error } = await requestPasswordReset(email)
    setSubmitting(false)
    if (error) setError(error)
    else setSent(true) // always show "sent" to not leak existing-email info
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

        {sent ? (
          <>
            <div className="grid place-items-center h-11 w-11 rounded-full bg-working/12 text-working mb-4">
              <CheckCircle2 size={20} />
            </div>
            <h1 className="display text-[28px] leading-tight text-ink">
              {t('auth.forgot_sent_title')}
            </h1>
            <p className="text-[14px] text-ink-soft mt-2 max-w-[36ch]">
              {t('auth.forgot_sent_body')}
            </p>
            <Button
              variant="secondary"
              size="lg"
              className="mt-6 w-full"
              onClick={() => {
                setSent(false)
                setEmail('')
              }}
            >
              {t('common.retry')}
            </Button>
          </>
        ) : (
          <>
            <div className="label-caps mb-3">{t('auth.forgot_title')}</div>
            <h1 className="display text-[28px] leading-tight text-ink">
              {t('auth.forgot_title')}
            </h1>
            <p className="text-[14px] text-ink-soft mt-2 max-w-[36ch]">
              {t('auth.forgot_subtitle')}
            </p>

            <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
              <Input
                label={t('auth.email_label')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.email_ph')}
                iconLeft={<Mail size={14} />}
                autoComplete="email"
                required
              />
              {error && (
                <div className="text-[12.5px] text-sick bg-sick/8 border border-sick/30 rounded px-3 py-2">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={submitting}
                iconRight={!submitting && <ArrowRight size={16} />}
                className="w-full"
              >
                {t('auth.forgot_send')}
              </Button>
            </form>
          </>
        )}
      </div>
    </AuthShell>
  )
}
