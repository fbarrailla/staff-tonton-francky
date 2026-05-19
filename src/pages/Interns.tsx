import { useMemo, useState } from 'react'
import { Plus, Search, GraduationCap, X, Edit3, Trash2, Mail, Phone, Calendar } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Layout } from '@/components/Layout'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Tabs } from '@/components/ui/Tabs'
import { useInterns } from '@/hooks/useStore'
import { mutate } from '@/lib/store'
import { type Intern, type InternStatus } from '@/types'
import { InternForm } from '@/components/InternForm'
import { CopyEmailsButton } from '@/components/ui/CopyEmailsButton'
import { useToast } from '@/contexts/ToastContext'
import { formatError } from '@/lib/utils'
import { useInternStatusLabel } from '@/hooks/useLabels'
import { useFormatDate } from '@/hooks/useLocale'

type StatusFilter = 'all' | InternStatus

const STATUS_TONE: Record<InternStatus, 'pending' | 'approved' | 'working' | 'rejected'> = {
  pending: 'pending',
  active: 'approved',
  hired: 'working',
  ended: 'rejected',
}

export function Interns() {
  const { t } = useTranslation()
  const interns = useInterns()
  const toast = useToast()
  const statusLabel = useInternStatusLabel()
  const fmt = useFormatDate()

  const [q, setQ] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [openAdd, setOpenAdd] = useState(false)
  const [editing, setEditing] = useState<Intern | null>(null)
  const [deleting, setDeleting] = useState<Intern | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [removing, setRemoving] = useState(false)

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { all: interns.length, pending: 0, active: 0, hired: 0, ended: 0 }
    interns.forEach((i) => { c[i.status]++ })
    return c
  }, [interns])

  const filtered = useMemo(() => {
    return interns
      .filter((i) => {
        if (status !== 'all' && i.status !== status) return false
        if (q.trim()) {
          const needle = q.toLowerCase()
          const hay = `${i.full_name} ${i.email} ${i.phone ?? ''} ${(i.skills ?? []).join(' ')}`.toLowerCase()
          if (!hay.includes(needle)) return false
        }
        return true
      })
      .sort((a, b) => (b.applied_at ?? '').localeCompare(a.applied_at ?? ''))
  }, [interns, status, q])

  async function handleAdd(data: Omit<Intern, 'id' | 'created_at' | 'updated_at'>) {
    setSubmitting(true)
    try {
      await mutate.addIntern(data)
      setOpenAdd(false)
      toast.success(t('interns.saved_toast'), data.full_name)
    } catch (e) {
      toast.error(t('errors.add_failed'), formatError(e))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdate(data: Omit<Intern, 'id' | 'created_at' | 'updated_at'>) {
    if (!editing) return
    setSubmitting(true)
    try {
      await mutate.updateIntern(editing.id, data)
      setEditing(null)
      toast.success(t('interns.updated_toast'))
    } catch (e) {
      toast.error(t('errors.update_failed'), formatError(e))
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    setRemoving(true)
    try {
      await mutate.deleteIntern(deleting.id)
      toast.info(t('interns.deleted_toast'))
      setDeleting(null)
    } catch (e) {
      toast.error(t('errors.delete_failed'), formatError(e))
    } finally {
      setRemoving(false)
    }
  }

  return (
    <Layout eyebrow={t('interns.eyebrow')} title={t('interns.title')}>
      <header className="flex items-end justify-between gap-4 flex-wrap mb-5">
        <p className="text-[14px] text-ink-soft max-w-[60ch]">{t('interns.intro')}</p>
        <div className="flex flex-wrap gap-2">
          <CopyEmailsButton emails={filtered.map((i) => i.email)} />
          <Button variant="primary" iconLeft={<Plus size={14} />} onClick={() => setOpenAdd(true)}>
            {t('interns.new_intern')}
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)}
            placeholder={t('interns.search_ph')}
            className="w-full h-10 pl-9 pr-9 text-sm rounded-md bg-paper border border-line focus:border-tonton-500 outline-none" />
          {q && (
            <button onClick={() => setQ('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink p-1" aria-label={t('common.close')}>
              <X size={13} />
            </button>
          )}
        </div>

        <Tabs<StatusFilter> value={status} onChange={setStatus}
          items={[
            { value: 'all', label: t('interns.tab_all'), count: counts.all },
            { value: 'pending', label: t('interns.tab_pending'), count: counts.pending },
            { value: 'active', label: t('interns.tab_active'), count: counts.active },
            { value: 'hired', label: t('interns.tab_hired'), count: counts.hired },
            { value: 'ended', label: t('interns.tab_ended'), count: counts.ended },
          ]} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<GraduationCap size={20} />}
          title={interns.length === 0 ? t('interns.empty_none_title') : t('interns.empty_match_title')}
          description={interns.length === 0 ? t('interns.empty_none_desc') : t('interns.empty_match_desc')}
          action={<Button variant="primary" onClick={() => setOpenAdd(true)}>{t('interns.add')}</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((i) => (
            <div key={i.id}
              className="group surface-card p-5 hover:shadow-raise transition-shadow flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 size-32 bg-tonton-500/0 group-hover:bg-tonton-500/8 transition-colors blur-2xl rounded-full -translate-y-12 translate-x-12 pointer-events-none" />
              <div className="flex items-start gap-3.5">
                <Avatar name={i.full_name} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="display text-[17px] leading-tight text-ink truncate">{i.full_name}</div>
                  {typeof i.age === 'number' && (
                    <div className="text-[12.5px] text-ink-soft mt-0.5">{t('interns.age_label', { age: i.age })}</div>
                  )}
                </div>
                <Badge tone={STATUS_TONE[i.status]} dot>{statusLabel(i.status)}</Badge>
              </div>

              <div className="text-[12px] text-ink-soft space-y-1">
                <div className="inline-flex items-center gap-1.5 truncate"><Mail size={11} className="text-ink-faint" /> {i.email}</div>
                {i.phone && <div className="inline-flex items-center gap-1.5 tabular text-ink-faint"><Phone size={11} /> {i.phone}</div>}
                {i.interview_at && (
                  <div className="inline-flex items-center gap-1.5 text-ink-faint">
                    <Calendar size={11} /> {t('interns.interview_label', { when: i.interview_at })}
                  </div>
                )}
              </div>

              {i.skills && i.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-auto">
                  {i.skills.slice(0, 4).map((s) => (
                    <span key={s} className="text-[11px] text-ink-soft bg-surface border border-line rounded-full px-2 py-0.5">{s}</span>
                  ))}
                  {i.skills.length > 4 && (
                    <span className="text-[11px] text-ink-faint px-1.5 py-0.5">+{i.skills.length - 4}</span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-ink-faint border-t border-line pt-3 mt-1">
                <span>{i.applied_at ? t('interns.applied_on', { date: fmt(i.applied_at, 'd MMM yyyy') }) : '—'}</span>
                <span className="flex gap-1">
                  <button onClick={() => setEditing(i)}
                    className="text-ink-faint hover:text-ink p-1 rounded-sm" aria-label={t('interns.edit')}>
                    <Edit3 size={12} />
                  </button>
                  <button onClick={() => setDeleting(i)}
                    className="text-ink-faint hover:text-sick p-1 rounded-sm" aria-label={t('interns.delete')}>
                    <Trash2 size={12} />
                  </button>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={openAdd} onClose={() => setOpenAdd(false)}
        title={t('interns.new_intern')} description={t('interns.new_dialog_desc')} side="right">
        <InternForm onSubmit={handleAdd} onCancel={() => setOpenAdd(false)}
          submitLabel={t('common.save')} submitting={submitting} />
      </Dialog>

      <Dialog open={editing !== null} onClose={() => setEditing(null)}
        title={t('interns.edit_dialog_title')} side="right">
        {editing && (
          <InternForm initial={editing} onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
            submitLabel={t('common.save')} submitting={submitting} />
        )}
      </Dialog>

      <Dialog open={deleting !== null} onClose={() => setDeleting(null)}
        title={t('interns.delete_dialog_title')} description={t('interns.delete_dialog_desc')}
        footer={<>
          <Button variant="ghost" onClick={() => setDeleting(null)} disabled={removing}>{t('common.cancel')}</Button>
          <Button variant="danger" onClick={() => void confirmDelete()} loading={removing}>{t('interns.delete_permanent')}</Button>
        </>}>
        {deleting && (
          <div className="flex items-center gap-3 p-3 rounded-md bg-sick/8 border border-sick/30">
            <Avatar name={deleting.full_name} size={36} />
            <div>
              <div className="text-[13.5px] text-ink font-medium">{deleting.full_name}</div>
              <div className="text-[12px] text-ink-faint">{deleting.email}</div>
            </div>
          </div>
        )}
      </Dialog>
    </Layout>
  )
}
