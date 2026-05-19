import { useEffect, useState } from 'react'
import { Camera, Trash2, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Employee, EmployeeRole } from '@/types'
import { COMMON_SKILLS, EMPLOYEE_ROLES } from '@/types'
import { Input, Select, Textarea } from './ui/Field'
import { Button } from './ui/Button'
import { SkillChip } from './ui/SkillChip'
import { Avatar } from './ui/Avatar'
import { cn, todayISO } from '@/lib/utils'
import { useRoleLabel } from '@/hooks/useLabels'

interface Props {
  initial?: Partial<Employee>
  onSubmit: (
    data: Omit<Employee, 'id' | 'created_at' | 'updated_at'>,
    avatarFile: File | null,
  ) => void | Promise<void>
  onCancel: () => void
  submitting?: boolean
  submitLabel?: string
}

const EMPTY: Omit<Employee, 'id' | 'created_at' | 'updated_at'> = {
  full_name: '',
  email: '',
  phone: '',
  role: 'agent',
  skills: [],
  avatar_url: null,
  hired_at: todayISO(),
  status: 'active',
}

export function EmployeeForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
  submitLabel,
}: Props) {
  const { t } = useTranslation()
  const roleLabel = useRoleLabel()
  const [state, setState] = useState({ ...EMPTY, ...initial })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initial?.avatar_url ?? null)
  const [skillDraft, setSkillDraft] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    setState({ ...EMPTY, ...initial })
    setAvatarPreview(initial?.avatar_url ?? null)
    setAvatarFile(null)
  }, [initial])

  const set = <K extends keyof typeof state>(k: K, v: (typeof state)[K]) =>
    setState((s) => ({ ...s, [k]: v }))

  function addSkill(s: string) {
    const v = s.trim()
    if (!v || state.skills.includes(v)) return
    set('skills', [...state.skills, v])
    setSkillDraft('')
  }

  function pickAvatarFile(file: File) {
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = () => setAvatarPreview(String(reader.result))
    reader.readAsDataURL(file)
  }

  function clearAvatar() {
    setAvatarFile(null)
    setAvatarPreview(null)
    set('avatar_url', null)
  }

  function submit() {
    const errs: Record<string, string> = {}
    if (!state.full_name.trim()) errs.full_name = t('employee_form.full_name_err')
    if (!/.+@.+\..+/.test(state.email)) errs.email = t('employee_form.email_err')
    setErrors(errs)
    if (Object.keys(errs).length === 0) void onSubmit(state, avatarFile)
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit() }} className="space-y-6">
      <div className="flex items-center gap-5">
        <div className="relative group">
          <Avatar name={state.full_name || '??'} src={avatarPreview} size={80} />
          <label className="absolute inset-0 grid place-items-center rounded-full bg-warm-900/45 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-white">
            <Camera size={18} />
            <input type="file" accept="image/*" className="sr-only"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) pickAvatarFile(f) }} />
          </label>
        </div>
        <div className="space-y-1.5">
          <div className="text-[13px] text-ink-soft">{t('employee_form.profile_picture')}</div>
          <div className="flex gap-1.5">
            <label className={cn(
              'inline-flex items-center justify-center h-8 px-3 text-[13px] rounded gap-1.5 cursor-pointer font-medium border',
              'bg-raised border-line hover:border-line-strong text-ink',
            )}>
              <Camera size={13} /> {t('employee_form.choose')}
              <input type="file" accept="image/*" className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) pickAvatarFile(f) }} />
            </label>
            {avatarPreview && (
              <Button type="button" size="sm" variant="ghost" iconLeft={<Trash2 size={13} />} onClick={clearAvatar}>
                {t('employee_form.remove')}
              </Button>
            )}
          </div>
          <p className="text-[11.5px] text-ink-faint">{t('employee_form.photo_hint')}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Input label={t('employee_form.full_name')} value={state.full_name}
          onChange={(e) => set('full_name', e.target.value)}
          placeholder={t('employee_form.full_name_ph')} error={errors.full_name} required />
        <Input label={t('employee_form.email')} type="email" value={state.email}
          onChange={(e) => set('email', e.target.value)}
          placeholder={t('employee_form.email_ph')} error={errors.email} required />
        <Input label={t('employee_form.phone')} value={state.phone ?? ''}
          onChange={(e) => set('phone', e.target.value)} placeholder={t('employee_form.phone_ph')} />
        <Select label={t('employee_form.role')} value={state.role}
          onChange={(e) => set('role', e.target.value as EmployeeRole)}>
          {EMPLOYEE_ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
        </Select>
        <Input label={t('employee_form.hired_at')} type="date" value={state.hired_at}
          onChange={(e) => set('hired_at', e.target.value)} />
        <Select label={t('employee_form.status')} value={state.status}
          onChange={(e) => set('status', e.target.value as 'active' | 'inactive')}>
          <option value="active">{t('employee_form.status_active')}</option>
          <option value="inactive">{t('employee_form.status_inactive')}</option>
        </Select>
      </div>

      <div>
        <div className="text-[12px] font-medium text-ink-soft mb-1.5">{t('employee_form.skills')}</div>
        <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
          {state.skills.length === 0 && (
            <span className="text-[12px] text-ink-faint italic">{t('employee_form.no_skills')}</span>
          )}
          {state.skills.map((s) => (
            <SkillChip key={s} label={s}
              onRemove={() => set('skills', state.skills.filter((k) => k !== s))} />
          ))}
        </div>
        <div className="flex gap-2">
          <input value={skillDraft} onChange={(e) => setSkillDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillDraft) } }}
            placeholder={t('employee_form.new_skill_ph')}
            className="flex-1 h-9 px-3 text-[13px] rounded-md bg-paper border border-line focus:border-tonton-500 outline-none" />
          <Button type="button" variant="secondary" size="sm" iconLeft={<Plus size={13} />}
            onClick={() => addSkill(skillDraft)}>{t('employee_form.add_skill')}</Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {COMMON_SKILLS.filter((s) => !state.skills.includes(s)).map((s) => (
            <SkillChip key={s} label={s} onClick={() => addSkill(s)} />
          ))}
        </div>
      </div>

      <Textarea label={t('employee_form.notes')} rows={2} placeholder={t('employee_form.notes_ph')} />

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
