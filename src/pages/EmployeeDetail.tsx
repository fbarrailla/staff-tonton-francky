import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Edit3,
  Mail,
  Phone,
  Trash2,
  CalendarDays,
  Stethoscope,
  Plane,
  Plus,
  Calendar as CalendarIcon,
} from 'lucide-react'
import { Layout } from '@/components/Layout'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { EmployeeForm } from '@/components/EmployeeForm'
import { useDaysOff, useEmployee, useSickLeaves } from '@/hooks/useStore'
import { mutate } from '@/lib/store'
import { uploadAvatar } from '@/lib/storage'
import { useToast } from '@/contexts/ToastContext'
import { COMMON_SKILLS, ROLE_LABEL, type Employee } from '@/types'
import { employeeStatusToday, monthlyDayOffBalance } from '@/lib/derived'
import { formatDate, inclusiveDayCount } from '@/lib/utils'
import { DayOffForm } from '@/components/DayOffForm'
import { SickLeaveForm } from '@/components/SickLeaveForm'

export function EmployeeDetail() {
  const { id } = useParams<{ id: string }>()
  const employee = useEmployee(id)
  const daysOff = useDaysOff()
  const sickLeaves = useSickLeaves()
  const navigate = useNavigate()
  const toast = useToast()

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [addDayOff, setAddDayOff] = useState(false)
  const [addSick, setAddSick] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const status = useMemo(
    () => (employee ? employeeStatusToday(employee, daysOff, sickLeaves) : null),
    [employee, daysOff, sickLeaves],
  )

  const empDaysOff = useMemo(
    () => (employee ? daysOff.filter((d) => d.employee_id === employee.id) : []),
    [employee, daysOff],
  )
  const empSicks = useMemo(
    () => (employee ? sickLeaves.filter((s) => s.employee_id === employee.id) : []),
    [employee, sickLeaves],
  )

  const balance = useMemo(
    () => (employee ? monthlyDayOffBalance(employee.id, daysOff) : null),
    [employee, daysOff],
  )

  if (!employee) {
    return (
      <Layout title="Salarié·e introuvable">
        <Button variant="ghost" iconLeft={<ArrowLeft size={14} />} onClick={() => navigate('/equipe')}>
          Retour à l'équipe
        </Button>
      </Layout>
    )
  }

  async function update(
    data: Omit<Employee, 'id' | 'created_at' | 'updated_at'>,
    avatarFile: File | null,
  ) {
    setSubmitting(true)
    try {
      let avatar_url = data.avatar_url
      if (avatarFile) avatar_url = await uploadAvatar(avatarFile)
      await mutate.updateEmployee(employee!.id, { ...data, avatar_url })
      setEditOpen(false)
      toast.success('Fiche mise à jour')
    } catch (e) {
      toast.error('Mise à jour impossible', e instanceof Error ? e.message : String(e))
    } finally {
      setSubmitting(false)
    }
  }

  async function remove() {
    setDeleting(true)
    try {
      await mutate.deleteEmployee(employee!.id)
      toast.info('Salarié·e supprimé·e', employee!.full_name)
      navigate('/equipe')
    } catch (e) {
      toast.error('Suppression impossible', e instanceof Error ? e.message : String(e))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Layout
      eyebrow={
        <Link to="/equipe" className="hover:text-ink inline-flex items-center gap-1">
          <ArrowLeft size={11} /> Équipe
        </Link>
      }
      title={employee.full_name}
    >
      {/* HERO */}
      <section className="surface-card p-6 lg:p-8 mb-6 flex flex-wrap items-start gap-6">
        <Avatar name={employee.full_name} src={employee.avatar_url} size={108} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="label-caps">{ROLE_LABEL[employee.role]}</span>
            {status?.status === 'working' && <Badge tone="working" dot>En poste</Badge>}
            {status?.status === 'off' && <Badge tone="approved" dot>En congé</Badge>}
            {status?.status === 'sick' && <Badge tone="sick" dot>En arrêt</Badge>}
            {employee.status === 'inactive' && <Badge tone="rejected">Inactif·ve</Badge>}
          </div>
          <h1 className="display text-[clamp(28px,3vw,40px)] leading-tight text-ink">
            {employee.full_name}
          </h1>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13.5px] text-ink-soft">
            <a href={`mailto:${employee.email}`} className="inline-flex items-center gap-1.5 hover:text-ink">
              <Mail size={13} /> {employee.email}
            </a>
            {employee.phone && (
              <a href={`tel:${employee.phone}`} className="inline-flex items-center gap-1.5 hover:text-ink tabular">
                <Phone size={13} /> {employee.phone}
              </a>
            )}
            <span className="inline-flex items-center gap-1.5">
              <CalendarIcon size={13} /> Embauché·e {formatDate(employee.hired_at, 'd MMMM yyyy')}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" iconLeft={<Edit3 size={14} />} onClick={() => setEditOpen(true)}>
            Modifier
          </Button>
          <Button variant="ghost" iconLeft={<Trash2 size={14} />} onClick={() => setDeleteOpen(true)}>
            Supprimer
          </Button>
        </div>
      </section>

      {/* BODY GRID */}
      <section className="grid lg:grid-cols-[1fr_2fr] gap-6">
        {/* LEFT: Profile facts */}
        <div className="space-y-6">
          <div className="surface-card p-5">
            <div className="label-caps mb-3">Compétences</div>
            {employee.skills.length === 0 ? (
              <p className="text-[13px] text-ink-faint italic">Aucune compétence renseignée.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {employee.skills.map((s) => (
                  <span
                    key={s}
                    className="text-[12px] text-ink-soft bg-surface border border-line rounded-full px-2.5 py-1"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
            {employee.skills.length < 4 && (
              <p className="text-[11.5px] text-ink-faint mt-3">
                Astuce · ajoutez par ex. {COMMON_SKILLS.filter(s => !employee.skills.includes(s)).slice(0, 2).join(', ')}.
              </p>
            )}
          </div>

          {balance && (
            <div className="surface-card p-5">
              <div className="flex items-baseline justify-between mb-3">
                <div className="label-caps">Solde de congés du mois</div>
                <span className="text-[12px] text-ink-faint tabular">{balance.used}/{balance.quota}</span>
              </div>
              <div className="flex items-end gap-1.5 mb-3">
                {Array.from({ length: balance.quota }).map((_, i) => (
                  <div
                    key={i}
                    className={
                      i < balance.used
                        ? 'h-10 flex-1 rounded bg-tonton-500'
                        : 'h-10 flex-1 rounded bg-surface border border-line'
                    }
                  />
                ))}
              </div>
              <p className="text-[12.5px] text-ink-soft leading-snug">
                Il reste <span className="text-ink font-medium">{balance.remaining} jour{balance.remaining > 1 ? 's' : ''}</span> sur les 4
                jours autorisés ce mois-ci.
              </p>
            </div>
          )}

          <div className="surface-card p-5">
            <div className="label-caps mb-3">Actions rapides</div>
            <div className="flex flex-col gap-1.5">
              <Button variant="subtle" iconLeft={<Plane size={14} />} onClick={() => setAddDayOff(true)}>
                Nouveau congé
              </Button>
              <Button variant="subtle" iconLeft={<Stethoscope size={14} />} onClick={() => setAddSick(true)}>
                Nouvel arrêt maladie
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT: History */}
        <div className="space-y-6">
          <div>
            <header className="flex items-center justify-between mb-3">
              <h2 className="display text-[20px]">Historique des congés</h2>
              <Button size="sm" variant="secondary" iconLeft={<Plus size={13} />} onClick={() => setAddDayOff(true)}>
                Ajouter
              </Button>
            </header>
            <div className="surface-card divide-y divide-line overflow-hidden">
              {empDaysOff.length === 0 ? (
                <div className="p-6 text-center text-[13px] text-ink-soft">Aucun congé pour l'instant.</div>
              ) : (
                empDaysOff
                  .sort((a, b) => b.start_date.localeCompare(a.start_date))
                  .map((d) => (
                    <div key={d.id} className="p-4 flex flex-wrap items-start gap-3">
                      <CalendarDays size={16} className="text-ink-faint mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13.5px] text-ink font-medium tabular">
                            {formatDate(d.start_date)} → {formatDate(d.end_date)}
                          </span>
                          <span className="text-[11.5px] text-ink-faint">
                            {d.number_of_days} jour{d.number_of_days > 1 ? 's' : ''}
                          </span>
                          <Badge tone={d.status === 'approved' ? 'approved' : d.status === 'pending' ? 'pending' : 'rejected'} dot>
                            {d.status === 'approved' ? 'Approuvé' : d.status === 'pending' ? 'En attente' : 'Refusé'}
                          </Badge>
                        </div>
                        <p className="text-[12.5px] text-ink-soft mt-1 leading-snug">« {d.reason} »</p>
                        {d.admin_note && (
                          <p className="text-[11.5px] text-ink-faint italic mt-1">Note admin · {d.admin_note}</p>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          <div>
            <header className="flex items-center justify-between mb-3">
              <h2 className="display text-[20px]">Arrêts maladie</h2>
              <Button size="sm" variant="secondary" iconLeft={<Plus size={13} />} onClick={() => setAddSick(true)}>
                Ajouter
              </Button>
            </header>
            <div className="surface-card divide-y divide-line overflow-hidden">
              {empSicks.length === 0 ? (
                <div className="p-6 text-center text-[13px] text-ink-soft">Aucun arrêt enregistré.</div>
              ) : (
                empSicks
                  .sort((a, b) => b.start_date.localeCompare(a.start_date))
                  .map((s) => (
                    <div key={s.id} className="p-4 flex items-start gap-3">
                      <Stethoscope size={16} className="text-sick mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13.5px] text-ink tabular">
                          {formatDate(s.start_date)} → {formatDate(s.end_date)}{' '}
                          <span className="text-[11.5px] text-ink-faint">
                            · {s.number_of_days} jour{s.number_of_days > 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className="text-[12.5px] text-ink-soft mt-1">« {s.reason} »</p>
                        {s.medical_certificate_url && (
                          <a
                            href={s.medical_certificate_url}
                            className="text-[11.5px] text-tonton-600 hover:underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Voir le certificat médical
                          </a>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </section>

      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Modifier la fiche"
        side="right"
      >
        <EmployeeForm
          initial={employee}
          onSubmit={update}
          onCancel={() => setEditOpen(false)}
          submitLabel="Enregistrer"
          submitting={submitting}
        />
      </Dialog>

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Supprimer ce·tte salarié·e ?"
        description="Cette action retire définitivement la fiche ainsi que tous les congés et arrêts associés."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={deleting}>Annuler</Button>
            <Button variant="danger" onClick={() => void remove()} loading={deleting}>Supprimer définitivement</Button>
          </>
        }
      >
        <div className="flex items-center gap-3 p-3 rounded-md bg-sick/8 border border-sick/30">
          <Avatar name={employee.full_name} src={employee.avatar_url} size={36} />
          <div>
            <div className="text-[13.5px] text-ink font-medium">{employee.full_name}</div>
            <div className="text-[12px] text-ink-faint">{employee.email}</div>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={addDayOff}
        onClose={() => setAddDayOff(false)}
        title="Nouveau congé"
        description={`Pour ${employee.full_name}`}
        side="right"
      >
        <DayOffForm
          employee={employee}
          existingDaysOff={daysOff}
          onSaved={() => {
            setAddDayOff(false)
            toast.success('Demande créée')
          }}
          onCancel={() => setAddDayOff(false)}
        />
      </Dialog>

      <Dialog
        open={addSick}
        onClose={() => setAddSick(false)}
        title="Nouvel arrêt maladie"
        description={`Pour ${employee.full_name}`}
        side="right"
      >
        <SickLeaveForm
          employee={employee}
          onSaved={() => {
            setAddSick(false)
            toast.success('Arrêt maladie enregistré')
          }}
          onCancel={() => setAddSick(false)}
        />
      </Dialog>
    </Layout>
  )
}
