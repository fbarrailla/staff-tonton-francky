import { useEffect, useState } from 'react'
import { Calendar, Mail, Phone, Plus, User2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Intern, InternStatus } from '@/types'
import { COMMON_SKILLS } from '@/types'
import { Input, Select, Textarea } from './ui/Field'
import { Button } from './ui/Button'
import { SkillChip } from './ui/SkillChip'
import { todayISO } from '@/lib/utils'
import { useInternStatusLabel } from '@/hooks/useLabels'

interface Props {
  initial?: Partial<Intern>
  onSubmit: (data: Omit<Intern, 'id' | 'created_at' | 'updated_at'>) => void | Promise<void>
  onCancel: () => void
  submitting?: boolean
  submitLabel?: string
}

const EMPTY: Omit<Intern, 'id' | 'created_at' | 'updated_at'> = {
  full_name: '',
  email: '',
  phone: '',
  age: null,
  date_of_birth: null,
  applied_at: todayISO(),
  interview_at: '',
  status: 'pending',
  skills: [],
  admin_note: '',
}

const STATUSES: InternStatus[] = ['pending', 'active', 'hired', 'ended']

export function InternForm({ initial, onSubmit, onCancel, submitting, submitLabel }: Props) {
  const { t } = useTranslation()
  const statusLabel = useInternStatusLabel()

  const [state, setState] = useState({ ...EMPTY, ...initial })
  const [skillDraft, setSkillDraft] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    setState({ ...EMPTY, ...initial })
  }, [initial])

  const set = <K extends keyof typeof state>(k: K, v: (typeof state)[K]) =>
    setState((s) => ({ ...s, [k]: v }))

  function addSkill(s: string) {
    const v = s.trim()
    if (!v || state.skills.includes(v)) return
    set('skills', [...state.skills, v])
    setSkillDraft('')
  }

  function submit() {
    const errs: Record<string, string> = {}
    if (!state.full_name.trim()) errs.full_name = t('intern_form.full_name_err')
    if (!/.+@.+\..+/.test(state.email)) errs.email = t('intern_form.email_err')
    setErrors(errs)
    if (Object.keys(errs).length === 0) void onSubmit(state)
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit() }} className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label={t('intern_form.full_name')} value={state.full_name}
          onChange={(e) => set('full_name', e.target.value)}
          placeholder={t('intern_form.full_name_ph')}
          iconLeft={<User2 size={14} />} error={errors.full_name} required />
        <Input label={t('intern_form.email')} type="email" value={state.email}
          onChange={(e) => set('email', e.target.value)}
          placeholder={t('intern_form.email_ph')}
          iconLeft={<Mail size={14} />} error={errors.email} required />
        <Input label={t('intern_form.phone')} value={state.phone ?? ''}
          onChange={(e) => set('phone', e.target.value)}
          placeholder={t('intern_form.phone_ph')} iconLeft={<Phone size={14} />} />
        <Input label={t('common.date_of_birth')} type="date" value={state.date_of_birth ?? ''}
          onChange={(e) => set('date_of_birth', e.target.value || null)} />
        <Input label={t('intern_form.age')} type="number" min={14} max={99}
          value={state.age ?? ''}
          onChange={(e) => set('age', e.target.value ? Number(e.target.value) : null)} />
        <Input label={t('intern_form.applied_at')} type="date" value={state.applied_at ?? ''}
          onChange={(e) => set('applied_at', e.target.value || null)} />
        <Input label={t('intern_form.interview_at')} value={state.interview_at ?? ''}
          onChange={(e) => set('interview_at', e.target.value)}
          placeholder={t('intern_form.interview_ph')}
          iconLeft={<Calendar size={14} />} />
        <Select className="sm:col-span-2" label={t('intern_form.status')} value={state.status}
          onChange={(e) => set('status', e.target.value as InternStatus)}>
          {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
        </Select>
      </div>

      <div>
        <div className="text-[12px] font-medium text-ink-soft mb-1.5">{t('intern_form.skills')}</div>
        <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
          {state.skills.length === 0 && (
            <span className="text-[12px] text-ink-faint italic">{t('intern_form.no_skills')}</span>
          )}
          {state.skills.map((s) => (
            <SkillChip key={s} label={s}
              onRemove={() => set('skills', state.skills.filter((k) => k !== s))} />
          ))}
        </div>
        <div className="flex gap-2">
          <input value={skillDraft} onChange={(e) => setSkillDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillDraft) } }}
            placeholder={t('intern_form.new_skill_ph')}
            className="flex-1 h-9 px-3 text-[13px] rounded-md bg-paper border border-line focus:border-tonton-500 outline-none" />
          <Button type="button" variant="secondary" size="sm" iconLeft={<Plus size={13} />}
            onClick={() => addSkill(skillDraft)}>{t('intern_form.add_skill')}</Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {COMMON_SKILLS.filter((s) => !state.skills.includes(s)).slice(0, 12).map((s) => (
            <SkillChip key={s} label={s} onClick={() => addSkill(s)} />
          ))}
        </div>
      </div>

      <Textarea label={t('intern_form.admin_note')} value={state.admin_note ?? ''}
        onChange={(e) => set('admin_note', e.target.value)} rows={3}
        placeholder={t('intern_form.admin_note_ph')} />

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
