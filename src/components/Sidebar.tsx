import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CalendarDays,
  Plane,
  Stethoscope,
  Settings,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useApplicants, useDaysOff } from '@/hooks/useStore'

export function Sidebar() {
  const { t } = useTranslation()
  const daysOff = useDaysOff()
  const applicants = useApplicants()
  const pendingCount = daysOff.filter((d) => d.status === 'pending').length
  const newApplicants = applicants.filter((a) => a.status === 'nouveau').length

  type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; end?: boolean }
  const items: NavItem[] = [
    { to: '/', label: t('nav.dashboard'), icon: LayoutDashboard, end: true },
    { to: '/equipe', label: t('nav.employees'), icon: Users },
    { to: '/candidats', label: t('nav.applicants'), icon: UserPlus },
    { to: '/calendrier', label: t('nav.calendar'), icon: CalendarDays },
    { to: '/conges', label: t('nav.days_off'), icon: Plane },
    { to: '/arrets-maladie', label: t('nav.sick_leaves'), icon: Stethoscope },
    { to: '/reglages', label: t('nav.settings'), icon: Settings },
  ]

  return (
    <aside className="hidden lg:flex w-[248px] shrink-0 flex-col border-r border-line bg-surface/40 backdrop-blur-sm">
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="relative grid place-items-center h-9 w-9 rounded-md bg-tonton-500 text-white font-display font-bold text-[15px] shadow-soft">
            tF
            <span className="absolute -bottom-1 -right-1 size-2 rounded-full bg-working ring-2 ring-surface" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-caps text-ink-faint">{t('nav.backoffice')}</div>
            <div className="font-display text-[15px] leading-tight text-ink tracking-tightish">
              Tonton Francky
            </div>
          </div>
        </div>
      </div>

      <nav className="px-3 py-2 flex-1 nice-scroll overflow-y-auto">
        <div className="label-caps px-3 mb-2">{t('nav.workspace')}</div>
        <ul className="flex flex-col gap-0.5">
          {items.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-2.5 px-3 h-9 rounded-md text-[13.5px] font-medium transition-colors',
                    isActive
                      ? 'bg-paper text-ink shadow-soft'
                      : 'text-ink-soft hover:text-ink hover:bg-surface',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-tonton-500" />
                    )}
                    <Icon
                      size={16}
                      strokeWidth={1.75}
                      className={cn(
                        'shrink-0',
                        isActive ? 'text-tonton-500' : 'text-ink-faint group-hover:text-ink-soft',
                      )}
                    />
                    <span className="truncate">{label}</span>
                    {to === '/conges' && pendingCount > 0 && (
                      <span className="ml-auto tabular text-[10.5px] bg-pending/15 text-pending px-1.5 py-0.5 rounded">
                        {pendingCount}
                      </span>
                    )}
                    {to === '/candidats' && newApplicants > 0 && (
                      <span className="ml-auto tabular text-[10.5px] bg-tonton-500/15 text-tonton-700 dark:text-tonton-300 px-1.5 py-0.5 rounded">
                        {newApplicants}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="mt-6 mx-3 p-3.5 rounded-md border border-line bg-paper relative overflow-hidden">
          <div className="absolute -top-6 -right-6 size-24 rounded-full bg-tonton-500/15 blur-xl pointer-events-none" />
          <div className="relative">
            <div className="label-caps mb-1">{t('nav.tip_label')}</div>
            <p className="text-[12.5px] text-ink-soft leading-snug">
              {t('nav.tip_quota_pre')}{' '}
              <span className="text-ink font-medium">{t('nav.tip_quota_strong')}</span>{' '}
              {t('nav.tip_quota_post')}
            </p>
          </div>
        </div>
      </nav>

      <div className="px-5 py-4 border-t border-line text-[11px] text-ink-faint tracking-tightish flex items-center justify-between">
        <span>v0.1 · Tonton Francky</span>
        <span className="tabular">{new Date().getFullYear()}</span>
      </div>
    </aside>
  )
}
