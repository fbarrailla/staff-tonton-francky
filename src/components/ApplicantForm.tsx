import { useEffect, useState } from 'react'
import { FileText, Link as LinkIcon, Mail, Paperclip, Phone, Plus, User2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Applicant, ApplicantStatus } from '@/types'
import { COMMON_SKILLS } from '@/types'
import { Input, Select, Textarea } from './ui/Field'
import { Button } from './ui/Button'
import { SkillChip } from './ui/SkillChip'
import { cn, todayISO } from '@/lib/utils'
import { useApplicantStatusLabel } from '@/hooks/useLabels'

interface Props {
  initial?: Partial<Applicant>
  onSubmit: (
    data: Omit<Applicant, 'id' | 'created_at' | 'updated_at'>,
    files: { cv: File | null; motivation: File | null },
  ) => void | Promise<void>
  onCancel: () => void
  submitting?: boolean
  submitLabel?: string
}

const EMPTY: Omit<Applicant, 'id' | 'created_at' | 'updated_at'> = {
  full_name: '',
  email: '',
  phone: '',
  skills: [],
  applied_position: '',
  status: 'nouveau',
  cv_url: null,
  motivation_letter_url: null,
  portfolio_url: '',
  admin_note: '',
  applied_at: todayISO(),
  date_of_birth: null,
}

const STATUSES: ApplicantStatus[] = ['nouveau', 'en_revue', 'entretien', 'embauche', 'refuse']

export function ApplicantForm({ initial, onSubmit, onCancel, submitting, submitLabel }: Props) {
  const { t } = useTranslation()
  const statusLabel = useApplicantStatusLabel()
  const [state, setState] = useState({ ...EMPTY, ...initial })
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvName, setCvName] = useState<string | null>(initial?.cv_url ? t('applicant_form.cv_existing') : null)
  const [motivFile, setMotivFile] = useState<File | null>(null)
  const [motivName, setMotivName] = useState<string | null>(
    initial?.motivation_letter_url ? t('applicant_form.motivation_existing') : null,
  )
  const [skillDraft, setSkillDraft] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    setState({ ...EMPTY, ...initial })
    setCvFile(null); setMotivFile(null)
    setCvName(initial?.cv_url ? t('applicant_form.cv_existing') : null)
    setMotivName(initial?.motivation_letter_url ? t('applicant_form.motivation_existing') : null)
  }, [initial, t])

  const set = <K extends keyof typeof state>(k: K, v: (typeof state)[K]) =>
    setState((s) => ({ ...s, [k]: v }))

  function addSkill(s: string) {
    const v = s.trim()
    if (!v || state.skills.includes(v)) return
    set('skills', [...state.skills, v]); setSkillDraft('')
  }

  function submit() {
    const errs: Record<string, string> = {}
    if (!state.full_name.trim()) errs.full_name = t('applicant_form.full_name_err')
    if (!/.+@.+\..+/.test(state.email)) errs.email = t('applicant_form.email_err')
    if (state.portfolio_url && !/^https?:\/\//.test(state.portfolio_url))
      errs.portfolio_url = t('applicant_form.portfolio_err')
    setErrors(errs)
    if (Object.keys(errs).length === 0)
      void onSubmit(state, { cv: cvFile, motivation: motivFile })
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit() }} className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label={t('applicant_form.full_name')} value={state.full_name}
          onChange={(e) => set('full_name', e.target.value)}
          placeholder={t('applicant_form.full_name_ph')}
          iconLeft={<User2 size={14} />} error={errors.full_name} required />
        <Input label={t('applicant_form.email')} type="email" value={state.email}
          onChange={(e) => set('email', e.target.value)}
          placeholder={t('applicant_form.email_ph')}
          iconLeft={<Mail size={14} />} error={errors.email} required />
        <Input label={t('applicant_form.phone')} value={state.phone ?? ''}
          onChange={(e) => set('phone', e.target.value)}
          placeholder={t('applicant_form.phone_ph')} iconLeft={<Phone size={14} />} />
        <Input label={t('applicant_form.position')} value={state.applied_position ?? ''}
          onChange={(e) => set('applied_position', e.target.value)}
          placeholder={t('applicant_form.position_ph')} />
        <Input label={t('applicant_form.applied_at')} type="date" value={state.applied_at}
          onChange={(e) => set('applied_at', e.target.value)} />
        <Input label={t('common.date_of_birth')} type="date" value={state.date_of_birth ?? ''}
          onChange={(e) => set('date_of_birth', e.target.value || null)} />
        <Select label={t('applicant_form.status')} value={state.status}
          onChange={(e) => set('status', e.target.value as ApplicantStatus)}>
          {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
        </Select>
      </div>

      <div>
        <div className="text-[12px] font-medium text-ink-soft mb-1.5">{t('applicant_form.skills')}</div>
        <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
          {state.skills.length === 0 && (
            <span className="text-[12px] text-ink-faint italic">{t('applicant_form.no_skills')}</span>
          )}
          {state.skills.map((s) => (
            <SkillChip key={s} label={s} onRemove={() => set('skills', state.skills.filter((k) => k !== s))} />
          ))}
        </div>
        <div className="flex gap-2">
          <input value={skillDraft} onChange={(e) => setSkillDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillDraft) } }}
            placeholder={t('applicant_form.new_skill_ph')}
            className="flex-1 h-9 px-3 text-[13px] rounded-md bg-paper border border-line focus:border-tonton-500 outline-none" />
          <Button type="button" variant="secondary" size="sm" iconLeft={<Plus size={13} />}
            onClick={() => addSkill(skillDraft)}>{t('applicant_form.add_skill')}</Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {COMMON_SKILLS.filter((s) => !state.skills.includes(s)).map((s) => (
            <SkillChip key={s} label={s} onClick={() => addSkill(s)} />
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <FilePicker label={t('applicant_form.cv')} name={cvName}
          hint={t('applicant_form.file_hint')}
          accept="application/pdf,.doc,.docx,image/*"
          onPick={(f) => { setCvFile(f); setCvName(f.name) }}
          onClear={() => { setCvFile(null); setCvName(null); set('cv_url', null) }} />
        <FilePicker label={t('applicant_form.motivation')} name={motivName}
          hint={t('applicant_form.file_hint')}
          accept="application/pdf,.doc,.docx,image/*"
          onPick={(f) => { setMotivFile(f); setMotivName(f.name) }}
          onClear={() => { setMotivFile(null); setMotivName(null); set('motivation_letter_url', null) }} />
      </div>

      <Input label={t('applicant_form.portfolio_url')} value={state.portfolio_url ?? ''}
        onChange={(e) => set('portfolio_url', e.target.value)}
        placeholder={t('applicant_form.portfolio_ph')}
        iconLeft={<LinkIcon size={14} />} error={errors.portfolio_url} />

      <Textarea label={t('applicant_form.internal_note')} value={state.admin_note ?? ''}
        onChange={(e) => set('admin_note', e.target.value)} rows={3}
        placeholder={t('applicant_form.internal_note_ph')} />

      <div className="flex justify-end gap-2 pt-2 border-t border-line">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          {submitLabel ?? t('common.save')}
        </Button>
      </div>
    </form>
  )
}

function FilePicker({
  label, name, hint, accept, onPick, onClear,
}: {
  label: string; name: string | null; hint: string; accept: string
  onPick: (f: File) => void; onClear: () => void
}) {
  return (
    <div>
      <div className="text-[12px] font-medium text-ink-soft mb-1.5">{label}</div>
      {name ? (
        <div className="flex items-center justify-between rounded-md border border-line bg-surface px-3 py-2 text-[12.5px]">
          <span className="inline-flex items-center gap-2 text-ink truncate">
            <FileText size={13} className="text-tonton-500" /> {name}
          </span>
          <button type="button" onClick={onClear} className="text-ink-faint hover:text-sick" aria-label="Clear">
            <X size={13} />
          </button>
        </div>
      ) : (
        <label className="flex items-center gap-2 rounded-md border border-dashed border-line-strong/60 bg-surface/40 px-3 py-2.5 text-[12.5px] text-ink-soft cursor-pointer hover:bg-surface">
          <Paperclip size={13} /> {hint}
          <input type="file" accept={accept} className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f) }} />
        </label>
      )}
    </div>
  )
}
