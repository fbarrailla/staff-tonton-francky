import { useState } from 'react'
import { Sun, Moon, LogOut, RotateCcw, Database, Languages, Building2, Sparkles } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { Dialog } from '@/components/ui/Dialog'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useToast } from '@/contexts/ToastContext'
import { mutate } from '@/lib/store'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'

export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { user, signOut, isMock } = useAuth()
  const toast = useToast()
  const [confirmReset, setConfirmReset] = useState(false)
  const [quota, setQuota] = useState(4)
  const [businessName, setBusinessName] = useState('Tonton Francky')

  return (
    <Layout eyebrow="Préférences" title="Réglages">
      <div className="grid lg:grid-cols-[220px_1fr] gap-8">
        <aside className="hidden lg:block">
          <ul className="space-y-1 text-[13px] text-ink-soft sticky top-24">
            <li><a href="#apparence" className="hover:text-ink">Apparence</a></li>
            <li><a href="#equipe" className="hover:text-ink">Équipe & quotas</a></li>
            <li><a href="#langue" className="hover:text-ink">Langue & région</a></li>
            <li><a href="#compte" className="hover:text-ink">Compte</a></li>
            <li><a href="#donnees" className="hover:text-ink">Données</a></li>
          </ul>
        </aside>

        <div className="space-y-8 max-w-2xl">
          <section id="apparence" className="surface-card p-6">
            <Heading icon={<Sparkles size={14} />}>Apparence</Heading>
            <p className="text-[13px] text-ink-soft mt-1">
              Choisissez le thème par défaut. Le bouton de la barre d'en-tête permet de basculer rapidement.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <ThemeChoice
                active={theme === 'light'}
                onClick={() => setTheme('light')}
                icon={<Sun size={16} />}
                label="Clair"
                description="Crème chaude — usage de jour"
                bg="bg-warm-50"
                fg="text-warm-700"
              />
              <ThemeChoice
                active={theme === 'dark'}
                onClick={() => setTheme('dark')}
                icon={<Moon size={16} />}
                label="Sombre"
                description="Espresso nuit — usage du soir"
                bg="bg-warm-800"
                fg="text-warm-100"
              />
            </div>
          </section>

          <section id="equipe" className="surface-card p-6">
            <Heading icon={<Building2 size={14} />}>Équipe & quotas</Heading>
            <p className="text-[13px] text-ink-soft mt-1">
              Configurez les paramètres globaux de l'équipe Tonton Francky.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <Input label="Nom de l'entreprise" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
              <Input
                label="Jours de congé par mois"
                type="number"
                min={0}
                max={31}
                value={quota}
                onChange={(e) => setQuota(Number(e.target.value))}
                hint="Quota appliqué à chaque salarié·e. 4 par défaut."
              />
            </div>
            <Button
              variant="primary"
              className="mt-5"
              onClick={() => toast.success('Préférences enregistrées', 'Les nouveaux quotas s\'appliquent dès aujourd\'hui.')}
            >
              Enregistrer
            </Button>
          </section>

          <section id="langue" className="surface-card p-6">
            <Heading icon={<Languages size={14} />}>Langue & région</Heading>
            <p className="text-[13px] text-ink-soft mt-1">
              L'interface est actuellement en français. D'autres langues arriveront prochainement.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              <ToggleRow label="Français" caption="Langue par défaut" active />
              <ToggleRow label="English" caption="Bientôt disponible" />
            </div>
          </section>

          <section id="compte" className="surface-card p-6">
            <Heading>Compte</Heading>
            <div className="mt-4 flex items-center gap-4 p-4 rounded-md border border-line bg-surface">
              <Avatar name={user?.display_name ?? user?.email ?? '?'} size={48} />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium text-ink truncate">{user?.display_name}</div>
                <div className="text-[12.5px] text-ink-soft truncate">{user?.email}</div>
                <div className="text-[11.5px] text-ink-faint mt-1">
                  {isMock ? 'Session mock locale' : 'Connecté·e via Supabase'}
                </div>
              </div>
              <Button variant="ghost" iconLeft={<LogOut size={14} />} onClick={() => void signOut()}>
                Se déconnecter
              </Button>
            </div>
          </section>

          <section id="donnees" className="surface-card p-6">
            <Heading icon={<Database size={14} />}>Données</Heading>
            <p className="text-[13px] text-ink-soft mt-1 max-w-prose">
              {isMock
                ? 'Vous utilisez actuellement la base de démonstration locale (localStorage). Renseignez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY pour passer en mode réel.'
                : 'Vos données sont synchronisées avec votre projet Supabase.'}
            </p>
            {isMock && (
              <Button
                variant="secondary"
                className="mt-4"
                iconLeft={<RotateCcw size={14} />}
                onClick={() => setConfirmReset(true)}
              >
                Réinitialiser la démo
              </Button>
            )}
          </section>
        </div>
      </div>

      <Dialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Réinitialiser la démo ?"
        description="Toutes vos modifications locales seront remplacées par les données d'origine."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>Annuler</Button>
            <Button
              variant="danger"
              onClick={() => {
                mutate.resetDemo()
                setConfirmReset(false)
                toast.success('Démo réinitialisée')
              }}
            >
              Réinitialiser
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-ink-soft">
          Cette action ne peut pas être annulée — mais comme c'est une démo, ça reste sans conséquence.
        </p>
      </Dialog>
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
  active, onClick, icon, label, description, bg, fg,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  description: string
  bg: string
  fg: string
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
      {active && <span className="ml-auto text-[11px] text-tonton-500 font-medium tracking-tightish">Actif</span>}
    </button>
  )
}

function ToggleRow({ label, caption, active }: { label: string; caption: string; active?: boolean }) {
  return (
    <div className={cn('flex items-center justify-between rounded-md border px-3 py-2.5',
      active ? 'border-tonton-500/40 bg-tonton-500/5' : 'border-line bg-surface')}>
      <div>
        <div className="text-[13px] font-medium text-ink">{label}</div>
        <div className="text-[11.5px] text-ink-faint">{caption}</div>
      </div>
      {active && <span className="text-[11px] text-tonton-600 font-medium">Activé</span>}
    </div>
  )
}
