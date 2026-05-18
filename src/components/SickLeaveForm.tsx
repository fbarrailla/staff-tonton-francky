import { useMemo, useState } from 'react'
import { Paperclip, X } from 'lucide-react'
import type { Employee, SickLeave } from '@/types'
import { Input, Textarea, Select } from './ui/Field'
import { Button } from './ui/Button'
import { mutate } from '@/lib/store'
import { uploadCertificate } from '@/lib/storage'
import { formatError, inclusiveDayCount, todayISO } from '@/lib/utils'
import { useToast } from '@/contexts/ToastContext'
import { addDays, format } from 'date-fns'

interface Props {
  employee?: Employee
  employees?: Employee[]
  initial?: SickLeave
  onSaved: () => void
  onCancel: () => void
}

export function SickLeaveForm({ employee, employees, initial, onSaved, onCancel }: Props) {
  const toast = useToast()
  const [employee_id, setEmployeeId] = useState(
    initial?.employee_id ?? employee?.id ?? employees?.[0]?.id ?? '',
  )
  const [start_date, setStart] = useState(initial?.start_date ?? todayISO())
  const [end_date, setEnd] = useState(initial?.end_date ?? format(addDays(new Date(), 2), 'yyyy-MM-dd'))
  const [reason, setReason] = useState(initial?.reason ?? '')
  const [certFile, setCertFile] = useState<File | null>(null)
  const [certName, setCertName] = useState<string | null>(
    initial?.medical_certificate_url ? 'Certificat joint' : null,
  )
  const [keepExistingCert, setKeepExistingCert] = useState<boolean>(
    !!initial?.medical_certificate_url,
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const days = useMemo(() => inclusiveDayCount(start_date, end_date), [start_date, end_date])

  function pickFile(f: File) {
    setCertFile(f)
    setCertName(f.name)
    setKeepExistingCert(false)
  }

  function clearCert() {
    setCertFile(null)
    setCertName(null)
    setKeepExistingCert(false)
  }

  async function submit() {
    const errs: Record<string, string> = {}
    if (!employee_id) errs.employee_id = 'Choisissez un·e salarié·e'
    if (end_date < start_date) errs.end_date = 'La fin doit être après le début'
    if (!reason.trim()) errs.reason = 'Précisez un motif'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitting(true)
    try {
      let medical_certificate_url: string | null = initial?.medical_certificate_url ?? null
      if (certFile) {
        medical_certificate_url = await uploadCertificate(certFile)
      } else if (!keepExistingCert) {
        medical_certificate_url = null
      }

      if (initial) {
        await mutate.updateSickLeave(initial.id, {
          employee_id,
          start_date,
          end_date,
          number_of_days: days,
          reason,
          medical_certificate_url,
        })
      } else {
        await mutate.addSickLeave({
          employee_id,
          start_date,
          end_date,
          number_of_days: days,
          reason,
          medical_certificate_url,
        })
      }
      onSaved()
    } catch (e) {
      toast.error('Enregistrement impossible', formatError(e))
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
          min={start_date}
          value={end_date}
          onChange={(e) => setEnd(e.target.value)}
          error={errors.end_date}
        />
      </div>

      <div className="flex items-center justify-between rounded-md border border-sick/30 bg-sick/8 px-3 py-2.5">
        <span className="text-[12.5px] text-ink-soft">Durée de l'arrêt</span>
        <span className="tabular text-[14px] text-sick">
          {days} jour{days > 1 ? 's' : ''}
        </span>
      </div>

      <div className="text-[11.5px] text-ink-faint -mt-2.5 italic">
        Les arrêts maladie ne décomptent pas du quota de 4 jours / mois.
      </div>

      <Textarea
        label="Motif / Note"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Ex. grippe saisonnière, repos prescrit…"
        rows={2}
        error={errors.reason}
      />

      <div>
        <div className="text-[12px] font-medium text-ink-soft mb-1.5">Certificat médical (facultatif)</div>
        {certName ? (
          <div className="flex items-center justify-between rounded-md border border-line bg-surface px-3 py-2 text-[12.5px]">
            <span className="inline-flex items-center gap-2 text-ink truncate">
              <Paperclip size={13} /> {certName}
            </span>
            <button
              type="button"
              onClick={clearCert}
              className="text-ink-faint hover:text-sick"
              aria-label="Retirer"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-2 rounded-md border border-dashed border-line-strong/60 bg-surface/40 px-3 py-2.5 text-[12.5px] text-ink-soft cursor-pointer hover:bg-surface">
            <Paperclip size={13} /> Téléverser PDF, JPG ou PNG…
            <input
              type="file"
              accept="application/pdf,image/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) pickFile(f)
              }}
            />
          </label>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-line">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Annuler
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          {initial ? 'Enregistrer' : 'Créer l\'arrêt'}
        </Button>
      </div>
    </form>
  )
}
