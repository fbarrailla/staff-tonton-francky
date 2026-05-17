import { FormEvent, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { useTheme } from '@/contexts/ThemeContext'

export function Login() {
  const { user, signIn } = useAuth()
  const { theme, toggle } = useTheme()
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
      toast.error('Connexion impossible', error)
    } else {
      toast.success('Bienvenue', 'Heureux·se de vous revoir.')
      navigate(from, { replace: true })
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-paper">
      {/* Visual side */}
      <div className="hidden lg:flex relative overflow-hidden bg-warm-100 dark:bg-warm-800">
        {/* Cream textured panel with bold typographic mark */}
        <div className="absolute inset-0 grid-stripes opacity-40" />
        <div className="absolute -top-32 -left-24 size-[480px] rounded-full bg-tonton-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 size-[420px] rounded-full bg-tonton-500/15 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-2.5">
            <div className="grid place-items-center h-10 w-10 rounded-md bg-tonton-500 text-white font-display font-bold text-base shadow-soft">
              tF
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-caps text-ink-faint">Backoffice</div>
              <div className="font-display text-[15px] text-ink leading-tight">
                Tonton Francky
              </div>
            </div>
          </div>

          <div className="max-w-md">
            <div className="label-caps mb-3">Édition 2026</div>
            <h2 className="display text-[clamp(36px,4.4vw,56px)] leading-[0.95] text-ink text-balance">
              L'équipe,<br />
              <span className="text-tonton-600 dark:text-tonton-400">jour après jour.</span>
            </h2>
            <p className="text-[15px] text-ink-soft mt-5 max-w-[34ch] leading-relaxed">
              Suivez les présences, gérez les congés et les arrêts maladie de toute l'équipe
              voyage, tech et édition — depuis une seule interface, calme et claire.
            </p>

            <div className="mt-10 flex items-center gap-6 text-[12.5px] text-ink-soft">
              <Stat n="12" label="Salarié·e·s" />
              <span className="h-8 w-px bg-line" />
              <Stat n="4" label="Jours / mois" />
              <span className="h-8 w-px bg-line" />
              <Stat n="7/7" label="Service" />
            </div>
          </div>

          <p className="text-[11.5px] text-ink-faint tracking-tightish">
            « Bien gérer son équipe, c'est déjà bien la respecter. »
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
          <button
            onClick={toggle}
            className="ml-auto text-[12px] text-ink-faint hover:text-ink tracking-tightish"
          >
            {theme === 'dark' ? '☀︎ Mode clair' : '☾ Mode sombre'}
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm">
            <div className="label-caps mb-3">Connexion</div>
            <h1 className="display text-[34px] leading-tight text-ink">
              Bonjour,<br />ravi de vous revoir.
            </h1>
            <p className="text-[14px] text-ink-soft mt-2 max-w-[32ch]">
              Connectez-vous avec votre adresse professionnelle pour accéder au backoffice.
            </p>

            <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
              <Input
                label="Adresse e-mail"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prenom@tontonfrancky.com"
                iconLeft={<Mail size={14} />}
                autoComplete="email"
                required
              />
              <Input
                label="Mot de passe"
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
                    aria-label={showPw ? 'Cacher' : 'Afficher'}
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
                Se connecter
              </Button>

              <div className="flex items-center justify-between text-[12px] text-ink-faint pt-1">
                <a href="#" className="hover:text-ink">Mot de passe oublié ?</a>
                <a href="#" className="hover:text-ink">Aide</a>
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
