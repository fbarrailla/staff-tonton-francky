import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Users, X } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkillChip } from '@/components/ui/SkillChip'
import { Tabs } from '@/components/ui/Tabs'
import { useDaysOff, useEmployees, useSickLeaves } from '@/hooks/useStore'
import { mutate } from '@/lib/store'
import { uploadAvatar } from '@/lib/storage'
import { COMMON_SKILLS, ROLE_LABEL, type EmployeeRole, type Employee } from '@/types'
import { employeeStatusToday } from '@/lib/derived'
import { EmployeeForm } from '@/components/EmployeeForm'
import { useToast } from '@/contexts/ToastContext'
import { cn, formatDate, formatError } from '@/lib/utils'

type StatusFilter = 'all' | 'working' | 'off' | 'sick'

export function Employees() {
  const employees = useEmployees()
  const daysOff = useDaysOff()
  const sickLeaves = useSickLeaves()
  const toast = useToast()

  const [q, setQ] = useState('')
  const [role, setRole] = useState<'all' | EmployeeRole>('all')
  const [skills, setSkills] = useState<string[]>([])
  const [status, setStatus] = useState<StatusFilter>('all')
  const [openAdd, setOpenAdd] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const enriched = useMemo(
    () =>
      employees.map((e) => ({
        e,
        s: employeeStatusToday(e, daysOff, sickLeaves),
      })),
    [employees, daysOff, sickLeaves],
  )

  const counts = {
    all: enriched.length,
    working: enriched.filter((x) => x.s.status === 'working').length,
    off: enriched.filter((x) => x.s.status === 'off').length,
    sick: enriched.filter((x) => x.s.status === 'sick').length,
  }

  const filtered = enriched
    .filter(({ e, s }) => {
      if (status !== 'all' && s.status !== status) return false
      if (role !== 'all' && e.role !== role) return false
      if (skills.length > 0 && !skills.every((sk) => e.skills.includes(sk))) return false
      if (q.trim()) {
        const needle = q.toLowerCase()
        const hay = `${e.full_name} ${e.email} ${e.phone ?? ''} ${e.skills.join(' ')}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
    .sort((a, b) => a.e.full_name.localeCompare(b.e.full_name, 'fr'))

  const allSkills = useMemo(() => {
    const set = new Set<string>(COMMON_SKILLS)
    employees.forEach((e) => e.skills.forEach((s) => set.add(s)))
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'))
  }, [employees])

  async function handleAdd(
    data: Omit<Employee, 'id' | 'created_at' | 'updated_at'>,
    avatarFile: File | null,
  ) {
    setSubmitting(true)
    try {
      let avatar_url = data.avatar_url
      if (avatarFile) avatar_url = await uploadAvatar(avatarFile)
      await mutate.addEmployee({ ...data, avatar_url })
      setOpenAdd(false)
      toast.success('Salarié·e ajouté·e', data.full_name)
    } catch (e) {
      toast.error('Ajout impossible', formatError(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout eyebrow="Ressources humaines" title="Équipe">
      <header className="flex items-end justify-between gap-4 flex-wrap mb-5">
        <div>
          <p className="text-[14px] text-ink-soft max-w-[60ch]">
            Toute l'équipe Tonton Francky — agents de voyage, équipe tech, édition et support.
            Cliquez sur un·e salarié·e pour ouvrir sa fiche.
          </p>
        </div>
        <Button variant="primary" iconLeft={<Plus size={14} />} onClick={() => setOpenAdd(true)}>
          Ajouter un·e salarié·e
        </Button>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher par nom, e-mail, téléphone…"
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

        <select
          value={role}
          onChange={(e) => setRole(e.target.value as 'all' | EmployeeRole)}
          className="h-10 px-3 pr-8 text-sm rounded-md bg-paper border border-line focus:border-tonton-500 outline-none"
        >
          <option value="all">Tous les rôles</option>
          {Object.entries(ROLE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>

        <Tabs<StatusFilter>
          value={status}
          onChange={setStatus}
          items={[
            { value: 'all', label: 'Tous', count: counts.all },
            { value: 'working', label: 'En poste', count: counts.working },
            { value: 'off', label: 'En congé', count: counts.off },
            { value: 'sick', label: 'En arrêt', count: counts.sick },
          ]}
        />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-6">
        <span className="text-[11.5px] text-ink-faint uppercase tracking-caps mr-1 self-center">Compétences</span>
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
          title="Aucun·e salarié·e ne correspond"
          description="Essayez d'élargir vos filtres ou ajoutez votre première personne à l'équipe."
          action={<Button variant="primary" onClick={() => setOpenAdd(true)}>Ajouter</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(({ e, s }) => (
            <Link
              key={e.id}
              to={`/equipe/${e.id}`}
              className="group surface-card p-5 hover:shadow-raise transition-shadow flex flex-col gap-4 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 size-32 bg-tonton-500/0 group-hover:bg-tonton-500/8 transition-colors blur-2xl rounded-full -translate-y-12 translate-x-12 pointer-events-none" />
              <div className="flex items-start gap-3.5">
                <Avatar name={e.full_name} src={e.avatar_url} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="display text-[17px] leading-tight text-ink truncate">
                    {e.full_name}
                  </div>
                  <div className="text-[12.5px] text-ink-soft mt-0.5">{ROLE_LABEL[e.role]}</div>
                </div>
                {s.status === 'working' && <Badge tone="working" dot>En poste</Badge>}
                {s.status === 'off' && <Badge tone="approved" dot>En congé</Badge>}
                {s.status === 'sick' && <Badge tone="sick" dot>En arrêt</Badge>}
              </div>

              <div className="text-[12px] text-ink-soft space-y-1">
                <div className="truncate">{e.email}</div>
                {e.phone && <div className="tabular text-ink-faint">{e.phone}</div>}
              </div>

              {e.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-auto pt-1">
                  {e.skills.slice(0, 4).map((s) => (
                    <span
                      key={s}
                      className="text-[11px] text-ink-soft bg-surface border border-line rounded-full px-2 py-0.5"
                    >
                      {s}
                    </span>
                  ))}
                  {e.skills.length > 4 && (
                    <span className="text-[11px] text-ink-faint px-1.5 py-0.5">
                      +{e.skills.length - 4}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-ink-faint border-t border-line pt-3 mt-1">
                <span>Embauché·e {formatDate(e.hired_at, 'MMM yyyy')}</span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1',
                    e.status === 'active' ? 'text-working' : 'text-ink-faint',
                  )}
                >
                  <span className={cn('size-1.5 rounded-full', e.status === 'active' ? 'bg-working' : 'bg-ink-faint')} />
                  {e.status === 'active' ? 'Actif·ve' : 'Inactif·ve'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Dialog
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        title="Ajouter un·e salarié·e"
        description="Ses informations seront immédiatement visibles dans l'équipe."
        side="right"
      >
        <EmployeeForm
          onSubmit={handleAdd}
          onCancel={() => setOpenAdd(false)}
          submitLabel="Ajouter"
          submitting={submitting}
        />
      </Dialog>
    </Layout>
  )
}
