import { useMemo, useState } from 'react'
import {
  CalendarClock, ChevronLeft, ChevronRight, Users as UsersIcon, Check, AlertTriangle,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  addWeeks, eachDayOfInterval, endOfWeek, format, isWeekend, parseISO,
  startOfWeek, subWeeks,
} from 'date-fns'
import { Layout } from '@/components/Layout'
import { Avatar } from '@/components/ui/Avatar'
import { Dialog } from '@/components/ui/Dialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { useEmployees, useTimeEntries } from '@/hooks/useStore'
import { useRoleLabel } from '@/hooks/useLabels'
import { useDateLocale, useFormatDate } from '@/hooks/useLocale'
import { DAILY_HOURS_TARGET, type Employee, type TimeEntry } from '@/types'
import { cn } from '@/lib/utils'

function fmtHours(n: number) {
  return n.toFixed(2).replace(/\.?0+$/, '')
}

interface Bucket {
  key: string                      // matched email if any, else user_id
  employee: Employee | null
  label: string
  subtitle: string
  avatar: string | null
  entries: TimeEntry[]
}

export function TeamTimePage() {
  const { t } = useTranslation()
  const employees = useEmployees()
  const entries = useTimeEntries()
  const roleLabel = useRoleLabel()
  const locale = useDateLocale()
  const fmt = useFormatDate()

  const [cursor, setCursor] = useState(() => new Date())
  const [drillEmployee, setDrillEmployee] = useState<Employee | null>(null)

  const weekStart = startOfWeek(cursor, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(cursor, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
  const weekDaysIso = weekDays.map((d) => format(d, 'yyyy-MM-dd'))
  const workingDays = weekDays.filter((d) => !isWeekend(d)).length
  const dailyTarget = DAILY_HOURS_TARGET
  const weekTargetPerPerson = workingDays * dailyTarget

  // Index entries by author_email (lowercased), and by user_id for orphans.
  const { byEmail, orphans } = useMemo(() => {
    const byEmail = new Map<string, TimeEntry[]>()
    const byUid = new Map<string, TimeEntry[]>()
    for (const e of entries) {
      if (!weekDaysIso.includes(e.work_date)) continue
      const k = e.author_email?.toLowerCase()
      if (k) {
        const list = byEmail.get(k) ?? []
        list.push(e)
        byEmail.set(k, list)
      } else {
        const list = byUid.get(e.user_id) ?? []
        list.push(e)
        byUid.set(e.user_id, list)
      }
    }
    return { byEmail, orphans: byUid }
  }, [entries, weekDaysIso])

  // Build one bucket per employee + extra buckets for orphan user_ids
  const buckets: Bucket[] = useMemo(() => {
    const out: Bucket[] = []
    for (const emp of employees) {
      const list = byEmail.get(emp.email.toLowerCase()) ?? []
      out.push({
        key: emp.email.toLowerCase(),
        employee: emp,
        label: emp.full_name,
        subtitle: roleLabel(emp.role),
        avatar: emp.avatar_url,
        entries: list,
      })
    }
    // Buckets for entries whose author_email doesn't match any employee
    const matchedEmails = new Set(employees.map((e) => e.email.toLowerCase()))
    for (const [email, list] of byEmail.entries()) {
      if (matchedEmails.has(email)) continue
      out.push({
        key: `email-${email}`,
        employee: null,
        label: email,
        subtitle: '—',
        avatar: null,
        entries: list,
      })
    }
    // Entries with no author_email at all (legacy rows)
    for (const [uid, list] of orphans.entries()) {
      out.push({
        key: `uid-${uid}`,
        employee: null,
        label: `User · ${uid.slice(0, 8)}`,
        subtitle: '—',
        avatar: null,
        entries: list,
      })
    }
    // Sort: rows under-target first, then by name
    return out.sort((a, b) => {
      const ta = a.entries.reduce((s, e) => s + Number(e.hours), 0)
      const tb = b.entries.reduce((s, e) => s + Number(e.hours), 0)
      const pa = weekTargetPerPerson === 0 ? 1 : ta / weekTargetPerPerson
      const pb = weekTargetPerPerson === 0 ? 1 : tb / weekTargetPerPerson
      if (pa !== pb) return pa - pb
      return a.label.localeCompare(b.label)
    })
  }, [employees, byEmail, orphans, roleLabel, weekTargetPerPerson])

  // Summary stats
  const teamLogged = useMemo(
    () => buckets.reduce((s, b) => s + b.entries.reduce((x, e) => x + Number(e.hours), 0), 0),
    [buckets],
  )
  const teamTarget = employees.length * weekTargetPerPerson
  const onTrack = buckets.filter(
    (b) => b.employee && b.entries.reduce((s, e) => s + Number(e.hours), 0) >= weekTargetPerPerson,
  ).length
  const behind = employees.length - onTrack

  // Drill bucket
  const drillBucket = useMemo(() => {
    if (!drillEmployee) return null
    return buckets.find((b) => b.employee?.id === drillEmployee.id) ?? null
  }, [drillEmployee, buckets])

  return (
    <Layout eyebrow={t('team_time.eyebrow')} title={t('team_time.title')}>
      <p className="text-[14px] text-ink-soft max-w-[60ch] mb-6">{t('team_time.intro')}</p>

      {/* WEEK NAV + STATS */}
      <section className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div className="inline-flex items-center bg-surface border border-line rounded-md p-1 gap-1">
          <button onClick={() => setCursor((d) => subWeeks(d, 1))}
            className="h-8 w-8 grid place-items-center rounded text-ink-soft hover:text-ink hover:bg-paper"
            aria-label={t('team_time.prev_week')}>
            <ChevronLeft size={15} />
          </button>
          <button onClick={() => setCursor(new Date())}
            className="h-8 px-3 text-[12.5px] rounded text-ink-soft hover:text-ink hover:bg-paper">
            {t('team_time.this_week')}
          </button>
          <button onClick={() => setCursor((d) => addWeeks(d, 1))}
            className="h-8 w-8 grid place-items-center rounded text-ink-soft hover:text-ink hover:bg-paper"
            aria-label={t('team_time.next_week')}>
            <ChevronRight size={15} />
          </button>
        </div>

        <div className="display tracking-tightish text-ink text-[20px] capitalize">
          {format(weekStart, 'd MMM', { locale })} — {format(weekEnd, 'd MMM yyyy', { locale })}
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px]">
          <Stat label={t('team_time.team_week_total')} value={`${fmtHours(teamLogged)}h`} />
          <Stat label={t('team_time.team_target')} value={`${teamTarget}h`} />
          <Stat label={t('team_time.completion')} value={teamTarget ? `${Math.round((teamLogged / teamTarget) * 100)}%` : '—'} />
          <span className="inline-flex items-center gap-1 text-working">
            <Check size={12} /> {t('team_time.people_on_track', { count: onTrack })}
          </span>
          <span className="inline-flex items-center gap-1 text-pending">
            <AlertTriangle size={12} /> {t('team_time.people_behind', { count: behind })}
          </span>
        </div>
      </section>

      {/* GRID */}
      {employees.length === 0 ? (
        <EmptyState icon={<UsersIcon size={20} />} title={t('team_time.no_employees')} />
      ) : (
        <div className="surface-card overflow-x-auto nice-scroll">
          <table className="w-full text-[13px] min-w-[760px]">
            <thead>
              <tr className="border-b border-line bg-surface/40">
                <th className="text-left font-medium text-ink-faint uppercase tracking-caps text-[10.5px] px-5 py-3 w-[280px]"></th>
                {weekDays.map((d) => {
                  const weekend = isWeekend(d)
                  return (
                    <th key={d.toISOString()}
                        className={cn(
                          'text-center font-medium uppercase tracking-caps text-[10.5px] py-3',
                          weekend ? 'text-ink-faint/60' : 'text-ink-faint',
                        )}>
                      <div className="leading-tight">
                        <div>{format(d, 'EEE', { locale })}</div>
                        <div className="text-[10.5px] tabular mt-0.5">{format(d, 'd')}</div>
                      </div>
                    </th>
                  )
                })}
                <th className="text-right font-medium text-ink-faint uppercase tracking-caps text-[10.5px] px-5 py-3 w-[110px]">
                  {t('team_time.week_total')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {buckets.map((b) => {
                const totals: Record<string, number> = {}
                for (const e of b.entries) {
                  totals[e.work_date] = (totals[e.work_date] ?? 0) + Number(e.hours)
                }
                const weekTotal = b.entries.reduce((s, e) => s + Number(e.hours), 0)
                const meets = weekTargetPerPerson > 0 && weekTotal >= weekTargetPerPerson
                const clickable = !!b.employee
                return (
                  <tr key={b.key}
                      onClick={() => clickable && setDrillEmployee(b.employee!)}
                      className={cn('transition-colors',
                        clickable && 'cursor-pointer hover:bg-surface/60')}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={b.label} src={b.avatar} size={32} />
                        <div className="min-w-0">
                          <div className="text-ink font-medium truncate">{b.label}</div>
                          <div className="text-[11.5px] text-ink-faint truncate">{b.subtitle}</div>
                        </div>
                      </div>
                    </td>
                    {weekDays.map((d) => {
                      const iso = format(d, 'yyyy-MM-dd')
                      const hours = totals[iso] ?? 0
                      const weekend = isWeekend(d)
                      const future = parseISO(iso) > new Date()
                      const filled = !weekend && hours >= dailyTarget
                      const partial = !weekend && hours > 0 && hours < dailyTarget
                      const empty = !weekend && hours === 0 && !future
                      return (
                        <td key={iso} className="py-2 text-center">
                          <span className={cn(
                            'inline-flex items-center justify-center min-w-[42px] h-7 rounded text-[11.5px] font-medium tabular',
                            weekend ? 'text-ink-faint/60'
                              : future ? 'text-ink-faint'
                              : filled ? 'bg-working/15 text-working'
                              : partial ? 'bg-pending/15 text-pending'
                              : empty ? 'bg-sick/8 text-sick/80'
                              : 'text-ink-soft',
                          )}>
                            {hours > 0 ? `${fmtHours(hours)}h` : (weekend || future ? '—' : '0')}
                          </span>
                        </td>
                      )
                    })}
                    <td className="px-5 py-3 text-right">
                      <div className={cn(
                        'inline-flex items-center gap-1.5 tabular font-medium',
                        meets ? 'text-working' : weekTotal === 0 ? 'text-ink-faint' : 'text-pending',
                      )}>
                        {fmtHours(weekTotal)}h
                        {meets && <Check size={12} />}
                        {!meets && weekTotal > 0 && <AlertTriangle size={12} />}
                      </div>
                      <div className="text-[10.5px] text-ink-faint tabular">/ {weekTargetPerPerson}h</div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* DETAIL DRAWER */}
      <Dialog
        open={drillEmployee !== null}
        onClose={() => setDrillEmployee(null)}
        title={drillEmployee ? t('team_time.detail_title', {
          name: drillEmployee.full_name,
          date: format(weekStart, 'd MMM yyyy', { locale }),
        }) : ''}
        description={drillEmployee ? t('team_time.detail_intro', { name: drillEmployee.full_name }) : undefined}
        side="right"
      >
        {drillEmployee && (
          <div>
            {!drillBucket || drillBucket.entries.length === 0 ? (
              <div className="rounded-lg border border-dashed border-line-strong/50 bg-surface/30 p-6 text-center">
                <CalendarClock className="mx-auto text-ink-faint mb-2" size={20} />
                <p className="text-[13px] text-ink-soft">
                  {t('team_time.empty_employee_week', { name: drillEmployee.full_name })}
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {weekDaysIso.map((iso) => {
                  const dayEntries = drillBucket.entries
                    .filter((e) => e.work_date === iso)
                    .sort((a, b) => b.created_at.localeCompare(a.created_at))
                  if (dayEntries.length === 0) return null
                  const total = dayEntries.reduce((s, e) => s + Number(e.hours), 0)
                  return (
                    <li key={iso} className="surface-flat overflow-hidden">
                      <div className="px-4 py-2 flex items-center justify-between bg-surface border-b border-line">
                        <span className="text-[12.5px] font-medium text-ink">{fmt(iso, 'EEEE d MMM')}</span>
                        <span className="text-[11.5px] tabular text-ink-soft">{fmtHours(total)}h</span>
                      </div>
                      <ul className="divide-y divide-line">
                        {dayEntries.map((entry) => (
                          <li key={entry.id} className="px-4 py-3 flex items-start gap-3">
                            <span className="tabular text-[12.5px] font-medium text-ink w-12 shrink-0">
                              {fmtHours(Number(entry.hours))}h
                            </span>
                            <p className="text-[13px] text-ink-soft flex-1 leading-snug whitespace-pre-wrap">
                              {entry.description}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}
      </Dialog>
    </Layout>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="leading-tight">
      <div className="text-[10.5px] uppercase tracking-caps text-ink-faint">{label}</div>
      <div className="tabular text-ink font-medium">{value}</div>
    </div>
  )
}
