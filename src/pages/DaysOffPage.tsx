import { useMemo, useState } from 'react'
import {
  CheckCircle2,
  XCircle,
  Plus,
  Plane,
  Edit3,
  Trash2,
  MessageSquare,
} from 'lucide-react'
import { Layout } from '@/components/Layout'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Tabs } from '@/components/ui/Tabs'
import { Textarea } from '@/components/ui/Field'
import { useDaysOff, useEmployees } from '@/hooks/useStore'
import { mutate } from '@/lib/store'
import { useToast } from '@/contexts/ToastContext'
import { DayOffForm } from '@/components/DayOffForm'
import { cn, formatDate } from '@/lib/utils'
import { monthlyDayOffBalance } from '@/lib/derived'
import { ROLE_LABEL, type DayOff } from '@/types'
import { parseISO } from 'date-fns'

type Filter = 'all' | 'pending' | 'approved' | 'rejected'

export function DaysOffPage() {
  const employees = useEmployees()
  const daysOff = useDaysOff()
  const toast = useToast()
  const [tab, setTab] = useState<Filter>('pending')
  const [openCreate, setOpenCreate] = useState(false)
  const [editing, setEditing] = useState<DayOff | null>(null)
  const [rejecting, setRejecting] = useState<DayOff | null>(null)
  const [rejectNote, setRejectNote] = useState('')

  const filtered = useMemo(() => {
    const list = tab === 'all' ? daysOff : daysOff.filter((d) => d.status === tab)
    return list.sort((a, b) => b.start_date.localeCompare(a.start_date))
  }, [daysOff, tab])

  const counts = {
    all: daysOff.length,
    pending: daysOff.filter((d) => d.status === 'pending').length,
    approved: daysOff.filter((d) => d.status === 'approved').length,
    rejected: daysOff.filter((d) => d.status === 'rejected').length,
  }

  function approve(d: DayOff) {
    mutate.updateDayOff(d.id, { status: 'approved' })
    toast.success('Congé approuvé')
  }

  function startReject(d: DayOff) {
    setRejecting(d)
    setRejectNote('')
  }

  function confirmReject() {
    if (!rejecting) return
    mutate.updateDayOff(rejecting.id, { status: 'rejected', admin_note: rejectNote || null })
    setRejecting(null)
    toast.info('Congé refusé')
  }

  function remove(d: DayOff) {
    mutate.deleteDayOff(d.id)
    toast.info('Demande supprimée')
  }

  return (
    <Layout eyebrow="Ressources humaines" title="Congés">
      <header className="flex items-end justify-between gap-4 flex-wrap mb-5">
        <p className="text-[14px] text-ink-soft max-w-[60ch]">
          Demandes de congés de l'équipe — 4 jours autorisés par mois calendaire pour chaque salarié·e.
          Vous pouvez exceptionnellement dépasser ce quota en tant qu'administrateur.
        </p>
        <Button variant="primary" iconLeft={<Plus size={14} />} onClick={() => setOpenCreate(true)}>
          Nouvelle demande
        </Button>
      </header>

      <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
        <Tabs<Filter>
          value={tab}
          onChange={setTab}
          items={[
            { value: 'pending', label: 'En attente', count: counts.pending },
            { value: 'approved', label: 'Approuvés', count: counts.approved },
            { value: 'rejected', label: 'Refusés', count: counts.rejected },
            { value: 'all', label: 'Tout', count: counts.all },
          ]}
        />
        <div className="text-[12px] text-ink-faint tabular">
          {counts.pending > 0 && (
            <span className="text-pending">
              {counts.pending} demande{counts.pending > 1 ? 's' : ''} en attente de votre validation
            </span>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Plane size={20} />}
          title={tab === 'pending' ? 'Aucune demande en attente' : 'Rien à afficher'}
          description={
            tab === 'pending'
              ? "Bravo — l'équipe n'a aucune demande en suspens."
              : 'Aucun élément ne correspond à ce filtre.'
          }
        />
      ) : (
        <div className="surface-card divide-y divide-line overflow-hidden">
          {filtered.map((d) => {
            const emp = employees.find((e) => e.id === d.employee_id)
            if (!emp) return null
            const bal = monthlyDayOffBalance(emp.id, daysOff, parseISO(d.start_date))
            const over = bal.used > bal.quota
            return (
              <div key={d.id} className="p-5 flex flex-wrap items-start gap-4">
                <Avatar name={emp.full_name} src={emp.avatar_url} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14.5px] font-medium text-ink">{emp.full_name}</span>
                    <span className="text-[12px] text-ink-faint">{ROLE_LABEL[emp.role]}</span>
                    <Badge tone={d.status === 'approved' ? 'approved' : d.status === 'pending' ? 'pending' : 'rejected'} dot>
                      {d.status === 'approved' ? 'Approuvé' : d.status === 'pending' ? 'En attente' : 'Refusé'}
                    </Badge>
                    {over && <Badge tone="sick">Dépasse le quota</Badge>}
                  </div>
                  <div className="text-[12.5px] text-ink-soft mt-1 tabular">
                    {formatDate(d.start_date)} → {formatDate(d.end_date)}{' '}
                    <span className="text-ink-faint">· {d.number_of_days} jour{d.number_of_days > 1 ? 's' : ''}</span>
                    <span className="text-ink-faint"> · solde {bal.used}/{bal.quota}</span>
                  </div>
                  <p className="text-[13px] text-ink mt-2 leading-snug max-w-[64ch]">« {d.reason} »</p>
                  {d.admin_note && (
                    <div className="mt-2 flex items-start gap-1.5 text-[12px] text-ink-faint italic">
                      <MessageSquare size={11} className="mt-0.5" />
                      <span>{d.admin_note}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {d.status === 'pending' && (
                    <>
                      <Button size="sm" variant="primary" iconLeft={<CheckCircle2 size={13} />} onClick={() => approve(d)}>
                        Approuver
                      </Button>
                      <Button size="sm" variant="ghost" iconLeft={<XCircle size={13} />} onClick={() => startReject(d)}>
                        Refuser
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="ghost" iconLeft={<Edit3 size={13} />} onClick={() => setEditing(d)}>
                    Modifier
                  </Button>
                  <Button size="sm" variant="ghost" iconLeft={<Trash2 size={13} />} onClick={() => remove(d)} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        title="Nouvelle demande de congé"
        side="right"
      >
        <DayOffForm
          employees={employees}
          existingDaysOff={daysOff}
          onSaved={() => {
            setOpenCreate(false)
            toast.success('Demande créée')
          }}
          onCancel={() => setOpenCreate(false)}
        />
      </Dialog>

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Modifier le congé"
        side="right"
      >
        {editing && (
          <DayOffForm
            employees={employees}
            existingDaysOff={daysOff}
            initial={editing}
            onSaved={() => {
              setEditing(null)
              toast.success('Mise à jour')
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Dialog>

      <Dialog
        open={rejecting !== null}
        onClose={() => setRejecting(null)}
        title="Refuser cette demande ?"
        description="Vous pouvez préciser un motif que la personne pourra consulter."
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejecting(null)}>Annuler</Button>
            <Button variant="danger" onClick={confirmReject}>Refuser</Button>
          </>
        }
      >
        <Textarea
          label="Note (facultatif)"
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
          rows={3}
          placeholder="Ex. Période trop chargée — à reporter sur la première quinzaine du mois prochain."
        />
      </Dialog>
    </Layout>
  )
}
