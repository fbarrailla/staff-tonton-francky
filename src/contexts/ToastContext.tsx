import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'
import { cn, newId } from '@/lib/utils'

type ToastKind = 'success' | 'error' | 'info'
interface Toast {
  id: string
  kind: ToastKind
  title: string
  body?: string
}

const Ctx = createContext<{
  show: (kind: ToastKind, title: string, body?: string) => void
  success: (title: string, body?: string) => void
  error: (title: string, body?: string) => void
  info: (title: string, body?: string) => void
}>({
  show: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: string) => {
    setToasts((ts) => ts.filter((t) => t.id !== id))
  }, [])

  const show = useCallback(
    (kind: ToastKind, title: string, body?: string) => {
      const t: Toast = { id: newId(), kind, title, body }
      setToasts((cur) => [...cur, t])
      setTimeout(() => remove(t.id), 4500)
    },
    [remove],
  )

  const api = {
    show,
    success: (title: string, body?: string) => show('success', title, body),
    error: (title: string, body?: string) => show('error', title, body),
    info: (title: string, body?: string) => show('info', title, body),
  }

  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-[min(380px,calc(100vw-2.5rem))] pointer-events-none">
        {toasts.map((t) => {
          const Icon = t.kind === 'success' ? CheckCircle2 : t.kind === 'error' ? AlertTriangle : Info
          const ring =
            t.kind === 'success'
              ? 'before:bg-working'
              : t.kind === 'error'
                ? 'before:bg-sick'
                : 'before:bg-tonton-500'
          return (
            <div
              key={t.id}
              className={cn(
                'pointer-events-auto relative overflow-hidden surface-card pl-4 pr-3 py-3 flex gap-3 items-start animate-fade-up',
                "before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1",
                ring,
              )}
            >
              <Icon
                size={18}
                className={cn(
                  'mt-0.5 shrink-0',
                  t.kind === 'success'
                    ? 'text-working'
                    : t.kind === 'error'
                      ? 'text-sick'
                      : 'text-tonton-500',
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink leading-tight">{t.title}</div>
                {t.body && (
                  <div className="text-[13px] text-ink-soft mt-0.5 leading-snug">{t.body}</div>
                )}
              </div>
              <button
                onClick={() => remove(t.id)}
                className="text-ink-faint hover:text-ink p-1 rounded-sm"
                aria-label="Fermer"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </Ctx.Provider>
  )
}

export const useToast = () => useContext(Ctx)
