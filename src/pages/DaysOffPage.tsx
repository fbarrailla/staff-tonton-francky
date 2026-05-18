import { useMemo, useState } from 'react'
import {
  CheckCircle2, XCircle, Plus, Plane, Edit3, Trash2, MessageSquare,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
import { formatError } from '@/lib/utils'
import { monthlyDayOffBalance } from '@/lib/derived'
import { type DayOff } from '@/types'
import { parseISO } from 'date-fns'
import { useRoleLabel } from '@/hooks/useLabels'
import { useFormatDate } from '@/hooks/useLocale'

type Filter = 'all' | 'pending' | 'approved' | 'rejected'

export function DaysOffPage() {
  const { t } = useTranslation()
  const employees = useEmployees()
  const daysOff = useDaysOff()
  const toast = useToast()
  const roleLabel = useRoleLabel()
  const fmt = useFormatDate()

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

  async function approve(d: DayOff) {
    try {
      await mutate.updateDayOff(d.id, { status: 'approved' })
      toast.success(t('days_off.leave_approved_toast'))
    } catch (e) { toast.error(t('errors.action_failed'), formatError(e)) }
  }
  function startReject(d: DayOff) { setRejecting(d); setRejectNote('') }
  async function confirmReject() {
    if (!rejecting) return
    try {
      await mutate.updateDayOff(rejecting.id, { status: 'rejected', admin_note: rejectNote || null })
      setRejecting(null)
      toast.info(t('days_off.leave_rejected_toast'))
    } catch (e) { toast.error(t('errors.action_failed'), formatError(e)) }
  }
  async function remove(d: DayOff) {
    try { await mutate.deleteDayOff(d.id); toast.info(t('days_off.request_deleted_toast')) }
    catch (e) { toast.error(t('errors.delete_failed'), formatError(e)) }
  }

  return (
    <Layout eyebrow={t('days_off.eyebrow')} title={t('days_off.title')}>
      <header className="flex items-end justify-between gap-4 flex-wrap mb-5">
        <p className="text-[14px] text-ink-soft max-w-[60ch]">{t('days_off.intro')}</p>
        <Button variant="primary" iconLeft={<Plus size={14} />} onClick={() => setOpenCreate(true)}>
          {t('days_off.new_request')}
        </Button>
      </header>

      <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
        <Tabs<Filter> value={tab} onChange={setTab}
          items={[
            { value: 'pending', label: t('days_off.tab_pending'), count: counts.pending },
            { value: 'approved', label: t('days_off.tab_approved'), count: counts.approved },
            { value: 'rejected', label: t('days_off.tab_rejected'), count: counts.rejected },
            { value: 'all', label: t('days_off.tab_all'), count: counts.all },
          ]} />
        <div className="text-[12px] text-ink-faint tabular">
          {counts.pending > 0 && (
            <span className="text-pending">{t('days_off.pending_alert', { count: counts.pending })}</span>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Plane size={20} />}
          title={tab === 'pending' ? t('days_off.empty_pending_title') : t('days_off.empty_other_title')}
          description={tab === 'pending' ? t('days_off.empty_pending_desc') : t('days_off.empty_other_desc')} />
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
                    <span className="text-[12px] text-ink-faint">{roleLabel(emp.role)}</span>
                    <Badge tone={d.status === 'approved' ? 'approved' : d.status === 'pending' ? 'pending' : 'rejected'} dot>
                      {d.status === 'approved' ? t('days_off.status_approved')
                        : d.status === 'pending' ? t('days_off.status_pending')
                        : t('days_off.status_rejected')}
                    </Badge>
                    {over && <Badge tone="sick">{t('days_off.exceeds_quota')}</Badge>}
                  </div>
                  <div className="text-[12.5px] text-ink-soft mt-1 tabular">
                    {fmt(d.start_date)} → {fmt(d.end_date)}{' '}
                    <span className="text-ink-faint">· {t('common.day', { count: d.number_of_days })}</span>
                    <span className="text-ink-faint"> · {t('days_off.balance_hint', { used: bal.used, quota: bal.quota })}</span>
                  </div>
                  <p className="text-[13px] text-ink mt-2 leading-snug max-w-[64ch]">« {d.reason} »</p>
                  {d.admin_note && (
                    <div className="mt-2 flex items-start gap-1.5 text-[12px] text-ink-faint italic">
                      <MessageSquare size={11} className="mt-0.5" /><span>{d.admin_note}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {d.status === 'pending' && (
                    <>
                      <Button size="sm" variant="primary" iconLeft={<CheckCircle2 size={13} />} onClick={() => void approve(d)}>
                        {t('days_off.approve')}
                      </Button>
                      <Button size="sm" variant="ghost" iconLeft={<XCircle size={13} />} onClick={() => startReject(d)}>
                        {t('days_off.reject')}
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="ghost" iconLeft={<Edit3 size={13} />} onClick={() => setEditing(d)}>
                    {t('days_off.edit')}
                  </Button>
                  <Button size="sm" variant="ghost" iconLeft={<Trash2 size={13} />} onClick={() => void remove(d)} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)}
        title={t('days_off.new_dialog_title')} side="right">
        <DayOffForm employees={employees} existingDaysOff={daysOff}
          onSaved={() => { setOpenCreate(false); toast.success(t('days_off.request_created_toast')) }}
          onCancel={() => setOpenCreate(false)} />
      </Dialog>

      <Dialog open={editing !== null} onClose={() => setEditing(null)}
        title={t('days_off.edit_dialog_title')} side="right">
        {editing && (
          <DayOffForm employees={employees} existingDaysOff={daysOff} initial={editing}
            onSaved={() => { setEditing(null); toast.success(t('common.updated')) }}
            onCancel={() => setEditing(null)} />
        )}
      </Dialog>

      <Dialog open={rejecting !== null} onClose={() => setRejecting(null)}
        title={t('days_off.reject_dialog_title')} description={t('days_off.reject_dialog_desc')}
        footer={<>
          <Button variant="ghost" onClick={() => setRejecting(null)}>{t('common.cancel')}</Button>
          <Button variant="danger" onClick={() => void confirmReject()}>{t('days_off.refuse_btn')}</Button>
        </>}>
        <Textarea label={t('days_off.reject_note_label')} value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)} rows={3}
          placeholder={t('days_off.reject_note_ph')} />
      </Dialog>
    </Layout>
  )
}
