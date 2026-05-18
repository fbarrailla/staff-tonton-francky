import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  Users,
  X,
  FileText,
  Link as LinkIcon,
  ArrowUpRight,
} from 'lucide-react'
import { Layout } from '@/components/Layout'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkillChip } from '@/components/ui/SkillChip'
import { Tabs } from '@/components/ui/Tabs'
import { useApplicants } from '@/hooks/useStore'
import { mutate } from '@/lib/store'
import { uploadApplicantFile } from '@/lib/storage'
import {
  APPLICANT_STATUS_LABEL,
  COMMON_SKILLS,
  type Applicant,
  type ApplicantStatus,
} from '@/types'
import { ApplicantForm } from '@/components/ApplicantForm'
import { useToast } from '@/contexts/ToastContext'
import { formatDate, formatError } from '@/lib/utils'

type StatusFilter = 'all' | ApplicantStatus

const STATUS_TONE: Record<ApplicantStatus, 'neutral' | 'pending' | 'approved' | 'working' | 'rejected'> = {
  nouveau: 'neutral',
  en_revue: 'pending',
  entretien: 'approved',
  embauche: 'working',
  refuse: 'rejected',
}

export function Applicants() {
  const applicants = useApplicants()
  const toast = useToast()

  const [q, setQ] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [skills, setSkills] = useState<string[]>([])
  const [openAdd, setOpenAdd] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = {
      all: applicants.length,
      nouveau: 0,
      en_revue: 0,
      entretien: 0,
      embauche: 0,
      refuse: 0,
    }
    applicants.forEach((a) => {
      c[a.status]++
    })
    return c
  }, [applicants])

  const filtered = applicants
    .filter((a) => {
      if (status !== 'all' && a.status !== status) return false
      if (skills.length > 0 && !skills.every((s) => a.skills.includes(s))) return false
      if (q.trim()) {
        const needle = q.toLowerCase()
        const hay = `${a.full_name} ${a.email} ${a.phone ?? ''} ${a.applied_position ?? ''} ${a.skills.join(' ')}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
    .sort((a, b) => b.applied_at.localeCompare(a.applied_at))

  const allSkills = useMemo(() => {
    const set = new Set<string>(COMMON_SKILLS)
    applicants.forEach((a) => a.skills.forEach((s) => set.add(s)))
    return Array.from(set).sort((x, y) => x.localeCompare(y, 'fr'))
  }, [applicants])

  async function handleAdd(
    data: Omit<Applicant, 'id' | 'created_at' | 'updated_at'>,
    files: { cv: File | null; motivation: File | null },
  ) {
    setSubmitting(true)
    try {
      let cv_url = data.cv_url
      let motivation_letter_url = data.motivation_letter_url
      if (files.cv) cv_url = await uploadApplicantFile(files.cv, 'cv')
      if (files.motivation)
        motivation_letter_url = await uploadApplicantFile(files.motivation, 'motivation')
      await mutate.addApplicant({ ...data, cv_url, motivation_letter_url })
      setOpenAdd(false)
      toast.success('Candidature enregistrée', data.full_name)
    } catch (e) {
      toast.error('Ajout impossible', formatError(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout eyebrow="Recrutement" title="Candidats">
      <header className="flex items-end justify-between gap-4 flex-wrap mb-5">
        <p className="text-[14px] text-ink-soft max-w-[60ch]">
          Pipeline des candidatures Tonton Francky — du premier contact à l'embauche.
          Chaque fiche regroupe CV, lettre de motivation et portfolio.
        </p>
        <Button variant="primary" iconLeft={<Plus size={14} />} onClick={() => setOpenAdd(true)}>
          Nouvelle candidature
        </Button>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher par nom, e-mail, poste…"
            className="w-full h-10 pl-9 pr-9 text-sm rounded-md bg-paper border border-line focus:border-tonton-500 outline-none"
          />
          {q && (
            <button
              onClick={() => setQ('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink p-1"
              aria-label="Effacer"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <Tabs<StatusFilter>
          value={status}
          onChange={setStatus}
          items={[
            { value: 'all', label: 'Tous', count: counts.all },
            { value: 'nouveau', label: 'Nouveaux', count: counts.nouveau },
            { value: 'en_revue', label: 'En revue', count: counts.en_revue },
            { value: 'entretien', label: 'Entretiens', count: counts.entretien },
            { value: 'embauche', label: 'Embauchés', count: counts.embauche },
            { value: 'refuse', label: 'Refusés', count: counts.refuse },
          ]}
        />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-6">
        <span className="text-[11.5px] text-ink-faint uppercase tracking-caps mr-1 self-center">
          Compétences
        </span>
        {allSkills.slice(0, 14).map((s) => (
          <SkillChip
            key={s}
            label={s}
            selected={skills.includes(s)}
            onClick={() =>
              setSkills((cur) => (cur.includes(s) ? cur.filter((k) => k !== s) : [...cur, s]))
            }
          />
        ))}
        {skills.length > 0 && (
          <button
            onClick={() => setSkills([])}
            className="text-[11.5px] text-ink-faint hover:text-ink underline underline-offset-2"
          >
            tout effacer
          </button>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={20} />}
          title={
            applicants.length === 0
              ? 'Aucune candidature pour l\'instant'
              : 'Aucun candidat ne correspond'
          }
          description={
            applicants.length === 0
              ? 'Ajoutez la première candidature pour commencer à constituer votre vivier.'
              : 'Essayez d\'élargir vos filtres.'
          }
          action={
            <Button variant="primary" onClick={() => setOpenAdd(true)}>
              Ajouter
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((a) => (
            <Link
              key={a.id}
              to={`/candidats/${a.id}`}
              className="group surface-card p-5 hover:shadow-raise transition-shadow flex flex-col gap-4 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 size-32 bg-tonton-500/0 group-hover:bg-tonton-500/8 transition-colors blur-2xl rounded-full -translate-y-12 translate-x-12 pointer-events-none" />
              <div className="flex items-start gap-3.5">
                <Avatar name={a.full_name} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="display text-[17px] leading-tight text-ink truncate">
                    {a.full_name}
                  </div>
                  <div className="text-[12.5px] text-ink-soft mt-0.5 truncate">
                    {a.applied_position || 'Poste non spécifié'}
                  </div>
                </div>
                <Badge tone={STATUS_TONE[a.status]} dot>
                  {APPLICANT_STATUS_LABEL[a.status]}
                </Badge>
              </div>

              <div className="text-[12px] text-ink-soft space-y-1">
                <div className="truncate">{a.email}</div>
                {a.phone && <div className="tabular text-ink-faint">{a.phone}</div>}
              </div>

              {a.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-auto">
                  {a.skills.slice(0, 4).map((s) => (
                    <span
                      key={s}
                      className="text-[11px] text-ink-soft bg-surface border border-line rounded-full px-2 py-0.5"
                    >
                      {s}
                    </span>
                  ))}
                  {a.skills.length > 4 && (
                    <span className="text-[11px] text-ink-faint px-1.5 py-0.5">
                      +{a.skills.length - 4}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-ink-faint border-t border-line pt-3 mt-1">
                <span>Reçu·e le {formatDate(a.applied_at, 'd MMM yyyy')}</span>
                <span className="flex items-center gap-2.5">
                  {a.cv_url && (
                    <span className="inline-flex items-center gap-0.5" title="CV joint">
                      <FileText size={11} /> CV
                    </span>
                  )}
                  {a.portfolio_url && (
                    <span className="inline-flex items-center gap-0.5" title="Portfolio">
                      <LinkIcon size={11} /> Portfolio
                    </span>
                  )}
                  <ArrowUpRight
                    size={12}
                    className="text-ink-faint group-hover:text-tonton-500 transition-colors"
                  />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Dialog
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        title="Nouvelle candidature"
        description="Cette fiche apparaîtra immédiatement dans le pipeline."
        side="right"
      >
        <ApplicantForm
          onSubmit={handleAdd}
          onCancel={() => setOpenAdd(false)}
          submitLabel="Enregistrer"
          submitting={submitting}
        />
      </Dialog>
    </Layout>
  )
}
