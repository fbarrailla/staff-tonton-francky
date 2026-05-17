import { useEffect, useState } from 'react'
import { FileText, Link as LinkIcon, Mail, Paperclip, Phone, Plus, Trash2, User2, X } from 'lucide-react'
import type { Applicant, ApplicantStatus } from '@/types'
import { APPLICANT_STATUS_LABEL, COMMON_SKILLS } from '@/types'
import { Input, Select, Textarea } from './ui/Field'
import { Button } from './ui/Button'
import { SkillChip } from './ui/SkillChip'
import { cn, todayISO } from '@/lib/utils'

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
}

export function ApplicantForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
  submitLabel = 'Enregistrer',
}: Props) {
  const [state, setState] = useState({ ...EMPTY, ...initial })
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvName, setCvName] = useState<string | null>(initial?.cv_url ? 'CV existant' : null)
  const [motivFile, setMotivFile] = useState<File | null>(null)
  const [motivName, setMotivName] = useState<string | null>(
    initial?.motivation_letter_url ? 'Lettre existante' : null,
  )
  const [skillDraft, setSkillDraft] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    setState({ ...EMPTY, ...initial })
    setCvFile(null)
    setMotivFile(null)
    setCvName(initial?.cv_url ? 'CV existant' : null)
    setMotivName(initial?.motivation_letter_url ? 'Lettre existante' : null)
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
    if (!state.full_name.trim()) errs.full_name = 'Nom complet requis'
    if (!/.+@.+\..+/.test(state.email)) errs.email = 'E-mail invalide'
    if (state.portfolio_url && !/^https?:\/\//.test(state.portfolio_url))
      errs.portfolio_url = 'URL doit commencer par http(s)://'
    setErrors(errs)
    if (Object.keys(errs).length === 0) {
      void onSubmit(state, { cv: cvFile, motivation: motivFile })
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="space-y-6"
    >
      {/* Identity */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Input
          label="Nom complet"
          value={state.full_name}
          onChange={(e) => set('full_name', e.target.value)}
          placeholder="ex. Mariama Kane"
          iconLeft={<User2 size={14} />}
          error={errors.full_name}
          required
        />
        <Input
          label="Adresse e-mail"
          type="email"
          value={state.email}
          onChange={(e) => set('email', e.target.value)}
          placeholder="candidat@email.com"
          iconLeft={<Mail size={14} />}
          error={errors.email}
          required
        />
        <Input
          label="Téléphone"
          value={state.phone ?? ''}
          onChange={(e) => set('phone', e.target.value)}
          placeholder="+221 77 000 00 00"
          iconLeft={<Phone size={14} />}
        />
        <Input
          label="Poste visé"
          value={state.applied_position ?? ''}
          onChange={(e) => set('applied_position', e.target.value)}
          placeholder="ex. Agent de voyage"
        />
        <Input
          label="Date de candidature"
          type="date"
          value={state.applied_at}
          onChange={(e) => set('applied_at', e.target.value)}
        />
        <Select
          label="Statut"
          value={state.status}
          onChange={(e) => set('status', e.target.value as ApplicantStatus)}
        >
          {Object.entries(APPLICANT_STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </div>

      {/* Skills */}
      <div>
        <div className="text-[12px] font-medium text-ink-soft mb-1.5">Compétences</div>
        <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
          {state.skills.length === 0 && (
            <span className="text-[12px] text-ink-faint italic">Aucune compétence pour l'instant.</span>
          )}
          {state.skills.map((s) => (
            <SkillChip
              key={s}
              label={s}
              onRemove={() => set('skills', state.skills.filter((k) => k !== s))}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={skillDraft}
            onChange={(e) => setSkillDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addSkill(skillDraft)
              }
            }}
            placeholder="Nouvelle compétence — Entrée pour ajouter"
            className="flex-1 h-9 px-3 text-[13px] rounded-md bg-paper border border-line focus:border-tonton-500 outline-none"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            iconLeft={<Plus size={13} />}
            onClick={() => addSkill(skillDraft)}
          >
            Ajouter
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {COMMON_SKILLS.filter((s) => !state.skills.includes(s)).map((s) => (
            <SkillChip key={s} label={s} onClick={() => addSkill(s)} />
          ))}
        </div>
      </div>

      {/* Files */}
      <div className="grid sm:grid-cols-2 gap-4">
        <FilePicker
          label="CV"
          name={cvName}
          accept="application/pdf,.doc,.docx,image/*"
          onPick={(f) => {
            setCvFile(f)
            setCvName(f.name)
          }}
          onClear={() => {
            setCvFile(null)
            setCvName(null)
            set('cv_url', null)
          }}
        />
        <FilePicker
          label="Lettre de motivation"
          name={motivName}
          accept="application/pdf,.doc,.docx,image/*"
          onPick={(f) => {
            setMotivFile(f)
            setMotivName(f.name)
          }}
          onClear={() => {
            setMotivFile(null)
            setMotivName(null)
            set('motivation_letter_url', null)
          }}
        />
      </div>

      <Input
        label="Portfolio (URL)"
        value={state.portfolio_url ?? ''}
        onChange={(e) => set('portfolio_url', e.target.value)}
        placeholder="https://behance.net/… ou https://github.com/…"
        iconLeft={<LinkIcon size={14} />}
        error={errors.portfolio_url}
      />

      <Textarea
        label="Note interne (optionnel)"
        value={state.admin_note ?? ''}
        onChange={(e) => set('admin_note', e.target.value)}
        rows={3}
        placeholder="Premiers retours, points à creuser à l'entretien…"
      />

      <div className="flex justify-end gap-2 pt-2 border-t border-line">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Annuler
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

function FilePicker({
  label,
  name,
  accept,
  onPick,
  onClear,
}: {
  label: string
  name: string | null
  accept: string
  onPick: (f: File) => void
  onClear: () => void
}) {
  return (
    <div>
      <div className="text-[12px] font-medium text-ink-soft mb-1.5">{label}</div>
      {name ? (
        <div className="flex items-center justify-between rounded-md border border-line bg-surface px-3 py-2 text-[12.5px]">
          <span className="inline-flex items-center gap-2 text-ink truncate">
            <FileText size={13} className="text-tonton-500" /> {name}
          </span>
          <button
            type="button"
            onClick={onClear}
            className="text-ink-faint hover:text-sick"
            aria-label="Retirer"
          >
            <X size={13} />
          </button>
        </div>
      ) : (
        <label
          className={cn(
            'flex items-center gap-2 rounded-md border border-dashed border-line-strong/60 bg-surface/40 px-3 py-2.5 text-[12.5px] text-ink-soft cursor-pointer hover:bg-surface',
          )}
        >
          <Paperclip size={13} /> PDF, DOC, image…
          <input
            type="file"
            accept={accept}
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onPick(f)
            }}
          />
        </label>
      )}
    </div>
  )
}
