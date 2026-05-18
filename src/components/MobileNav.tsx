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

export function MobileNav() {
  const { t } = useTranslation()
  type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; end?: boolean }
  const items: NavItem[] = [
    { to: '/', label: t('nav.dashboard_short'), icon: LayoutDashboard, end: true },
    { to: '/equipe', label: t('nav.employees_short'), icon: Users },
    { to: '/candidats', label: t('nav.applicants_short'), icon: UserPlus },
    { to: '/calendrier', label: t('nav.calendar_short'), icon: CalendarDays },
    { to: '/conges', label: t('nav.days_off_short'), icon: Plane },
    { to: '/arrets-maladie', label: t('nav.sick_leaves_short'), icon: Stethoscope },
    { to: '/reglages', label: t('nav.settings_short'), icon: Settings },
  ]

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-paper/95 backdrop-blur border-t border-line">
      <ul className="grid grid-cols-7">
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium',
                  isActive ? 'text-tonton-500' : 'text-ink-faint',
                )
              }
            >
              <Icon size={17} strokeWidth={1.75} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
