import { useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import type { DayOff, Employee } from '@/types'
import { Input, Textarea, Select } from './ui/Field'
import { Button } from './ui/Button'
import { mutate } from '@/lib/store'
import { inclusiveDayCount, todayISO } from '@/lib/utils'
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

  const balance = useMemo(() => {
    if (!employee_id) return null
    return monthlyDayOffBalance(employee_id, existingDaysOff)
  }, [employee_id, existingDaysOff])

  const wouldExceed = balance ? balance.used + days > balance.quota : false

  async function submit() {
    const errs: Record<string, string> = {}
    if (!employee_id) errs.employee_id = 'Choisissez un·e salarié·e'
    if (end_date < start_date) errs.end_date = 'La fin doit être après le début'
    if (!reason.trim()) errs.reason = 'Précisez un motif'
    if (wouldExceed && !override) {
      errs.override = `Dépasse le quota de 4 jours / mois (actuellement ${balance?.used} utilisés). Activez l'override admin pour valider.`
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
          employee_id,
          start_date,
          end_date,
          number_of_days: days,
          status,
          reason,
          admin_note: override ? 'Override admin — dépassement du quota' : null,
        })
      }
      onSaved()
    } catch (e) {
      toast.error('Enregistrement impossible', e instanceof Error ? e.message : String(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
      className="space-y-5"
    >
      {!employee && employees && (
        <Select
          label="Salarié·e"
          value={employee_id}
          onChange={(e) => setEmployeeId(e.target.value)}
          error={errors.employee_id}
        >
          <option value="" disabled>— Choisir —</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.full_name}
            </option>
          ))}
        </Select>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Du"
          type="date"
          value={start_date}
          onChange={(e) => {
            setStart(e.target.value)
            if (e.target.value > end_date) setEnd(e.target.value)
          }}
        />
        <Input
          label="Au"
          type="date"
          value={end_date}
          min={start_date}
          onChange={(e) => setEnd(e.target.value)}
          error={errors.end_date}
        />
      </div>

      <div className="flex items-center justify-between rounded-md border border-line bg-surface px-3 py-2.5">
        <span className="text-[12.5px] text-ink-soft">Durée</span>
        <span className="tabular text-[14px] text-ink">
          {days} jour{days > 1 ? 's' : ''}
        </span>
      </div>

      {balance && (
        <div className="text-[12.5px]">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-ink-soft">Solde du mois pour cette personne</span>
            <span className="tabular text-ink-faint">
              {balance.used}/{balance.quota}
            </span>
          </div>
          <div className="h-1.5 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-tonton-500 transition-all"
              style={{ width: `${Math.min(100, (balance.used / balance.quota) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {wouldExceed && (
        <label className="flex items-start gap-2.5 rounded-md border border-pending/40 bg-pending/8 px-3 py-2.5">
          <input
            type="checkbox"
            checked={override}
            onChange={(e) => setOverride(e.target.checked)}
            className="mt-0.5 accent-pending"
          />
          <span className="text-[12.5px]">
            <span className="inline-flex items-center gap-1 font-medium text-ink">
              <AlertTriangle size={12} className="text-pending" />
              Dépassement du quota
            </span>
            <span className="block text-ink-soft mt-0.5">
              Cette demande porterait le total à {(balance?.used ?? 0) + days}/4. Cochez pour valider en tant qu'admin.
            </span>
          </span>
        </label>
      )}
      {errors.override && (
        <p className="text-[12px] text-sick">{errors.override}</p>
      )}

      <Textarea
        label="Motif"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Ex. Voyage familial, repos personnel…"
        error={errors.reason}
        rows={3}
      />

      <Select
        label="Statut"
        value={status}
        onChange={(e) => setStatus(e.target.value as DayOff['status'])}
      >
        <option value="pending">En attente</option>
        <option value="approved">Approuvé</option>
        <option value="rejected">Refusé</option>
      </Select>

      <div className="flex justify-end gap-2 pt-2 border-t border-line">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Annuler
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          {initial ? 'Enregistrer' : 'Créer la demande'}
        </Button>
      </div>
    </form>
  )
}
