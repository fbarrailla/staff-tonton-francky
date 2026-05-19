import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Edit3, Mail, Phone, Trash2, FileText,
  Link as LinkIcon, Calendar as CalendarIcon, Download,
  CheckCircle2, Clock, MessageSquare,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Layout } from '@/components/Layout'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { ApplicantForm } from '@/components/ApplicantForm'
import { useApplicant } from '@/hooks/useStore'
import { mutate } from '@/lib/store'
import { signedUrl, uploadApplicantFile } from '@/lib/storage'
import { useToast } from '@/contexts/ToastContext'
import { type Applicant, type ApplicantStatus } from '@/types'
import { ageFromDob, cn, formatError } from '@/lib/utils'
import { useApplicantStatusLabel } from '@/hooks/useLabels'
import { useFormatDate } from '@/hooks/useLocale'

const STATUS_TONE: Record<ApplicantStatus, 'neutral' | 'pending' | 'approved' | 'working' | 'rejected'> = {
  nouveau: 'neutral', en_revue: 'pending', entretien: 'approved', embauche: 'working', refuse: 'rejected',
}
const STATUS_FLOW: ApplicantStatus[] = ['nouveau', 'en_revue', 'entretien', 'embauche']

export function ApplicantDetail() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const applicant = useApplicant(id)
  const navigate = useNavigate()
  const toast = useToast()
  const statusLabel = useApplicantStatusLabel()
  const fmt = useFormatDate()

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const statusIndex = useMemo(() => (applicant ? STATUS_FLOW.indexOf(applicant.status) : -1), [applicant])

  if (!applicant) {
    return (
      <Layout title={t('applicant_detail.not_found')}>
        <Button variant="ghost" iconLeft={<ArrowLeft size={14} />} onClick={() => navigate('/candidats')}>
          {t('applicant_detail.back')}
        </Button>
      </Layout>
    )
  }

  async function openSigned(path: string, _name: string) {
    try {
      const url = await signedUrl('applicants', path, 120)
      const win = window.open(url, '_blank', 'noopener,noreferrer')
      if (!win) toast.info(t('errors.popup_blocked_title'), t('errors.popup_blocked_body'))
    } catch (e) {
      toast.error(t('errors.download_failed'), formatError(e))
    }
  }

  async function update(
    data: Omit<Applicant, 'id' | 'created_at' | 'updated_at'>,
    files: { cv: File | null; motivation: File | null },
  ) {
    setSubmitting(true)
    try {
      let cv_url = data.cv_url
      let motivation_letter_url = data.motivation_letter_url
      if (files.cv) cv_url = await uploadApplicantFile(files.cv, 'cv')
      if (files.motivation) motivation_letter_url = await uploadApplicantFile(files.motivation, 'motivation')
      await mutate.updateApplicant(applicant!.id, { ...data, cv_url, motivation_letter_url })
      setEditOpen(false)
      toast.success(t('applicant_detail.sheet_updated'))
    } catch (e) {
      toast.error(t('errors.update_failed'), formatError(e))
    } finally {
      setSubmitting(false)
    }
  }

  async function remove() {
    setDeleting(true)
    try {
      await mutate.deleteApplicant(applicant!.id)
      toast.info(t('applicant_detail.deleted_toast'))
      navigate('/candidats')
    } catch (e) {
      toast.error(t('errors.delete_failed'), formatError(e))
    } finally {
      setDeleting(false)
    }
  }

  async function setStatus(s: ApplicantStatus) {
    if (s === applicant!.status) return
    setUpdatingStatus(true)
    try {
      await mutate.updateApplicant(applicant!.id, { status: s })
      toast.success(t('applicant_detail.status_updated_toast'), statusLabel(s))
    } catch (e) {
      toast.error(t('errors.action_failed'), formatError(e))
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <Layout
      eyebrow={<Link to="/candidats" className="hover:text-ink inline-flex items-center gap-1">
        <ArrowLeft size={11} /> {t('applicant_detail.eyebrow_back')}</Link>}
      title={applicant.full_name}>
      <section className="surface-card p-6 lg:p-8 mb-6 flex flex-wrap items-start gap-6">
        <Avatar name={applicant.full_name} size={108} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="label-caps">{applicant.applied_position || t('applicants.position_unset')}</span>
            <Badge tone={STATUS_TONE[applicant.status]} dot>{statusLabel(applicant.status)}</Badge>
          </div>
          <h1 className="display text-[clamp(28px,3vw,40px)] leading-tight text-ink">{applicant.full_name}</h1>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13.5px] text-ink-soft">
            <a href={`mailto:${applicant.email}`} className="inline-flex items-center gap-1.5 hover:text-ink">
              <Mail size={13} /> {applicant.email}
            </a>
            {applicant.phone && (
              <a href={`tel:${applicant.phone}`} className="inline-flex items-center gap-1.5 hover:text-ink tabular">
                <Phone size={13} /> {applicant.phone}
              </a>
            )}
            <span className="inline-flex items-center gap-1.5">
              <CalendarIcon size={13} /> {t('applicant_detail.received_on', { date: fmt(applicant.applied_at, 'd MMMM yyyy') })}
            </span>
            {(() => {
              const age = ageFromDob(applicant.date_of_birth)
              return age !== null ? (
                <span className="inline-flex items-center gap-1.5 tabular">
                  {t('common.age_years', { count: age })}
                </span>
              ) : null
            })()}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" iconLeft={<Edit3 size={14} />} onClick={() => setEditOpen(true)}>{t('applicant_detail.edit')}</Button>
          <Button variant="ghost" iconLeft={<Trash2 size={14} />} onClick={() => setDeleteOpen(true)}>{t('applicant_detail.delete')}</Button>
        </div>
      </section>

      <section className="surface-card p-5 mb-6">
        <div className="label-caps mb-3">{t('applicant_detail.pipeline')}</div>
        <div className="flex items-center gap-2 overflow-x-auto nice-scroll pb-1">
          {STATUS_FLOW.map((s, i) => {
            const done = i < statusIndex
            const active = i === statusIndex
            const Icon = done ? CheckCircle2 : active ? Clock : null
            return (
              <button key={s} disabled={updatingStatus} onClick={() => void setStatus(s)}
                className={cn(
                  'group flex items-center gap-2 rounded-full border px-3 h-9 text-[12.5px] font-medium tracking-tightish transition-colors whitespace-nowrap',
                  active ? 'bg-tonton-500 text-white border-tonton-600'
                    : done ? 'bg-working/10 text-working border-working/30'
                      : 'bg-surface text-ink-soft border-line hover:border-line-strong hover:text-ink',
                )}>
                {Icon ? <Icon size={13} className="shrink-0" /> : <span className="tabular text-[11px] text-ink-faint">{i + 1}</span>}
                {statusLabel(s)}
              </button>
            )
          })}
          <span className="mx-1 h-px w-6 bg-line shrink-0" />
          <button disabled={updatingStatus} onClick={() => void setStatus('refuse')}
            className={cn(
              'rounded-full border px-3 h-9 text-[12.5px] font-medium tracking-tightish transition-colors whitespace-nowrap',
              applicant.status === 'refuse'
                ? 'bg-rejected/15 text-rejected border-rejected/40'
                : 'bg-surface text-ink-soft border-line hover:text-sick hover:border-sick/40',
            )}>
            {statusLabel('refuse')}
          </button>
        </div>
      </section>

      <section className="grid lg:grid-cols-[1fr_2fr] gap-6">
        <div className="space-y-6">
          <div className="surface-card p-5">
            <div className="label-caps mb-3">{t('applicant_detail.skills')}</div>
            {applicant.skills.length === 0 ? (
              <p className="text-[13px] text-ink-faint italic">{t('applicant_detail.no_skills')}</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {applicant.skills.map((s) => (
                  <span key={s} className="text-[12px] text-ink-soft bg-surface border border-line rounded-full px-2.5 py-1">{s}</span>
                ))}
              </div>
            )}
          </div>

          {applicant.portfolio_url && (
            <div className="surface-card p-5">
              <div className="label-caps mb-3">{t('applicant_detail.portfolio')}</div>
              <a href={applicant.portfolio_url} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 text-[13.5px] text-tonton-600 hover:text-tonton-700 underline underline-offset-4 break-all">
                <LinkIcon size={14} className="shrink-0" />
                {applicant.portfolio_url}
              </a>
            </div>
          )}

          {applicant.admin_note && (
            <div className="surface-card p-5">
              <div className="label-caps mb-3 flex items-center gap-1.5">
                <MessageSquare size={11} /> {t('applicant_detail.internal_note')}
              </div>
              <p className="text-[13px] text-ink leading-snug whitespace-pre-wrap">{applicant.admin_note}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <header className="flex items-center justify-between mb-3">
              <h2 className="display text-[20px]">{t('applicant_detail.documents')}</h2>
              <Button size="sm" variant="ghost" iconLeft={<Edit3 size={13} />} onClick={() => setEditOpen(true)}>
                {t('applicant_detail.replace')}
              </Button>
            </header>
            <div className="surface-card divide-y divide-line overflow-hidden">
              <DocumentRow label={t('applicant_detail.cv')} path={applicant.cv_url}
                openLabel={t('applicant_detail.open')} notProvided={t('applicant_detail.not_provided')}
                onOpen={(p) => void openSigned(p, `cv-${applicant.full_name}`)} />
              <DocumentRow label={t('applicant_detail.motivation')} path={applicant.motivation_letter_url}
                openLabel={t('applicant_detail.open')} notProvided={t('applicant_detail.not_provided')}
                onOpen={(p) => void openSigned(p, `motivation-${applicant.full_name}`)} />
            </div>
            <p className="text-[11.5px] text-ink-faint mt-2 italic">{t('applicant_detail.doc_hint')}</p>
          </div>
        </div>
      </section>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)}
        title={t('applicant_detail.edit_dialog_title')} side="right">
        <ApplicantForm initial={applicant} onSubmit={update} onCancel={() => setEditOpen(false)}
          submitLabel={t('common.save')} submitting={submitting} />
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}
        title={t('applicant_detail.delete_dialog_title')} description={t('applicant_detail.delete_dialog_desc')}
        footer={<>
          <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={deleting}>{t('common.cancel')}</Button>
          <Button variant="danger" onClick={() => void remove()} loading={deleting}>{t('applicant_detail.delete_permanent')}</Button>
        </>}>
        <div className="flex items-center gap-3 p-3 rounded-md bg-sick/8 border border-sick/30">
          <Avatar name={applicant.full_name} size={36} />
          <div>
            <div className="text-[13.5px] text-ink font-medium">{applicant.full_name}</div>
            <div className="text-[12px] text-ink-faint">{applicant.email}</div>
          </div>
        </div>
      </Dialog>
    </Layout>
  )
}

function DocumentRow({
  label, path, openLabel, notProvided, onOpen,
}: {
  label: string; path: string | null; openLabel: string; notProvided: string
  onOpen: (path: string) => void
}) {
  if (!path) {
    return (
      <div className="p-4 flex items-center gap-3 text-[13px]">
        <FileText size={16} className="text-ink-faint" />
        <span className="text-ink-soft">{label}</span>
        <span className="ml-auto text-[11.5px] text-ink-faint italic">{notProvided}</span>
      </div>
    )
  }
  return (
    <div className="p-4 flex items-center gap-3 text-[13px]">
      <FileText size={16} className="text-tonton-500" />
      <div className="flex-1 min-w-0">
        <div className="text-ink font-medium">{label}</div>
        <div className="text-[11px] text-ink-faint truncate font-mono">{path}</div>
      </div>
      <Button size="sm" variant="secondary" iconLeft={<Download size={13} />} onClick={() => onOpen(path)}>
        {openLabel}
      </Button>
    </div>
  )
}
