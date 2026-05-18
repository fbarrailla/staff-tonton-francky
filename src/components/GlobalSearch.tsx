import {
  useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, X, Users, UsersRound, UserPlus, GraduationCap, LayoutDashboard,
  CalendarDays, Plane, Stethoscope, Clock, Settings, CornerDownLeft,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useApplicants, useEmployees, useInterns } from '@/hooks/useStore'
import { useRoleLabel, useApplicantStatusLabel, useInternStatusLabel } from '@/hooks/useLabels'
import { Avatar } from './ui/Avatar'
import { cn } from '@/lib/utils'

interface Result {
  key: string
  group: 'employees' | 'applicants' | 'interns' | 'pages'
  to: string
  label: string
  caption?: string
  avatarName?: string
  avatarUrl?: string | null
  icon?: ReactNode
}

export function GlobalSearch() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const employees = useEmployees()
  const applicants = useApplicants()
  const interns = useInterns()
  const roleLabel = useRoleLabel()
  const applicantStatusLabel = useApplicantStatusLabel()
  const internStatusLabel = useInternStatusLabel()

  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Cmd/Ctrl+K to focus, '/' to focus when nothing else is focused
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Click outside to close
  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const PAGES: { to: string; label: string; icon: ReactNode; keywords?: string }[] = useMemo(
    () => [
      { to: '/', label: t('nav.dashboard'), icon: <LayoutDashboard size={14} /> },
      { to: '/equipe', label: t('nav.employees'), icon: <Users size={14} /> },
      { to: '/trombinoscope', label: t('nav.trombinoscope'), icon: <UsersRound size={14} /> },
      { to: '/candidats', label: t('nav.applicants'), icon: <UserPlus size={14} /> },
      { to: '/stagiaires', label: t('nav.interns'), icon: <GraduationCap size={14} /> },
      { to: '/calendrier', label: t('nav.calendar'), icon: <CalendarDays size={14} /> },
      { to: '/conges', label: t('nav.days_off'), icon: <Plane size={14} /> },
      { to: '/arrets-maladie', label: t('nav.sick_leaves'), icon: <Stethoscope size={14} /> },
      { to: '/temps', label: t('nav.time_tracking'), icon: <Clock size={14} /> },
      { to: '/reglages', label: t('nav.settings'), icon: <Settings size={14} /> },
    ],
    [t],
  )

  const results = useMemo<Result[]>(() => {
    const needle = q.trim().toLowerCase()
    if (needle.length < 1) return []
    const items: Result[] = []

    employees
      .filter((e) =>
        `${e.full_name} ${e.email} ${e.phone ?? ''} ${e.skills.join(' ')} ${roleLabel(e.role)}`
          .toLowerCase()
          .includes(needle),
      )
      .slice(0, 6)
      .forEach((e) => items.push({
        key: `emp-${e.id}`,
        group: 'employees',
        to: `/equipe/${e.id}`,
        label: e.full_name,
        caption: roleLabel(e.role) + (e.skills.length > 0 ? ' · ' + e.skills.slice(0, 2).join(', ') : ''),
        avatarName: e.full_name,
        avatarUrl: e.avatar_url,
      }))

    applicants
      .filter((a) =>
        `${a.full_name} ${a.email} ${a.applied_position ?? ''} ${a.skills.join(' ')}`
          .toLowerCase()
          .includes(needle),
      )
      .slice(0, 6)
      .forEach((a) => items.push({
        key: `app-${a.id}`,
        group: 'applicants',
        to: `/candidats/${a.id}`,
        label: a.full_name,
        caption: (a.applied_position || '—') + ' · ' + applicantStatusLabel(a.status),
        avatarName: a.full_name,
      }))

    interns
      .filter((i) =>
        `${i.full_name} ${i.email} ${(i.skills ?? []).join(' ')}`
          .toLowerCase()
          .includes(needle),
      )
      .slice(0, 6)
      .forEach((i) => items.push({
        key: `int-${i.id}`,
        group: 'interns',
        to: `/stagiaires`,
        label: i.full_name,
        caption: internStatusLabel(i.status),
        avatarName: i.full_name,
      }))

    PAGES
      .filter((p) => p.label.toLowerCase().includes(needle))
      .forEach((p) => items.push({
        key: `page-${p.to}`,
        group: 'pages',
        to: p.to,
        label: p.label,
        icon: p.icon,
      }))

    return items
  }, [q, employees, applicants, interns, PAGES, roleLabel, applicantStatusLabel, internStatusLabel])

  // Group results
  const grouped = useMemo(() => {
    const g: Record<Result['group'], Result[]> = {
      employees: [], applicants: [], interns: [], pages: [],
    }
    for (const r of results) g[r.group].push(r)
    return g
  }, [results])

  // Reset highlight when results change
  useEffect(() => {
    if (highlight >= results.length) setHighlight(0)
  }, [results.length, highlight])

  function go(to: string) {
    navigate(to)
    setQ('')
    setOpen(false)
    inputRef.current?.blur()
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      if (q) { setQ(''); return }
      setOpen(false)
      inputRef.current?.blur()
      return
    }
    if (results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => (h + 1) % results.length)
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => (h - 1 + results.length) % results.length)
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (results[highlight]) go(results[highlight].to)
    }
  }

  const showDropdown = open && q.trim().length > 0

  const groupLabel: Record<Result['group'], string> = {
    employees: t('search.group_employees'),
    applicants: t('search.group_applicants'),
    interns: t('search.group_interns'),
    pages: t('search.group_pages'),
  }

  // Compute flat index for highlighting per group
  let runningIdx = 0

  return (
    <div ref={wrapperRef} className="hidden md:block relative w-72 max-w-full">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          ref={inputRef}
          type="search"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setHighlight(0) }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={t('topbar.search_placeholder')}
          className="w-full h-9 pl-9 pr-12 text-[13px] rounded-md bg-surface border border-line focus:border-tonton-500 outline-none placeholder:text-ink-faint"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
        />
        {q ? (
          <button
            onClick={() => { setQ(''); inputRef.current?.focus() }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink p-1"
            aria-label="Clear"
          >
            <X size={12} />
          </button>
        ) : (
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-ink-faint bg-paper border border-line rounded px-1.5 py-0.5">
            ⌘K
          </kbd>
        )}
      </div>

      {showDropdown && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 max-h-[70vh] overflow-y-auto nice-scroll rounded-lg border border-line bg-paper shadow-raise animate-pop origin-top"
        >
          {results.length === 0 ? (
            <div className="p-5 text-center">
              <Search size={18} className="mx-auto text-ink-faint mb-2" />
              <p className="text-[13px] text-ink">{t('search.no_results', { q: q.trim() })}</p>
              <p className="text-[11.5px] text-ink-faint mt-1">{t('search.no_results_hint')}</p>
            </div>
          ) : (
            <>
              {(['employees', 'applicants', 'interns', 'pages'] as const).map((group) => {
                const list = grouped[group]
                if (list.length === 0) return null
                return (
                  <div key={group} className="py-1">
                    <div className="px-3 py-1.5 text-[10px] uppercase tracking-caps text-ink-faint">
                      {groupLabel[group]}
                    </div>
                    <ul>
                      {list.map((r) => {
                        const idx = runningIdx++
                        const active = idx === highlight
                        return (
                          <li key={r.key}>
                            <button
                              onClick={() => go(r.to)}
                              onMouseEnter={() => setHighlight(idx)}
                              className={cn(
                                'w-full flex items-center gap-2.5 px-3 py-2 text-left',
                                active ? 'bg-tonton-500/8' : 'hover:bg-surface/70',
                              )}
                            >
                              {r.avatarName ? (
                                <Avatar name={r.avatarName} src={r.avatarUrl} size={24} />
                              ) : (
                                <span className="grid place-items-center h-6 w-6 rounded bg-surface text-ink-faint shrink-0">
                                  {r.icon}
                                </span>
                              )}
                              <span className="flex-1 min-w-0">
                                <span className="block text-[13px] text-ink truncate leading-tight">
                                  {r.label}
                                </span>
                                {r.caption && (
                                  <span className="block text-[11.5px] text-ink-faint truncate leading-tight mt-0.5">
                                    {r.caption}
                                  </span>
                                )}
                              </span>
                              {active && (
                                <span className="text-[10.5px] text-ink-faint inline-flex items-center gap-1 shrink-0">
                                  <CornerDownLeft size={11} /> {t('search.hint_enter')}
                                </span>
                              )}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )
              })}
              <div className="px-3 py-2 border-t border-line text-[10.5px] text-ink-faint text-center tracking-tightish">
                {t('search.hint_navigate')}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
