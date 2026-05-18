import { useMemo, useState } from 'react'
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format,
  isSameMonth, isToday, isWeekend, startOfMonth, startOfWeek, subMonths,
} from 'date-fns'
import {
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Stethoscope, Plane,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Layout } from '@/components/Layout'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { useDaysOff, useEmployees, useSickLeaves } from '@/hooks/useStore'
import { DayOffForm } from '@/components/DayOffForm'
import { SickLeaveForm } from '@/components/SickLeaveForm'
import { cn, dayIsInRange } from '@/lib/utils'
import type { DayOff, Employee, SickLeave } from '@/types'
import { useDateLocale, useFormatDate, useFormatLongDate } from '@/hooks/useLocale'
import { useRoleLabel } from '@/hooks/useLabels'

type Filter = 'all' | 'approved' | 'pending' | 'rejected' | 'sick'

interface DayEvent {
  type: 'day_off' | 'sick'
  ref: DayOff | SickLeave
  status?: DayOff['status']
  employeeId: string
}

export function CalendarPage() {
  const { t } = useTranslation()
  const employees = useEmployees()
  const daysOff = useDaysOff()
  const sickLeaves = useSickLeaves()
  const locale = useDateLocale()
  const fmt = useFormatDate()
  const fmtLong = useFormatLongDate()
  const roleLabel = useRoleLabel()

  const [cursor, setCursor] = useState(() => new Date())
  const [employeeFilter, setEmployeeFilter] = useState<'all' | string>('all')
  const [statusFilter, setStatusFilter] = useState<Filter>('all')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [quickAdd, setQuickAdd] = useState<null | 'day_off' | 'sick'>(null)

  const monthStart = startOfMonth(cursor)
  const monthEnd = endOfMonth(cursor)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const eventsByDay = useMemo(() => {
    const map = new Map<string, DayEvent[]>()
    const passFilters = (status: DayOff['status'] | 'sick') => {
      if (statusFilter === 'all') return true
      if (statusFilter === 'sick') return status === 'sick'
      return status === statusFilter
    }
    const addEvt = (dayIso: string, ev: DayEvent) => {
      if (employeeFilter !== 'all' && ev.employeeId !== employeeFilter) return
      const list = map.get(dayIso) ?? []
      list.push(ev)
      map.set(dayIso, list)
    }
    days.forEach((d) => {
      const iso = format(d, 'yyyy-MM-dd')
      daysOff.forEach((dof) => {
        if (dayIsInRange(iso, dof.start_date, dof.end_date) && passFilters(dof.status))
          addEvt(iso, { type: 'day_off', ref: dof, status: dof.status, employeeId: dof.employee_id })
      })
      sickLeaves.forEach((s) => {
        if (dayIsInRange(iso, s.start_date, s.end_date) && passFilters('sick'))
          addEvt(iso, { type: 'sick', ref: s, employeeId: s.employee_id })
      })
    })
    return map
  }, [days, daysOff, sickLeaves, employeeFilter, statusFilter])

  const emp = (id: string) => employees.find((e) => e.id === id)

  function colorClasses(ev: DayEvent) {
    if (ev.type === 'sick') return 'bg-sick/15 text-sick ring-sick/30'
    if (ev.status === 'approved') return 'bg-tonton-500/15 text-tonton-700 dark:text-tonton-300 ring-tonton-500/30'
    if (ev.status === 'pending') return 'bg-pending/15 text-pending ring-pending/30'
    return 'bg-rejected/15 text-rejected ring-rejected/30'
  }

  const weekdays = [
    t('calendar.weekday_mon'), t('calendar.weekday_tue'), t('calendar.weekday_wed'),
    t('calendar.weekday_thu'), t('calendar.weekday_fri'), t('calendar.weekday_sat'),
    t('calendar.weekday_sun'),
  ]

  return (
    <Layout
      eyebrow={t('calendar.eyebrow', { year: format(cursor, 'yyyy') })}
      title={<span className="inline-flex items-center gap-2">
        {format(cursor, 'MMMM yyyy', { locale }).replace(/^./, (c) => c.toUpperCase())}
      </span>}>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="inline-flex items-center bg-surface border border-line rounded-md p-1 gap-1">
          <button onClick={() => setCursor((d) => subMonths(d, 1))}
            className="h-8 w-8 grid place-items-center rounded text-ink-soft hover:text-ink hover:bg-paper"
            aria-label={t('calendar.prev_month')}>
            <ChevronLeft size={15} />
          </button>
          <button onClick={() => setCursor(new Date())}
            className="h-8 px-3 text-[12.5px] rounded text-ink-soft hover:text-ink hover:bg-paper">
            {t('calendar.today')}
          </button>
          <button onClick={() => setCursor((d) => addMonths(d, 1))}
            className="h-8 w-8 grid place-items-center rounded text-ink-soft hover:text-ink hover:bg-paper"
            aria-label={t('calendar.next_month')}>
            <ChevronRight size={15} />
          </button>
        </div>

        <select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value as 'all' | string)}
          className="h-10 px-3 pr-8 text-sm rounded-md bg-paper border border-line focus:border-tonton-500 outline-none">
          <option value="all">{t('calendar.all_team')}</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
        </select>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as Filter)}
          className="h-10 px-3 pr-8 text-sm rounded-md bg-paper border border-line focus:border-tonton-500 outline-none">
          <option value="all">{t('calendar.all_events')}</option>
          <option value="approved">{t('calendar.filter_approved')}</option>
          <option value="pending">{t('calendar.filter_pending')}</option>
          <option value="rejected">{t('calendar.filter_rejected')}</option>
          <option value="sick">{t('calendar.filter_sick')}</option>
        </select>

        <div className="flex-1" />

        <div className="hidden sm:flex items-center gap-3 text-[11.5px] text-ink-soft mr-1">
          <Legend dot="bg-tonton-500" label={t('calendar.legend_approved')} />
          <Legend dot="bg-pending" label={t('calendar.legend_pending')} />
          <Legend dot="bg-sick" label={t('calendar.legend_sick')} />
          <Legend dot="bg-rejected" label={t('calendar.legend_rejected')} />
        </div>

        <Button size="sm" variant="secondary" iconLeft={<Plane size={13} />} onClick={() => setQuickAdd('day_off')}>
          {t('calendar.new_leave')}
        </Button>
        <Button size="sm" variant="primary" iconLeft={<Stethoscope size={13} />} onClick={() => setQuickAdd('sick')}>
          {t('calendar.new_sick')}
        </Button>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-line bg-surface/60">
          {weekdays.map((d, i) => (
            <div key={d}
              className={cn('text-[11px] uppercase tracking-caps text-ink-faint py-2.5 text-center',
                i >= 5 && 'text-tonton-700/70 dark:text-tonton-400/70')}>
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 auto-rows-fr">
          {days.map((d) => {
            const iso = format(d, 'yyyy-MM-dd')
            const evts = eventsByDay.get(iso) ?? []
            const otherMonth = !isSameMonth(d, monthStart)
            const today = isToday(d)
            const weekend = isWeekend(d)
            return (
              <button key={iso} onClick={() => setSelectedDate(d)}
                className={cn(
                  'relative text-left min-h-[120px] p-2 border-r border-b border-line/70 hover:bg-surface/70 transition-colors group',
                  otherMonth && 'bg-surface/40',
                  weekend && !otherMonth && 'bg-tonton-50/30 dark:bg-tonton-900/10',
                )}>
                <div className="flex items-center justify-between">
                  <span className={cn(
                    'inline-flex items-center justify-center h-6 min-w-6 px-1 rounded-full text-[12px] font-medium tabular',
                    today ? 'bg-tonton-500 text-white shadow-soft'
                      : otherMonth ? 'text-ink-faint' : 'text-ink-soft',
                  )}>
                    {format(d, 'd')}
                  </span>
                  {evts.length === 0 && !otherMonth && (
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus size={13} className="text-ink-faint" />
                    </span>
                  )}
                </div>

                <div className="mt-1.5 space-y-1">
                  {evts.slice(0, 3).map((ev) => {
                    const e = emp(ev.employeeId)
                    if (!e) return null
                    return (
                      <div key={ev.ref.id + iso}
                        className={cn(
                          'flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[10.5px] ring-1 ring-inset truncate',
                          colorClasses(ev),
                        )}>
                        <Avatar name={e.full_name} src={e.avatar_url} size={14} />
                        <span className="truncate font-medium">{e.full_name.split(' ')[0]}</span>
                        {ev.type === 'sick' && <Stethoscope size={9} className="ml-auto opacity-70 shrink-0" />}
                      </div>
                    )
                  })}
                  {evts.length > 3 && (
                    <div className="text-[10.5px] text-ink-faint pl-1">
                      {t('calendar.more_count', { count: evts.length - 3 })}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <Dialog open={selectedDate !== null} onClose={() => setSelectedDate(null)}
        title={selectedDate ? fmtLong(format(selectedDate, 'yyyy-MM-dd')) : ''}
        description={t('calendar.day_detail_desc')} side="right">
        {selectedDate && (
          <DayDetails day={selectedDate} fmt={fmt}
            events={eventsByDay.get(format(selectedDate, 'yyyy-MM-dd')) ?? []}
            empOf={emp} roleLabel={roleLabel}
            onQuickAdd={(kind) => { setSelectedDate(null); setQuickAdd(kind) }} />
        )}
      </Dialog>

      <Dialog open={quickAdd === 'day_off'} onClose={() => setQuickAdd(null)}
        title={t('calendar.new_leave')} description={t('calendar.new_leave_dialog_desc')} side="right">
        <DayOffForm employees={employees} existingDaysOff={daysOff}
          onSaved={() => setQuickAdd(null)} onCancel={() => setQuickAdd(null)} />
      </Dialog>

      <Dialog open={quickAdd === 'sick'} onClose={() => setQuickAdd(null)}
        title={t('calendar.new_sick')} description={t('calendar.new_sick_dialog_desc')} side="right">
        <SickLeaveForm employees={employees}
          onSaved={() => setQuickAdd(null)} onCancel={() => setQuickAdd(null)} />
      </Dialog>
    </Layout>
  )
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('size-2 rounded-full', dot)} />
      {label}
    </span>
  )
}

function DayDetails({
  events, empOf, onQuickAdd, fmt, roleLabel,
}: {
  day: Date
  events: DayEvent[]
  empOf: (id: string) => Employee | undefined
  onQuickAdd: (kind: 'day_off' | 'sick') => void
  fmt: (iso: string, pattern?: string) => string
  roleLabel: (r: Employee['role']) => string
}) {
  const { t } = useTranslation()
  return (
    <div className="space-y-4">
      <div className="flex gap-1.5">
        <Button size="sm" variant="primary" iconLeft={<Plane size={13} />} onClick={() => onQuickAdd('day_off')}>
          {t('calendar.add_leave')}
        </Button>
        <Button size="sm" variant="secondary" iconLeft={<Stethoscope size={13} />} onClick={() => onQuickAdd('sick')}>
          {t('calendar.sick_short')}
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong/50 bg-surface/30 p-6 text-center">
          <CalendarIcon className="mx-auto text-ink-faint mb-2" size={20} />
          <p className="text-[13px] text-ink-soft">{t('calendar.no_events')}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {events.map((ev) => {
            const e = empOf(ev.employeeId)
            if (!e) return null
            const ref = ev.ref
            const range = ref.start_date === ref.end_date
              ? fmt(ref.start_date)
              : `${fmt(ref.start_date, 'd MMM')} → ${fmt(ref.end_date, 'd MMM')}`
            return (
              <li key={ref.id} className="surface-flat p-3 flex items-start gap-3">
                <Avatar name={e.full_name} src={e.avatar_url} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13.5px] font-medium text-ink">{e.full_name}</span>
                    <span className="text-[11.5px] text-ink-faint">{roleLabel(e.role)}</span>
                    {ev.type === 'sick' ? <Badge tone="sick" dot>{t('calendar.evt_sick')}</Badge>
                      : ev.status === 'approved' ? <Badge tone="approved" dot>{t('calendar.evt_approved')}</Badge>
                      : ev.status === 'pending' ? <Badge tone="pending" dot>{t('calendar.evt_pending')}</Badge>
                      : <Badge tone="rejected" dot>{t('calendar.evt_rejected')}</Badge>}
                  </div>
                  <div className="text-[12px] text-ink-soft tabular mt-0.5">{range}</div>
                  {'reason' in ref && ref.reason && (
                    <p className="text-[12.5px] text-ink mt-1 leading-snug">« {ref.reason} »</p>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
