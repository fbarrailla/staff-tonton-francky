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
import { cn } from '@/lib/utils'

const items = [
  { to: '/', label: 'Bord', icon: LayoutDashboard, end: true },
  { to: '/equipe', label: 'Équipe', icon: Users },
  { to: '/candidats', label: 'Cand.', icon: UserPlus },
  { to: '/calendrier', label: 'Cal.', icon: CalendarDays },
  { to: '/conges', label: 'Congés', icon: Plane },
  { to: '/arrets-maladie', label: 'Maladie', icon: Stethoscope },
  { to: '/reglages', label: 'Réglages', icon: Settings },
]

export function MobileNav() {
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
