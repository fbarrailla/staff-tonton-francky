import { FormEvent, useMemo, useState } from 'react'
import {
  CalendarClock, Clock, Plus, Edit3, Trash2, Check, AlertTriangle, Sparkles, BellRing,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  eachDayOfInterval, endOfWeek, format, isToday, isWeekend,
  parseISO, startOfWeek, subDays,
} from 'date-fns'
import { Layout } from '@/components/Layout'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input, Textarea } from '@/components/ui/Field'
import { useTimeEntries } from '@/hooks/useStore'
import { mutate } from '@/lib/store'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { cn, formatError, todayISO } from '@/lib/utils'
import { useDateLocale, useFormatDate } from '@/hooks/useLocale'
import { DAILY_HOURS_TARGET, type TimeEntry } from '@/types'

function fmtHours(n: number): string {
  // Trim trailing zeros, keep up to 2 decimals
  return n.toFixed(2).replace(/\.?0+$/, '')
}

export function TimeTrackingPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const toast = useToast()
  // Store now holds every authenticated user's entries (so the team view can
  // join them). The personal page only ever shows / mutates the current
  // user's rows — RLS for INSERT/UPDATE/DELETE is owner-only, so trying to
  // edit anyone else's row 400s with "Cannot coerce the result to a single
  // JSON object". Scope at render time.
  const allEntries = useTimeEntries()
  const entries = useMemo(
    () => (user?.id ? allEntries.filter((e) => e.user_id === user.id) : []),
    [allEntries, user?.id],
  )
  const locale = useDateLocale()
  const fmt = useFormatDate()

  const [editing, setEditing] = useState<TimeEntry | null>(null)
  const [deleting, setDeleting] = useState<TimeEntry | null>(null)
  const [removing, setRemoving] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state for inline quick-add
  const [formDate, setFormDate] = useState(todayISO())
  const [formHours, setFormHours] = useState<string>('1')
  const [formDescription, setFormDescription] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Group entries by date
  const byDay = useMemo(() => {
    const m = new Map<string, TimeEntry[]>()
    for (const e of entries) {
      const list = m.get(e.work_date) ?? []
      list.push(e)
      m.set(e.work_date, list)
    }
    return m
  }, [entries])

  const dayTotal = (iso: string) =>
    (byDay.get(iso) ?? []).reduce((sum, e) => sum + Number(e.hours), 0)

  // Current week (Mon → Sun) for the strip
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const workingDaysCount = weekDays.filter((d) => !isWeekend(d)).length
  const weekTarget = workingDaysCount * DAILY_HOURS_TARGET
  const weekTotal = weekDays.reduce(
    (sum, d) => sum + dayTotal(format(d, 'yyyy-MM-dd')),
    0,
  )

  const todayIso = todayISO()
  const todayLogged = dayTotal(todayIso)
  const todayRemaining = Math.max(0, DAILY_HOURS_TARGET - todayLogged)

  // History: last 30 days, grouped, most recent first
  const historyDays = useMemo(() => {
    const cutoff = subDays(new Date(), 30)
    return Array.from(byDay.entries())
      .filter(([iso]) => parseISO(iso) >= cutoff)
      .sort(([a], [b]) => b.localeCompare(a))
  }, [byDay])

  async function submitNew(e: FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    const h = Number(formHours)
    if (!Number.isFinite(h) || h <= 0 || h > 24) errs.hours = t('time_tracking.hours_err')
    if (!formDescription.trim()) errs.description = t('time_tracking.description_err')
    setFormErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSubmitting(true)
    try {
      await mutate.addTimeEntry({
        user_id: user?.id ?? '',
        work_date: formDate,
        hours: h,
        description: formDescription.trim(),
      })
      setFormDescription('')
      setFormHours('1')
      toast.success(t('time_tracking.saved_toast'))
    } catch (err) {
      toast.error(t('errors.save_failed'), formatError(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function saveEdit(updated: TimeEntry) {
    setSubmitting(true)
    try {
      await mutate.updateTimeEntry(updated.id, {
        work_date: updated.work_date,
        hours: updated.hours,
        description: updated.description,
      })
      setEditing(null)
      toast.success(t('time_tracking.updated_toast'))
    } catch (err) {
      toast.error(t('errors.update_failed'), formatError(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    setRemoving(true)
    try {
      await mutate.deleteTimeEntry(deleting.id)
      toast.info(t('time_tracking.deleted_toast'))
      setDeleting(null)
    } catch (err) {
      toast.error(t('errors.delete_failed'), formatError(err))
    } finally {
      setRemoving(false)
    }
  }

  return (
    <Layout eyebrow={t('time_tracking.eyebrow')} title={t('time_tracking.title')}>
      <p className="text-[14px] text-ink-soft max-w-[60ch] mb-6">
        {t('time_tracking.intro', { target: DAILY_HOURS_TARGET })}
      </p>

      {/* Today-empty nudge — only on a working day (Mon–Fri) when nothing's logged */}
      {todayLogged === 0 && !isWeekend(new Date()) && (
        <section className="mb-6 rounded-lg border border-sick/30 bg-sick/8 px-5 py-4 flex items-center gap-4">
          <div className="grid place-items-center h-10 w-10 rounded-full bg-sick/15 text-sick shrink-0">
            <BellRing size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-[14px] font-medium text-ink">
              {t('time_tracking.today_empty_title')}
            </div>
            <div className="text-[12.5px] text-ink-soft mt-0.5">
              {t('time_tracking.today_empty_body', { target: DAILY_HOURS_TARGET })}
            </div>
          </div>
        </section>
      )}

      {/* HERO + WEEK STRIP */}
      <section className="grid lg:grid-cols-[1.1fr_1.4fr] gap-5 lg:gap-6 mb-8">
        <div className="surface-card p-6 relative overflow-hidden">
          <div className="absolute -top-16 -right-10 size-52 rounded-full bg-tonton-500/12 blur-2xl pointer-events-none" />
          <div className="relative">
            <div className="label-caps mb-2">{t('time_tracking.today')}</div>
            <div className="flex items-baseline gap-2">
              <span className="display-tight text-[56px] leading-none text-ink tabular">
                {fmtHours(todayLogged)}
              </span>
              <span className="text-ink-faint text-xl tabular">
                / {DAILY_HOURS_TARGET}h
              </span>
            </div>
            <div className="mt-4 h-2 bg-surface rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  todayLogged >= DAILY_HOURS_TARGET ? 'bg-working' : 'bg-tonton-500',
                )}
                style={{ width: `${Math.min(100, (todayLogged / DAILY_HOURS_TARGET) * 100)}%` }}
              />
            </div>
            <p className="text-[12.5px] text-ink-soft mt-3 leading-snug">
              {todayLogged >= DAILY_HOURS_TARGET ? (
                <span className="inline-flex items-center gap-1.5 text-working font-medium">
                  <Check size={13} />
                  {todayLogged > DAILY_HOURS_TARGET
                    ? t('time_tracking.above_target_today', { hours: fmtHours(todayLogged - DAILY_HOURS_TARGET) })
                    : t('time_tracking.today_complete')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={13} className="text-ink-faint" />
                  {t('time_tracking.remaining_today', { hours: fmtHours(todayRemaining) })}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="surface-card p-6">
          <div className="flex items-baseline justify-between mb-1">
            <div className="label-caps">{t('time_tracking.this_week')}</div>
            <div className="text-[12px] text-ink-faint tabular">
              {fmtHours(weekTotal)} / {weekTarget}h
            </div>
          </div>
          <div className="text-[11.5px] text-ink-faint mb-4">
            {t('time_tracking.week_target', { hours: weekTarget, days: workingDaysCount, target: DAILY_HOURS_TARGET })}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {weekDays.map((d) => {
              const iso = format(d, 'yyyy-MM-dd')
              const total = dayTotal(iso)
              const weekend = isWeekend(d)
              const future = parseISO(iso) > new Date() && !isToday(d)
              const filled = !weekend && total >= DAILY_HOURS_TARGET
              const partial = !weekend && total > 0 && total < DAILY_HOURS_TARGET
              const empty = !weekend && total === 0 && !future
              return (
                <div
                  key={iso}
                  className={cn(
                    'rounded-md border px-2 py-2.5 text-center flex flex-col items-center gap-1.5',
                    isToday(d) && 'ring-2 ring-tonton-500/30',
                    weekend
                      ? 'bg-surface/60 border-line text-ink-faint'
                      : future
                        ? 'bg-paper border-line text-ink-faint'
                        : filled
                          ? 'bg-working/8 border-working/30 text-working'
                          : partial
                            ? 'bg-pending/8 border-pending/30 text-pending'
                            : empty
                              ? 'bg-sick/12 border-sick/40 text-sick'
                              : 'bg-surface border-line text-ink-soft',
                  )}
                  title={
                    weekend
                      ? t('time_tracking.weekend_skipped')
                      : future
                        ? t('time_tracking.future_day')
                        : total >= DAILY_HOURS_TARGET
                          ? `${fmtHours(total)}h`
                          : t('time_tracking.incomplete_day', { hours: fmtHours(total), target: DAILY_HOURS_TARGET })
                  }
                >
                  <span className="text-[10px] uppercase tracking-caps font-medium">
                    {format(d, 'EEE', { locale })}
                  </span>
                  <span className="text-[12px] tabular font-semibold">
                    {format(d, 'd')}
                  </span>
                  <span className="text-[11px] tabular">
                    {weekend ? '—' : future ? '—' : `${fmtHours(total)}h`}
                  </span>
                  {filled && <Check size={10} className="opacity-80" />}
                  {partial && <AlertTriangle size={10} className="opacity-70" />}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* QUICK ADD */}
      <section className="surface-card p-5 lg:p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Plus size={15} className="text-tonton-500" />
          <h2 className="display text-[20px] text-ink">{t('time_tracking.log_form_title')}</h2>
        </div>
        <form onSubmit={submitNew} className="grid sm:grid-cols-[160px_120px_1fr_auto] gap-3 items-end">
          <Input
            label={t('time_tracking.date_label')}
            type="date"
            value={formDate}
            onChange={(e) => setFormDate(e.target.value)}
          />
          <Input
            label={t('time_tracking.hours_label')}
            type="number"
            step={0.25}
            min={0.25}
            max={24}
            value={formHours}
            onChange={(e) => setFormHours(e.target.value)}
            error={formErrors.hours}
            hint={!formErrors.hours ? t('time_tracking.hours_help') : undefined}
          />
          <Textarea
            label={t('time_tracking.description_label')}
            rows={1}
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            placeholder={t('time_tracking.description_ph')}
            error={formErrors.description}
          />
          <Button type="submit" variant="primary" iconLeft={<Sparkles size={14} />} loading={submitting}>
            {t('time_tracking.add_entry')}
          </Button>
        </form>
      </section>

      {/* HISTORY */}
      <section>
        <header className="flex items-end justify-between mb-4">
          <div>
            <h2 className="display text-[22px] text-ink">{t('time_tracking.history_title')}</h2>
            <p className="text-[13px] text-ink-soft mt-0.5">{t('time_tracking.history_intro')}</p>
          </div>
        </header>

        {entries.length === 0 ? (
          <EmptyState
            icon={<CalendarClock size={20} />}
            title={t('time_tracking.empty_title')}
            description={t('time_tracking.empty_desc')}
          />
        ) : (
          <div className="space-y-5">
            {historyDays.map(([iso, dayEntries]) => {
              const total = dayEntries.reduce((s, e) => s + Number(e.hours), 0)
              const dayDate = parseISO(iso)
              const weekend = isWeekend(dayDate)
              const missing = !weekend ? Math.max(0, DAILY_HOURS_TARGET - total) : 0
              const meets = !weekend && total >= DAILY_HOURS_TARGET
              return (
                <article key={iso} className="surface-card overflow-hidden">
                  <header className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-line bg-surface/40">
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <h3 className="display text-[18px] text-ink">
                        {format(dayDate, 'EEEE d MMMM', { locale })}
                      </h3>
                      {isToday(dayDate) && (
                        <span className="text-[10.5px] uppercase tracking-caps text-tonton-600">
                          {t('time_tracking.today')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[12.5px]">
                      <span className="tabular text-ink-soft">
                        {t('time_tracking.day_total', { count: Number(fmtHours(total)) })}
                      </span>
                      {weekend ? (
                        <span className="text-[11px] text-ink-faint italic">
                          {t('time_tracking.weekend_skipped')}
                        </span>
                      ) : meets ? (
                        <span className="inline-flex items-center gap-1 text-working font-medium">
                          <Check size={12} /> {DAILY_HOURS_TARGET}h
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-pending font-medium">
                          <AlertTriangle size={12} />
                          {t('time_tracking.missing', { count: Number(fmtHours(missing)) })}
                        </span>
                      )}
                    </div>
                  </header>

                  <ul className="divide-y divide-line">
                    {dayEntries
                      .sort((a, b) => b.created_at.localeCompare(a.created_at))
                      .map((entry) => (
                        <li key={entry.id} className="px-5 py-3.5 flex items-start gap-4 group">
                          <span className="tabular text-[13px] font-medium text-ink w-14 shrink-0">
                            {fmtHours(Number(entry.hours))}h
                          </span>
                          <p className="text-[13.5px] text-ink-soft flex-1 leading-snug whitespace-pre-wrap">
                            {entry.description}
                          </p>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setEditing(entry)}
                              className="text-ink-faint hover:text-ink p-1 rounded-sm"
                              aria-label={t('time_tracking.edit')}
                            >
                              <Edit3 size={12} />
                            </button>
                            <button
                              onClick={() => setDeleting(entry)}
                              className="text-ink-faint hover:text-sick p-1 rounded-sm"
                              aria-label={t('time_tracking.delete')}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </li>
                      ))}
                  </ul>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* EDIT DIALOG */}
      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={t('time_tracking.edit_dialog_title')}
        side="right"
      >
        {editing && (
          <EditEntryForm
            initial={editing}
            submitting={submitting}
            onSave={saveEdit}
            onCancel={() => setEditing(null)}
            labelDate={t('time_tracking.date_label')}
            labelHours={t('time_tracking.hours_label')}
            hoursHelp={t('time_tracking.hours_help')}
            labelDescription={t('time_tracking.description_label')}
            descPh={t('time_tracking.description_ph')}
            saveLabel={t('common.save')}
            cancelLabel={t('common.cancel')}
            descErr={t('time_tracking.description_err')}
            hoursErr={t('time_tracking.hours_err')}
            fmt={fmt}
          />
        )}
      </Dialog>

      {/* DELETE CONFIRM */}
      <Dialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={t('time_tracking.delete_dialog_title')}
        description={t('time_tracking.delete_dialog_desc')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)} disabled={removing}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={() => void confirmDelete()} loading={removing}>
              {t('time_tracking.delete_permanent')}
            </Button>
          </>
        }
      >
        {deleting && (
          <div className="rounded-md border border-sick/30 bg-sick/8 p-3 text-[13px]">
            <div className="flex items-baseline justify-between">
              <span className="font-medium text-ink">{fmt(deleting.work_date, 'd MMMM yyyy')}</span>
              <span className="tabular text-ink-soft">{fmtHours(Number(deleting.hours))}h</span>
            </div>
            <p className="text-ink-soft mt-1 italic">« {deleting.description} »</p>
          </div>
        )}
      </Dialog>
    </Layout>
  )
}

function EditEntryForm({
  initial, submitting, onSave, onCancel,
  labelDate, labelHours, hoursHelp, labelDescription, descPh,
  saveLabel, cancelLabel, descErr, hoursErr, fmt: _fmt,
}: {
  initial: TimeEntry
  submitting: boolean
  onSave: (e: TimeEntry) => Promise<void>
  onCancel: () => void
  labelDate: string
  labelHours: string
  hoursHelp: string
  labelDescription: string
  descPh: string
  saveLabel: string
  cancelLabel: string
  descErr: string
  hoursErr: string
  fmt: (iso: string, pattern?: string) => string
}) {
  const [date, setDate] = useState(initial.work_date)
  const [hours, setHours] = useState(String(initial.hours))
  const [description, setDescription] = useState(initial.description)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function submit(e: FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    const h = Number(hours)
    if (!Number.isFinite(h) || h <= 0 || h > 24) errs.hours = hoursErr
    if (!description.trim()) errs.description = descErr
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    void onSave({ ...initial, work_date: date, hours: h, description: description.trim() })
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-3">
        <Input label={labelDate} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input
          label={labelHours}
          type="number"
          step={0.25}
          min={0.25}
          max={24}
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          error={errors.hours}
          hint={!errors.hours ? hoursHelp : undefined}
        />
      </div>
      <Textarea
        label={labelDescription}
        rows={4}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={descPh}
        error={errors.description}
      />
      <div className="flex justify-end gap-2 pt-2 border-t border-line">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          {cancelLabel}
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          {saveLabel}
        </Button>
      </div>
    </form>
  )
}

