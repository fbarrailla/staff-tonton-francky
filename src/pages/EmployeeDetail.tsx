import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Edit3, Mail, Phone, Trash2, CalendarDays, Stethoscope, Plane, Plus,
  Calendar as CalendarIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
import { COMMON_SKILLS, type Employee } from '@/types'
import { employeeStatusToday, monthlyDayOffBalance } from '@/lib/derived'
import { formatError } from '@/lib/utils'
import { DayOffForm } from '@/components/DayOffForm'
import { SickLeaveForm } from '@/components/SickLeaveForm'
import { useRoleLabel } from '@/hooks/useLabels'
import { useFormatDate } from '@/hooks/useLocale'

export function EmployeeDetail() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const employee = useEmployee(id)
  const daysOff = useDaysOff()
  const sickLeaves = useSickLeaves()
  const navigate = useNavigate()
  const toast = useToast()
  const roleLabel = useRoleLabel()
  const fmt = useFormatDate()

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
      <Layout title={t('employee_detail.not_found')}>
        <Button variant="ghost" iconLeft={<ArrowLeft size={14} />} onClick={() => navigate('/equipe')}>
          {t('employee_detail.back_to_team')}
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
      toast.success(t('employee_detail.sheet_updated'))
    } catch (e) {
      toast.error(t('errors.update_failed'), formatError(e))
    } finally {
      setSubmitting(false)
    }
  }

  async function remove() {
    setDeleting(true)
    try {
      await mutate.deleteEmployee(employee!.id)
      toast.info(t('employee_detail.removed'), employee!.full_name)
      navigate('/equipe')
    } catch (e) {
      toast.error(t('errors.delete_failed'), formatError(e))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Layout
      eyebrow={<Link to="/equipe" className="hover:text-ink inline-flex items-center gap-1">
        <ArrowLeft size={11} /> {t('employee_detail.eyebrow_back')}</Link>}
      title={employee.full_name}>
      <section className="surface-card p-6 lg:p-8 mb-6 flex flex-wrap items-start gap-6">
        <Avatar name={employee.full_name} src={employee.avatar_url} size={108} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="label-caps">{roleLabel(employee.role)}</span>
            {status?.status === 'working' && <Badge tone="working" dot>{t('employee_detail.status_in_post')}</Badge>}
            {status?.status === 'off' && <Badge tone="approved" dot>{t('employee_detail.status_in_leave')}</Badge>}
            {status?.status === 'sick' && <Badge tone="sick" dot>{t('employee_detail.status_in_sick')}</Badge>}
            {employee.status === 'inactive' && <Badge tone="rejected">{t('employee_detail.status_inactive')}</Badge>}
          </div>
          <h1 className="display text-[clamp(28px,3vw,40px)] leading-tight text-ink">{employee.full_name}</h1>
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
              <CalendarIcon size={13} /> {t('employee_detail.hired_at_prefix', { date: fmt(employee.hired_at, 'd MMMM yyyy') })}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" iconLeft={<Edit3 size={14} />} onClick={() => setEditOpen(true)}>
            {t('employee_detail.edit')}
          </Button>
          <Button variant="ghost" iconLeft={<Trash2 size={14} />} onClick={() => setDeleteOpen(true)}>
            {t('employee_detail.delete')}
          </Button>
        </div>
      </section>

      <section className="grid lg:grid-cols-[1fr_2fr] gap-6">
        <div className="space-y-6">
          <div className="surface-card p-5">
            <div className="label-caps mb-3">{t('employee_detail.skills')}</div>
            {employee.skills.length === 0 ? (
              <p className="text-[13px] text-ink-faint italic">{t('employee_detail.no_skills')}</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {employee.skills.map((s) => (
                  <span key={s} className="text-[12px] text-ink-soft bg-surface border border-line rounded-full px-2.5 py-1">{s}</span>
                ))}
              </div>
            )}
            {employee.skills.length < 4 && (
              <p className="text-[11.5px] text-ink-faint mt-3">
                {t('employee_detail.skills_tip', { examples: COMMON_SKILLS.filter(s => !employee.skills.includes(s)).slice(0, 2).join(', ') })}
              </p>
            )}
          </div>

          {balance && (
            <div className="surface-card p-5">
              <div className="flex items-baseline justify-between mb-3">
                <div className="label-caps">{t('employee_detail.monthly_quota_title')}</div>
                <span className="text-[12px] text-ink-faint tabular">{balance.used}/{balance.quota}</span>
              </div>
              <div className="flex items-end gap-1.5 mb-3">
                {Array.from({ length: balance.quota }).map((_, i) => (
                  <div key={i} className={i < balance.used ? 'h-10 flex-1 rounded bg-tonton-500' : 'h-10 flex-1 rounded bg-surface border border-line'} />
                ))}
              </div>
              <p className="text-[12.5px] text-ink-soft leading-snug">
                {t('employee_detail.remaining_pre')}{' '}
                <span className="text-ink font-medium">{t('employee_detail.remaining_strong', { count: balance.remaining })}</span>{' '}
                {t('employee_detail.remaining_post')}
              </p>
            </div>
          )}

          <div className="surface-card p-5">
            <div className="label-caps mb-3">{t('employee_detail.quick_actions')}</div>
            <div className="flex flex-col gap-1.5">
              <Button variant="subtle" iconLeft={<Plane size={14} />} onClick={() => setAddDayOff(true)}>
                {t('employee_detail.new_leave')}
              </Button>
              <Button variant="subtle" iconLeft={<Stethoscope size={14} />} onClick={() => setAddSick(true)}>
                {t('employee_detail.new_sick')}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <header className="flex items-center justify-between mb-3">
              <h2 className="display text-[20px]">{t('employee_detail.history_leaves')}</h2>
              <Button size="sm" variant="secondary" iconLeft={<Plus size={13} />} onClick={() => setAddDayOff(true)}>
                {t('employee_detail.add')}
              </Button>
            </header>
            <div className="surface-card divide-y divide-line overflow-hidden">
              {empDaysOff.length === 0 ? (
                <div className="p-6 text-center text-[13px] text-ink-soft">{t('employee_detail.no_leaves')}</div>
              ) : (
                empDaysOff.sort((a, b) => b.start_date.localeCompare(a.start_date)).map((d) => (
                  <div key={d.id} className="p-4 flex flex-wrap items-start gap-3">
                    <CalendarDays size={16} className="text-ink-faint mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13.5px] text-ink font-medium tabular">
                          {fmt(d.start_date)} → {fmt(d.end_date)}
                        </span>
                        <span className="text-[11.5px] text-ink-faint">{t('common.day', { count: d.number_of_days })}</span>
                        <Badge tone={d.status === 'approved' ? 'approved' : d.status === 'pending' ? 'pending' : 'rejected'} dot>
                          {d.status === 'approved' ? t('employee_detail.status_approved') : d.status === 'pending' ? t('employee_detail.status_pending') : t('employee_detail.status_rejected')}
                        </Badge>
                      </div>
                      <p className="text-[12.5px] text-ink-soft mt-1 leading-snug">« {d.reason} »</p>
                      {d.admin_note && (
                        <p className="text-[11.5px] text-ink-faint italic mt-1">{t('employee_detail.admin_note_prefix', { note: d.admin_note })}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <header className="flex items-center justify-between mb-3">
              <h2 className="display text-[20px]">{t('employee_detail.history_sick')}</h2>
              <Button size="sm" variant="secondary" iconLeft={<Plus size={13} />} onClick={() => setAddSick(true)}>
                {t('employee_detail.add')}
              </Button>
            </header>
            <div className="surface-card divide-y divide-line overflow-hidden">
              {empSicks.length === 0 ? (
                <div className="p-6 text-center text-[13px] text-ink-soft">{t('employee_detail.no_sick')}</div>
              ) : (
                empSicks.sort((a, b) => b.start_date.localeCompare(a.start_date)).map((s) => (
                  <div key={s.id} className="p-4 flex items-start gap-3">
                    <Stethoscope size={16} className="text-sick mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] text-ink tabular">
                        {fmt(s.start_date)} → {fmt(s.end_date)}{' '}
                        <span className="text-[11.5px] text-ink-faint">· {t('common.day', { count: s.number_of_days })}</span>
                      </div>
                      <p className="text-[12.5px] text-ink-soft mt-1">« {s.reason} »</p>
                      {s.medical_certificate_url && (
                        <a href={s.medical_certificate_url} className="text-[11.5px] text-tonton-600 hover:underline" target="_blank" rel="noreferrer">
                          {t('employee_detail.view_certificate')}
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

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} title={t('employee_detail.edit_dialog_title')} side="right">
        <EmployeeForm initial={employee} onSubmit={update} onCancel={() => setEditOpen(false)}
          submitLabel={t('common.save')} submitting={submitting} />
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}
        title={t('employee_detail.delete_dialog_title')} description={t('employee_detail.delete_dialog_desc')}
        footer={<>
          <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={deleting}>{t('common.cancel')}</Button>
          <Button variant="danger" onClick={() => void remove()} loading={deleting}>{t('employee_detail.delete_permanent')}</Button>
        </>}>
        <div className="flex items-center gap-3 p-3 rounded-md bg-sick/8 border border-sick/30">
          <Avatar name={employee.full_name} src={employee.avatar_url} size={36} />
          <div>
            <div className="text-[13.5px] text-ink font-medium">{employee.full_name}</div>
            <div className="text-[12px] text-ink-faint">{employee.email}</div>
          </div>
        </div>
      </Dialog>

      <Dialog open={addDayOff} onClose={() => setAddDayOff(false)}
        title={t('employee_detail.new_leave')} description={t('employee_detail.new_leave_for', { name: employee.full_name })} side="right">
        <DayOffForm employee={employee} existingDaysOff={daysOff}
          onSaved={() => { setAddDayOff(false); toast.success(t('employee_detail.leave_request_created')) }}
          onCancel={() => setAddDayOff(false)} />
      </Dialog>

      <Dialog open={addSick} onClose={() => setAddSick(false)}
        title={t('employee_detail.new_sick')} description={t('employee_detail.new_leave_for', { name: employee.full_name })} side="right">
        <SickLeaveForm employee={employee}
          onSaved={() => { setAddSick(false); toast.success(t('employee_detail.sick_recorded')) }}
          onCancel={() => setAddSick(false)} />
      </Dialog>
    </Layout>
  )
}
