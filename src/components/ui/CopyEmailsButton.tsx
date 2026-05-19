import { useState } from 'react'
import { ClipboardCopy, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from './Button'
import { useToast } from '@/contexts/ToastContext'
import { formatError } from '@/lib/utils'

interface Props {
  emails: string[]
  className?: string
}

export function CopyEmailsButton({ emails, className }: Props) {
  const { t } = useTranslation()
  const toast = useToast()
  const [copied, setCopied] = useState(false)

  // Dedupe while preserving order, drop blanks
  const clean = Array.from(
    new Set(
      emails
        .map((e) => (e ?? '').trim().toLowerCase())
        .filter(Boolean),
    ),
  )

  async function copy() {
    if (clean.length === 0) {
      toast.info(t('copy_emails.empty_title'), t('copy_emails.empty_body'))
      return
    }
    const text = clean.join(', ')
    try {
      if (!navigator.clipboard) throw new Error('Clipboard API unavailable')
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success(
        t('copy_emails.done_title'),
        t('copy_emails.done_body', { count: clean.length }),
      )
      setTimeout(() => setCopied(false), 1500)
    } catch (e) {
      toast.error(t('copy_emails.failed_title'), formatError(e))
    }
  }

  return (
    <Button
      variant="secondary"
      iconLeft={copied ? <Check size={14} className="text-working" /> : <ClipboardCopy size={14} />}
      onClick={() => void copy()}
      className={className}
      title={t('copy_emails.tooltip', { count: clean.length })}
    >
      {t('copy_emails.button')}
      {clean.length > 0 && (
        <span className="ml-1.5 tabular text-[11px] text-ink-faint">({clean.length})</span>
      )}
    </Button>
  )
}
