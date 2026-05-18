import { useMemo, useState } from 'react'
import { Plus, Stethoscope, Edit3, Trash2, Paperclip } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
import { formatError } from '@/lib/utils'
import { type SickLeave } from '@/types'
import { isAfter, parseISO } from 'date-fns'
import { useRoleLabel } from '@/hooks/useLabels'
import { useFormatDate } from '@/hooks/useLocale'

export function SickLeavesPage() {
  const { t } = useTranslation()
  const employees = useEmployees()
  const sickLeaves = useSickLeaves()
  const toast = useToast()
  const roleLabel = useRoleLabel()
  const fmt = useFormatDate()

  const [openCreate, setOpenCreate] = useState(false)
  const [editing, setEditing] = useState<SickLeave | null>(null)

  const active = useMemo(
    () => sickLeaves.filter(
      (s) => parseISO(s.start_date) <= new Date() && isAfter(parseISO(s.end_date), new Date()),
    ), [sickLeaves],
  )
  const sorted = useMemo(
    () => [...sickLeaves].sort((a, b) => b.start_date.localeCompare(a.start_date)),
    [sickLeaves],
  )

  async function remove(s: SickLeave) {
    try { await mutate.deleteSickLeave(s.id); toast.info(t('sick_leaves.sick_deleted')) }
    catch (e) { toast.error(t('errors.delete_failed'), formatError(e)) }
  }

  return (
    <Layout eyebrow={t('sick_leaves.eyebrow')} title={t('sick_leaves.title')}>
      <header className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <p className="text-[14px] text-ink-soft max-w-[60ch]">{t('sick_leaves.intro')}</p>
        <Button variant="primary" iconLeft={<Plus size={14} />} onClick={() => setOpenCreate(true)}>
          {t('sick_leaves.new_sick')}
        </Button>
      </header>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <SickStat label={t('sick_leaves.stat_active')} value={active.length} accent />
        <SickStat label={t('sick_leaves.stat_this_month')}
          value={sickLeaves.filter((s) => parseISO(s.start_date).getMonth() === new Date().getMonth()).length} />
        <SickStat label={t('sick_leaves.stat_total')} value={sickLeaves.length} subtle />
      </div>

      {sorted.length === 0 ? (
        <EmptyState icon={<Stethoscope size={20} />}
          title={t('sick_leaves.empty_title')} description={t('sick_leaves.empty_desc')}
          action={<Button variant="primary" onClick={() => setOpenCreate(true)}>{t('sick_leaves.declare')}</Button>} />
      ) : (
        <div className="surface-card divide-y divide-line overflow-hidden">
          {sorted.map((s) => {
            const emp = employees.find((e) => e.id === s.employee_id)
            if (!emp) return null
            const ongoing = parseISO(s.start_date) <= new Date() && parseISO(s.end_date) >= new Date()
            return (
              <div key={s.id} className="p-5 flex flex-wrap items-start gap-4">
                <Avatar name={emp.full_name} src={emp.avatar_url} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14.5px] font-medium text-ink">{emp.full_name}</span>
                    <span className="text-[12px] text-ink-faint">{roleLabel(emp.role)}</span>
                    {ongoing && <Badge tone="sick" dot>{t('sick_leaves.ongoing')}</Badge>}
                  </div>
                  <div className="text-[12.5px] text-ink-soft mt-1 tabular">
                    {fmt(s.start_date)} → {fmt(s.end_date)}
                    <span className="text-ink-faint"> · {t('common.day', { count: s.number_of_days })}</span>
                  </div>
                  <p className="text-[13px] text-ink mt-2 leading-snug max-w-[64ch]">« {s.reason} »</p>
                  {s.medical_certificate_url && (
                    <a href={s.medical_certificate_url} target="_blank" rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-tonton-600 hover:underline">
                      <Paperclip size={12} /> {t('sick_leaves.certificate')}
                    </a>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="ghost" iconLeft={<Edit3 size={13} />} onClick={() => setEditing(s)}>
                    {t('sick_leaves.edit_btn')}
                  </Button>
                  <Button size="sm" variant="ghost" iconLeft={<Trash2 size={13} />} onClick={() => void remove(s)} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)}
        title={t('sick_leaves.new_dialog_title')} side="right">
        <SickLeaveForm employees={employees}
          onSaved={() => { setOpenCreate(false); toast.success(t('sick_leaves.sick_recorded')) }}
          onCancel={() => setOpenCreate(false)} />
      </Dialog>

      <Dialog open={editing !== null} onClose={() => setEditing(null)}
        title={t('sick_leaves.edit_dialog_title')} side="right">
        {editing && (
          <SickLeaveForm employees={employees} initial={editing}
            onSaved={() => { setEditing(null); toast.success(t('sick_leaves.sick_updated')) }}
            onCancel={() => setEditing(null)} />
        )}
      </Dialog>
    </Layout>
  )
}

function SickStat({ label, value, accent, subtle }: { label: string; value: number; accent?: boolean; subtle?: boolean }) {
  return (
    <div className={`surface-card p-5 ${accent ? 'border-sick/30' : ''}`}>
      <div className="label-caps">{label}</div>
      <div className={`display tabular text-[34px] mt-2 leading-none ${accent ? 'text-sick' : subtle ? 'text-ink-soft' : 'text-ink'}`}>
        {value}
      </div>
    </div>
  )
}
