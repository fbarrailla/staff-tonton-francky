import { useState } from 'react'
import { FileSpreadsheet, Upload, AlertTriangle, CheckCircle2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Dialog } from './ui/Dialog'
import { Button } from './ui/Button'
import { Avatar } from './ui/Avatar'
import { parseEmployeesXlsx, type ParseResult } from '@/lib/excelImport'
import { mutate } from '@/lib/store'
import { useEmployees } from '@/hooks/useStore'
import { useRoleLabel } from '@/hooks/useLabels'
import { useToast } from '@/contexts/ToastContext'
import { formatError } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
}

export function ImportEmployeesDialog({ open, onClose }: Props) {
  const { t } = useTranslation()
  const toast = useToast()
  const existing = useEmployees()
  const roleLabel = useRoleLabel()

  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ParseResult | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  // Quick lookup by email (lowercase) to flag new vs update
  const existingEmails = new Set(existing.map((e) => e.email.toLowerCase()))

  async function pickFile(file: File) {
    setParsing(true)
    setParseError(null)
    setResult(null)
    setFileName(file.name)
    try {
      const r = await parseEmployeesXlsx(file)
      setResult(r)
    } catch (e) {
      setParseError(formatError(e))
    } finally {
      setParsing(false)
    }
  }

  function reset() {
    setResult(null)
    setFileName(null)
    setParseError(null)
  }

  async function confirmImport() {
    if (!result || result.rowsValid.length === 0) return
    setImporting(true)
    try {
      const payload = result.rowsValid.map(({ __sourceRow, __originalPosition, ...row }) => {
        void __sourceRow; void __originalPosition
        return row
      })
      const upserted = await mutate.upsertEmployees(payload)
      toast.success(
        t('import.success_title'),
        t('import.success_body', { count: upserted.length }),
      )
      onClose()
      reset()
    } catch (e) {
      toast.error(t('import.failed_title'), formatError(e))
    } finally {
      setImporting(false)
    }
  }

  const newCount =
    result?.rowsValid.filter((r) => !existingEmails.has(r.email.toLowerCase())).length ?? 0
  const updateCount = (result?.rowsValid.length ?? 0) - newCount

  return (
    <Dialog
      open={open}
      onClose={() => { onClose(); reset() }}
      title={t('import.dialog_title')}
      description={t('import.dialog_desc')}
      side="right"
    >
      {!result && !parsing && (
        <FilePicker onPick={pickFile} hint={t('import.file_hint')} prompt={t('import.choose_file')} />
      )}

      {parsing && (
        <div className="rounded-lg border border-dashed border-line-strong/50 bg-surface/30 p-8 text-center">
          <Upload size={20} className="mx-auto text-ink-faint mb-2 animate-pulse" />
          <p className="text-[13px] text-ink-soft">{t('import.parsing', { name: fileName })}</p>
        </div>
      )}

      {parseError && (
        <div className="rounded-md border border-sick/30 bg-sick/8 px-4 py-3 text-[13px] mt-4">
          <div className="inline-flex items-center gap-1.5 text-sick font-medium mb-1">
            <AlertTriangle size={14} /> {t('import.parse_failed')}
          </div>
          <p className="text-ink-soft leading-snug">{parseError}</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={reset}>
            {t('common.retry')}
          </Button>
        </div>
      )}

      {result && !parsing && (
        <div className="space-y-5">
          {/* File summary */}
          <div className="flex items-center gap-3 p-3 rounded-md border border-line bg-surface">
            <FileSpreadsheet size={18} className="text-tonton-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] font-medium text-ink truncate">{fileName}</div>
              <div className="text-[11.5px] text-ink-faint">
                {t('import.detected', { sheet: result.sheetName, total: result.rowsTotal })}
              </div>
            </div>
            <button onClick={reset} className="text-ink-faint hover:text-ink p-1" aria-label="Clear">
              <X size={14} />
            </button>
          </div>

          {/* Summary chips */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <SummaryChip
              tone="working"
              value={newCount}
              label={t('import.summary_new')}
            />
            <SummaryChip
              tone="pending"
              value={updateCount}
              label={t('import.summary_update')}
            />
            <SummaryChip
              tone="rejected"
              value={result.rowsSkipped.length}
              label={t('import.summary_skipped')}
            />
          </div>

          {/* Preview */}
          {result.rowsValid.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line-strong/60 bg-surface/30 p-6 text-center text-[13px] text-ink-soft">
              {t('import.no_valid_rows')}
            </div>
          ) : (
            <div className="border border-line rounded-md overflow-hidden">
              <div className="max-h-[280px] overflow-y-auto nice-scroll">
                <table className="w-full text-[12.5px]">
                  <thead className="bg-surface sticky top-0">
                    <tr className="text-left text-ink-faint uppercase tracking-caps text-[10px]">
                      <th className="px-3 py-2 font-medium"></th>
                      <th className="px-3 py-2 font-medium">{t('import.col_name')}</th>
                      <th className="px-3 py-2 font-medium">{t('import.col_email')}</th>
                      <th className="px-3 py-2 font-medium">{t('import.col_role')}</th>
                      <th className="px-3 py-2 font-medium">{t('import.col_action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {result.rowsValid.map((r) => {
                      const isUpdate = existingEmails.has(r.email.toLowerCase())
                      return (
                        <tr key={r.__sourceRow + r.email}>
                          <td className="px-3 py-2"><Avatar name={r.full_name} size={24} /></td>
                          <td className="px-3 py-2 text-ink font-medium truncate max-w-[150px]">{r.full_name}</td>
                          <td className="px-3 py-2 text-ink-soft truncate max-w-[180px]">{r.email}</td>
                          <td className="px-3 py-2 text-ink-soft">
                            <span className="block leading-tight">{roleLabel(r.role)}</span>
                            {r.__originalPosition && (
                              <span className="block text-[10.5px] text-ink-faint">{r.__originalPosition}</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <span className={cn(
                              'text-[10.5px] uppercase tracking-caps font-medium',
                              isUpdate ? 'text-pending' : 'text-working',
                            )}>
                              {isUpdate ? t('import.action_update') : t('import.action_new')}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Skipped rows */}
          {result.rowsSkipped.length > 0 && (
            <details className="rounded-md border border-line bg-surface/40">
              <summary className="px-3 py-2 cursor-pointer text-[12.5px] text-ink-soft hover:text-ink">
                {t('import.skipped_count', { count: result.rowsSkipped.length })}
              </summary>
              <ul className="px-4 pb-3 pt-1 text-[11.5px] text-ink-faint space-y-0.5">
                {result.rowsSkipped.slice(0, 30).map((s) => (
                  <li key={s.row} className="tabular">Row {s.row}: {s.reason}</li>
                ))}
                {result.rowsSkipped.length > 30 && <li>… {result.rowsSkipped.length - 30} more</li>}
              </ul>
            </details>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button variant="ghost" onClick={() => { onClose(); reset() }} disabled={importing}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              loading={importing}
              disabled={result.rowsValid.length === 0}
              iconLeft={<CheckCircle2 size={14} />}
              onClick={() => void confirmImport()}
            >
              {t('import.confirm', { count: result.rowsValid.length })}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  )
}

function FilePicker({
  onPick, hint, prompt,
}: {
  onPick: (f: File) => void
  hint: string
  prompt: string
}) {
  return (
    <label className={cn(
      'flex flex-col items-center justify-center gap-2 cursor-pointer',
      'rounded-lg border border-dashed border-line-strong/60 bg-surface/40 hover:bg-surface',
      'transition-colors p-10 text-center',
    )}>
      <Upload size={22} className="text-tonton-500" />
      <span className="text-[14px] font-medium text-ink">{prompt}</span>
      <span className="text-[11.5px] text-ink-faint max-w-xs">{hint}</span>
      <input
        type="file"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onPick(f)
        }}
      />
    </label>
  )
}

function SummaryChip({
  tone, value, label,
}: { tone: 'working' | 'pending' | 'rejected'; value: number; label: string }) {
  const styles = {
    working: 'bg-working/8 text-working',
    pending: 'bg-pending/8 text-pending',
    rejected: 'bg-rejected/10 text-rejected',
  }[tone]
  return (
    <div className={cn('rounded-md py-3 px-2', styles)}>
      <div className="display tabular text-[24px] leading-none">{value}</div>
      <div className="text-[10.5px] uppercase tracking-caps mt-1.5 opacity-80">{label}</div>
    </div>
  )
}
