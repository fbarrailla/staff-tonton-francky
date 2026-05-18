import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Plane,
  Stethoscope,
  CheckCircle2,
  XCircle,
  Sparkles,
  Users,
  CalendarRange,
} from 'lucide-react'
import { Layout } from '@/components/Layout'
import { useDaysOff, useEmployees, useSickLeaves } from '@/hooks/useStore'
import { mutate } from '@/lib/store'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  employeeStatusToday,
  monthLabel,
  monthlyDayOffBalance,
} from '@/lib/derived'
import { cn, formatDate, formatError, formatLongDate, todayISO } from '@/lib/utils'
import { useToast } from '@/contexts/ToastContext'
import { ROLE_LABEL } from '@/types'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { format } from 'date-fns'

export function Dashboard() {
  const employees = useEmployees()
  const daysOff = useDaysOff()
  const sickLeaves = useSickLeaves()
  const toast = useToast()

  const today = todayISO()

  const statuses = useMemo(
    () => employees.map((e) => ({ e, s: employeeStatusToday(e, daysOff, sickLeaves) })),
    [employees, daysOff, sickLeaves],
  )

  const working = statuses.filter((x) => x.s.status === 'working')
  const off = statuses.filter((x) => x.s.status === 'off')
  const sick = statuses.filter((x) => x.s.status === 'sick')
  const pending = daysOff.filter((d) => d.status === 'pending')

  const balances = useMemo(
    () =>
      employees.map((e) => ({
        e,
        bal: monthlyDayOffBalance(e.id, daysOff),
      })),
    [employees, daysOff],
  )

  const totalRemaining = balances.reduce((s, b) => s + b.bal.remaining, 0)
  const totalQuota = balances.reduce((s, b) => s + b.bal.quota, 0)

  const upcoming = useMemo(() => {
    const items: Array<{
      type: 'day_off' | 'sick'
      id: string
      empId: string
      from: string
      to: string
      label: string
      status?: string
    }> = []
    daysOff
      .filter((d) => d.status !== 'rejected')
      .forEach((d) => {
        items.push({
          type: 'day_off',
          id: d.id,
          empId: d.employee_id,
          from: d.start_date,
          to: d.end_date,
          label: d.reason,
          status: d.status,
        })
      })
    sickLeaves.forEach((s) => {
      items.push({
        type: 'sick',
        id: s.id,
        empId: s.employee_id,
        from: s.start_date,
        to: s.end_date,
        label: s.reason,
      })
    })
    return items
      .filter((i) => parseISO(i.from) >= parseISO(today))
      .sort((a, b) => a.from.localeCompare(b.from))
      .slice(0, 6)
  }, [daysOff, sickLeaves, today])

  async function approve(id: string) {
    try {
      await mutate.updateDayOff(id, { status: 'approved' })
      toast.success('Demande approuvée', 'Le congé a été validé.')
    } catch (e) {
      toast.error('Action impossible', formatError(e))
    }
  }
  async function reject(id: string) {
    try {
      await mutate.updateDayOff(id, {
        status: 'rejected',
        admin_note: 'Refusé depuis le tableau de bord',
      })
      toast.info('Demande refusée', 'Une note a été ajoutée à la demande.')
    } catch (e) {
      toast.error('Action impossible', formatError(e))
    }
  }

  return (
    <Layout eyebrow={`Aujourd'hui · ${format(new Date(), 'EEEE d MMMM', { locale: fr })}`}
            title="Bonjour, François.">
      {/* HERO: asymmetric — left intro + right today snapshot */}
      <section className="grid lg:grid-cols-[1.4fr_1fr] gap-5 lg:gap-6 mb-8">
        <div className="surface-card p-7 lg:p-8 relative overflow-hidden">
          <div className="absolute -top-20 -right-12 size-56 rounded-full bg-tonton-500/12 blur-2xl pointer-events-none" />
          <div className="relative">
            <div className="label-caps mb-3">Vue d'ensemble — {monthLabel(new Date())}</div>
            <p className="display text-[clamp(28px,3.2vw,42px)] leading-[1.05] text-ink text-balance max-w-[22ch]">
              <span className="text-tonton-600 dark:text-tonton-400">{working.length}</span> sur {employees.length} en
              poste, <span className="text-ink-soft">{off.length} en congé</span>
              {sick.length > 0 && <>, <span className="text-sick">{sick.length} en arrêt</span></>}.
            </p>
            <p className="text-[14px] text-ink-soft mt-4 max-w-[52ch] leading-relaxed">
              L'équipe Tonton Francky tient la boutique 7 jours sur 7 — voyage, tech et édition
              compris. Voici la photographie du jour, à&nbsp;{format(new Date(), 'HH:mm')}.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Button variant="primary" size="sm" iconLeft={<Plane size={14} />}>
                <Link to="/conges">Voir les congés en attente</Link>
              </Button>
              <Button variant="secondary" size="sm" iconLeft={<CalendarRange size={14} />}>
                <Link to="/calendrier">Ouvrir le calendrier</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Today snapshot panel */}
        <div className="surface-card p-6 flex flex-col">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="label-caps">En poste maintenant</div>
              <div className="display-tight text-[64px] leading-none text-ink mt-1 tabular">
                {working.length}
                <span className="text-ink-faint text-3xl"> / {employees.length}</span>
              </div>
            </div>
            <span className="rounded-full bg-working/12 text-working text-[11px] font-medium px-2.5 py-1 tracking-tightish">
              7/7
            </span>
          </div>
          {/* Avatar stack */}
          <div className="mt-5">
            <div className="flex -space-x-2.5">
              {working.slice(0, 9).map(({ e }) => (
                <Avatar key={e.id} name={e.full_name} size={32} ring />
              ))}
              {working.length > 9 && (
                <span className="grid place-items-center h-8 w-8 rounded-full bg-surface border border-line text-[11px] text-ink-soft tabular ring-2 ring-paper">
                  +{working.length - 9}
                </span>
              )}
            </div>
            <p className="text-[12.5px] text-ink-soft mt-3 leading-snug">
              {working.slice(0, 3).map((w) => w.e.full_name.split(' ')[0]).join(', ')}
              {working.length > 3 && ' et ' + (working.length - 3) + ' autres'} assurent le service.
            </p>
          </div>
        </div>
      </section>

      {/* SECONDARY STATS — varied widths */}
      <section className="grid grid-cols-2 lg:grid-cols-12 gap-4 mb-10">
        <StatTile
          className="lg:col-span-3"
          icon={<Users size={14} />}
          tone="neutral"
          label="Équipe totale"
          value={employees.length}
          hint={`${employees.filter(e => e.status === 'active').length} actifs`}
        />
        <StatTile
          className="lg:col-span-3"
          icon={<Plane size={14} />}
          tone="approved"
          label="En congé aujourd'hui"
          value={off.length}
          hint={off.length === 0 ? 'Personne — équipe au complet' : 'Bien méritée'}
        />
        <StatTile
          className="lg:col-span-3"
          icon={<Stethoscope size={14} />}
          tone="sick"
          label="En arrêt maladie"
          value={sick.length}
          hint={sick.length === 0 ? 'Aucun arrêt en cours' : 'Bon rétablissement'}
        />
        <StatTile
          className="lg:col-span-3"
          icon={<Sparkles size={14} />}
          tone="pending"
          label="Solde de congés du mois"
          value={`${totalRemaining}/${totalQuota}`}
          hint={`${pending.length} demande${pending.length > 1 ? 's' : ''} en attente`}
        />
      </section>

      {/* MAIN GRID */}
      <section className="grid lg:grid-cols-[1.3fr_1fr] gap-6">
        {/* Pending approvals */}
        <div>
          <header className="flex items-end justify-between mb-3">
            <div>
              <h2 className="display text-[22px] text-ink">Demandes à valider</h2>
              <p className="text-[13px] text-ink-soft mt-0.5">
                {pending.length === 0
                  ? 'Aucune demande en attente — bravo.'
                  : `${pending.length} demande${pending.length > 1 ? 's' : ''} attend votre décision.`}
              </p>
            </div>
            <Link
              to="/conges"
              className="text-[12.5px] text-ink-soft hover:text-ink flex items-center gap-1"
            >
              Voir tout <ArrowUpRight size={13} />
            </Link>
          </header>

          {pending.length === 0 ? (
            <div className="surface-card p-8 text-center">
              <CheckCircle2 className="mx-auto text-working mb-3" size={22} />
              <p className="text-[13.5px] text-ink-soft">
                Tout est à jour. Profitez-en pour préparer le mois prochain.
              </p>
            </div>
          ) : (
            <div className="surface-card divide-y divide-line overflow-hidden">
              {pending.slice(0, 5).map((d) => {
                const emp = employees.find((e) => e.id === d.employee_id)
                if (!emp) return null
                const days = d.number_of_days
                const start = formatDate(d.start_date, 'd MMM')
                const end = formatDate(d.end_date, 'd MMM')
                return (
                  <div key={d.id} className="p-4 flex flex-wrap items-start gap-4 hover:bg-surface/60 transition-colors">
                    <Avatar name={emp.full_name} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14px] font-medium text-ink">{emp.full_name}</span>
                        <span className="text-[12px] text-ink-faint">{ROLE_LABEL[emp.role]}</span>
                        <Badge tone="pending" dot>En attente</Badge>
                      </div>
                      <div className="text-[12.5px] text-ink-soft mt-1 tabular">
                        {start === end ? start : `${start} → ${end}`}
                        <span className="text-ink-faint"> · {days} jour{days > 1 ? 's' : ''}</span>
                      </div>
                      <p className="text-[13px] text-ink mt-1.5 leading-snug max-w-[60ch]">
                        « {d.reason} »
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant="primary"
                        iconLeft={<CheckCircle2 size={13} />}
                        onClick={() => void approve(d.id)}
                      >
                        Approuver
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        iconLeft={<XCircle size={13} />}
                        onClick={() => void reject(d.id)}
                      >
                        Refuser
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Upcoming events / Quota meter */}
        <div className="space-y-6">
          <div>
            <header className="flex items-end justify-between mb-3">
              <div>
                <h2 className="display text-[22px] text-ink">À venir</h2>
                <p className="text-[13px] text-ink-soft mt-0.5">Prochaines absences</p>
              </div>
              <Link
                to="/calendrier"
                className="text-[12.5px] text-ink-soft hover:text-ink flex items-center gap-1"
              >
                Calendrier <ArrowUpRight size={13} />
              </Link>
            </header>
            {upcoming.length === 0 ? (
              <div className="surface-card p-6 text-center text-[13px] text-ink-soft">
                Rien à signaler pour les prochains jours.
              </div>
            ) : (
              <ul className="surface-card divide-y divide-line">
                {upcoming.map((item) => {
                  const emp = employees.find((e) => e.id === item.empId)
                  if (!emp) return null
                  const inDays = differenceInCalendarDays(parseISO(item.from), new Date())
                  return (
                    <li key={item.id} className="p-3.5 flex items-center gap-3">
                      <Avatar name={emp.full_name} size={32} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-medium text-ink truncate">
                            {emp.full_name}
                          </span>
                          {item.type === 'sick' ? (
                            <Badge tone="sick" dot>Maladie</Badge>
                          ) : item.status === 'pending' ? (
                            <Badge tone="pending">En attente</Badge>
                          ) : (
                            <Badge tone="approved">Congé</Badge>
                          )}
                        </div>
                        <div className="text-[11.5px] text-ink-faint tabular">
                          {inDays === 0
                            ? "aujourd'hui"
                            : inDays === 1
                              ? 'demain'
                              : `dans ${inDays} jours`}
                          {' · '}
                          {formatDate(item.from, 'd MMM')}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div>
            <header className="flex items-end justify-between mb-3">
              <div>
                <h2 className="display text-[22px] text-ink">Soldes du mois</h2>
                <p className="text-[13px] text-ink-soft mt-0.5">
                  4 jours / mois calendaire par salarié·e
                </p>
              </div>
            </header>
            <div className="surface-card p-4 space-y-3">
              {balances.slice(0, 6).map(({ e, bal }) => {
                const pct = (bal.used / bal.quota) * 100
                const over = bal.used > bal.quota
                return (
                  <div key={e.id}>
                    <div className="flex items-center justify-between text-[12.5px]">
                      <span className="text-ink truncate">{e.full_name}</span>
                      <span className={cn('tabular tracking-tightish', over ? 'text-sick' : 'text-ink-soft')}>
                        {bal.used}/{bal.quota}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-surface overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', over ? 'bg-sick' : 'bg-tonton-500')}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
              <Link
                to="/equipe"
                className="block text-center text-[12.5px] text-ink-soft hover:text-ink pt-1"
              >
                Voir toute l'équipe →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}

function StatTile({
  className,
  icon,
  label,
  value,
  hint,
  tone,
}: {
  className?: string
  icon: React.ReactNode
  label: string
  value: number | string
  hint: string
  tone: 'neutral' | 'approved' | 'pending' | 'sick'
}) {
  const accent = {
    neutral: 'text-ink-faint',
    approved: 'text-tonton-500',
    pending: 'text-pending',
    sick: 'text-sick',
  }[tone]
  return (
    <div className={cn('surface-card p-5 flex flex-col justify-between min-h-[120px]', className)}>
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-caps">
        <span className={accent}>{icon}</span>
        <span className="text-ink-faint">{label}</span>
      </div>
      <div className="mt-3">
        <div className="display text-[34px] leading-none text-ink tabular tracking-tightish">
          {value}
        </div>
        <div className="text-[12px] text-ink-soft mt-1.5 truncate">{hint}</div>
      </div>
    </div>
  )
}
