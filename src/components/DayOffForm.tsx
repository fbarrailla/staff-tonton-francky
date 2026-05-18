import { useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { DayOff, Employee } from '@/types'
import { Input, Textarea, Select } from './ui/Field'
import { Button } from './ui/Button'
import { mutate } from '@/lib/store'
import { formatError, inclusiveDayCount, todayISO } from '@/lib/utils'
import { monthlyDayOffBalance } from '@/lib/derived'
import { useToast } from '@/contexts/ToastContext'
import { addDays, format } from 'date-fns'

interface Props {
  employee?: Employee
  employees?: Employee[]
  existingDaysOff: DayOff[]
  initial?: DayOff
  onSaved: () => void
  onCancel: () => void
}

export function DayOffForm({ employee, employees, existingDaysOff, initial, onSaved, onCancel }: Props) {
  const { t } = useTranslation()
  const toast = useToast()
  const [employee_id, setEmployeeId] = useState<string>(
    initial?.employee_id ?? employee?.id ?? employees?.[0]?.id ?? '',
  )
  const [start_date, setStart] = useState(initial?.start_date ?? todayISO())
  const [end_date, setEnd] = useState(initial?.end_date ?? format(addDays(new Date(), 1), 'yyyy-MM-dd'))
  const [reason, setReason] = useState(initial?.reason ?? '')
  const [status, setStatus] = useState<DayOff['status']>(initial?.status ?? 'pending')
  const [override, setOverride] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const days = useMemo(() => inclusiveDayCount(start_date, end_date), [start_date, end_date])
  const balance = useMemo(
    () => employee_id ? monthlyDayOffBalance(employee_id, existingDaysOff) : null,
    [employee_id, existingDaysOff],
  )
  const wouldExceed = balance ? balance.used + days > balance.quota : false

  async function submit() {
    const errs: Record<string, string> = {}
    if (!employee_id) errs.employee_id = t('day_off_form.err_employee')
    if (end_date < start_date) errs.end_date = t('day_off_form.err_end')
    if (!reason.trim()) errs.reason = t('day_off_form.err_reason')
    if (wouldExceed && !override) {
      errs.override = t('day_off_form.err_override', { used: balance?.used })
    }
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSubmitting(true)
    try {
      if (initial) {
        await mutate.updateDayOff(initial.id, {
          employee_id, start_date, end_date, number_of_days: days, reason, status,
        })
      } else {
        await mutate.addDayOff({
          employee_id, start_date, end_date, number_of_days: days, status, reason,
          admin_note: override ? t('day_off_form.override_admin_note') : null,
        })
      }
      onSaved()
    } catch (e) {
      toast.error(t('errors.save_failed'), formatError(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); void submit() }} className="space-y-5">
      {!employee && employees && (
        <Select label={t('day_off_form.employee')} value={employee_id}
          onChange={(e) => setEmployeeId(e.target.value)} error={errors.employee_id}>
          <option value="" disabled>{t('day_off_form.choose')}</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
        </Select>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Input label={t('day_off_form.from')} type="date" value={start_date}
          onChange={(e) => { setStart(e.target.value); if (e.target.value > end_date) setEnd(e.target.value) }} />
        <Input label={t('day_off_form.to')} type="date" value={end_date} min={start_date}
          onChange={(e) => setEnd(e.target.value)} error={errors.end_date} />
      </div>

      <div className="flex items-center justify-between rounded-md border border-line bg-surface px-3 py-2.5">
        <span className="text-[12.5px] text-ink-soft">{t('day_off_form.duration')}</span>
        <span className="tabular text-[14px] text-ink">{t('common.day', { count: days })}</span>
      </div>

      {balance && (
        <div className="text-[12.5px]">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-ink-soft">{t('day_off_form.monthly_balance')}</span>
            <span className="tabular text-ink-faint">{balance.used}/{balance.quota}</span>
          </div>
          <div className="h-1.5 bg-surface rounded-full overflow-hidden">
            <div className="h-full bg-tonton-500 transition-all"
              style={{ width: `${Math.min(100, (balance.used / balance.quota) * 100)}%` }} />
          </div>
        </div>
      )}

      {wouldExceed && (
        <label className="flex items-start gap-2.5 rounded-md border border-pending/40 bg-pending/8 px-3 py-2.5">
          <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)}
            className="mt-0.5 accent-pending" />
          <span className="text-[12.5px]">
            <span className="inline-flex items-center gap-1 font-medium text-ink">
              <AlertTriangle size={12} className="text-pending" />
              {t('day_off_form.exceeds_title')}
            </span>
            <span className="block text-ink-soft mt-0.5">
              {t('day_off_form.exceeds_body', { total: (balance?.used ?? 0) + days })}
            </span>
          </span>
        </label>
      )}
      {errors.override && <p className="text-[12px] text-sick">{errors.override}</p>}

      <Textarea label={t('day_off_form.reason')} value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder={t('day_off_form.reason_ph')} error={errors.reason} rows={3} />

      <Select label={t('day_off_form.status')} value={status}
        onChange={(e) => setStatus(e.target.value as DayOff['status'])}>
        <option value="pending">{t('day_off_form.status_pending')}</option>
        <option value="approved">{t('day_off_form.status_approved')}</option>
        <option value="rejected">{t('day_off_form.status_rejected')}</option>
      </Select>

      <div className="flex justify-end gap-2 pt-2 border-t border-line">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          {initial ? t('day_off_form.save') : t('day_off_form.create_request')}
        </Button>
      </div>
    </form>
  )
}
