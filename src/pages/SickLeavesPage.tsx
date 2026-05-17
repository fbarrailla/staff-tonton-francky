import { useMemo, useState } from 'react'
import {
  Plus,
  Stethoscope,
  Edit3,
  Trash2,
  Paperclip,
} from 'lucide-react'
import { Layout } from '@/components/Layout'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { useEmployees, useSickLeaves } from '@/hooks/useStore'
import { mutate } from '@/lib/store'
import { useToast } from '@/contexts/ToastContext'
import { SickLeaveForm } from '@/components/SickLeaveForm'
import { formatDate } from '@/lib/utils'
import { ROLE_LABEL, type SickLeave } from '@/types'
import { isAfter, parseISO } from 'date-fns'

export function SickLeavesPage() {
  const employees = useEmployees()
  const sickLeaves = useSickLeaves()
  const toast = useToast()
  const [openCreate, setOpenCreate] = useState(false)
  const [editing, setEditing] = useState<SickLeave | null>(null)

  const active = useMemo(
    () =>
      sickLeaves.filter(
        (s) => parseISO(s.start_date) <= new Date() && isAfter(parseISO(s.end_date), new Date()),
      ),
    [sickLeaves],
  )

  const sorted = useMemo(
    () => [...sickLeaves].sort((a, b) => b.start_date.localeCompare(a.start_date)),
    [sickLeaves],
  )

  function remove(s: SickLeave) {
    mutate.deleteSickLeave(s.id)
    toast.info('Arrêt supprimé')
  }

  return (
    <Layout eyebrow="Santé · Ressources humaines" title="Arrêts maladie">
      <header className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <p className="text-[14px] text-ink-soft max-w-[60ch]">
          Les arrêts maladie sont enregistrés en parallèle des congés et ne décomptent pas du
          quota mensuel. Un certificat médical peut être joint à chaque déclaration.
        </p>
        <Button variant="primary" iconLeft={<Plus size={14} />} onClick={() => setOpenCreate(true)}>
          Nouvel arrêt
        </Button>
      </header>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <SickStat label="Arrêts en cours" value={active.length} accent />
        <SickStat label="Arrêts ce mois-ci" value={sickLeaves.filter((s) => parseISO(s.start_date).getMonth() === new Date().getMonth()).length} />
        <SickStat label="Total — 12 derniers mois" value={sickLeaves.length} subtle />
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon={<Stethoscope size={20} />}
          title="Aucun arrêt enregistré"
          description="L'équipe est en pleine forme — espérons que ça dure."
          action={<Button variant="primary" onClick={() => setOpenCreate(true)}>Déclarer un arrêt</Button>}
        />
      ) : (
        <div className="surface-card divide-y divide-line overflow-hidden">
          {sorted.map((s) => {
            const emp = employees.find((e) => e.id === s.employee_id)
            if (!emp) return null
            const ongoing =
              parseISO(s.start_date) <= new Date() && parseISO(s.end_date) >= new Date()
            return (
              <div key={s.id} className="p-5 flex flex-wrap items-start gap-4">
                <Avatar name={emp.full_name} src={emp.avatar_url} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14.5px] font-medium text-ink">{emp.full_name}</span>
                    <span className="text-[12px] text-ink-faint">{ROLE_LABEL[emp.role]}</span>
                    {ongoing && <Badge tone="sick" dot>En cours</Badge>}
                  </div>
                  <div className="text-[12.5px] text-ink-soft mt-1 tabular">
                    {formatDate(s.start_date)} → {formatDate(s.end_date)}
                    <span className="text-ink-faint"> · {s.number_of_days} jour{s.number_of_days > 1 ? 's' : ''}</span>
                  </div>
                  <p className="text-[13px] text-ink mt-2 leading-snug max-w-[64ch]">« {s.reason} »</p>
                  {s.medical_certificate_url && (
                    <a
                      href={s.medical_certificate_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-tonton-600 hover:underline"
                    >
                      <Paperclip size={12} /> Certificat médical
                    </a>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="ghost" iconLeft={<Edit3 size={13} />} onClick={() => setEditing(s)}>
                    Modifier
                  </Button>
                  <Button size="sm" variant="ghost" iconLeft={<Trash2 size={13} />} onClick={() => remove(s)} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        title="Déclarer un arrêt maladie"
        side="right"
      >
        <SickLeaveForm
          employees={employees}
          onSaved={() => {
            setOpenCreate(false)
            toast.success('Arrêt enregistré')
          }}
          onCancel={() => setOpenCreate(false)}
        />
      </Dialog>

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Modifier l'arrêt maladie"
        side="right"
      >
        {editing && (
          <SickLeaveForm
            employees={employees}
            initial={editing}
            onSaved={() => {
              setEditing(null)
              toast.success('Mise à jour')
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Dialog>
    </Layout>
  )
}

function SickStat({ label, value, accent, subtle }: { label: string; value: number; accent?: boolean; subtle?: boolean }) {
  return (
    <div className={`surface-card p-5 ${accent ? 'border-sick/30' : ''}`}>
      <div className="label-caps">{label}</div>
      <div
        className={`display tabular text-[34px] mt-2 leading-none ${
          accent ? 'text-sick' : subtle ? 'text-ink-soft' : 'text-ink'
        }`}
      >
        {value}
      </div>
    </div>
  )
}
