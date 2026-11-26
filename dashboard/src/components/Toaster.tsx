/**
 * Toaster — command results and live events.
 * Announced to screen readers via an aria-live region; errors use "assertive".
 */
import { BellRing, Check, Info, X, AlertCircle } from 'lucide-react';
import { useHome, type Toast } from '@/store/home';
import { cx } from './primitives';

const ICON = { success: Check, error: AlertCircle, info: Info, event: BellRing } as const;

export function Toaster({ placement = 'bottom' }: { placement?: 'bottom' | 'top' }) {
  const toasts = useHome((s) => s.toasts);
  const dismiss = useHome((s) => s.dismiss);
  const isSample = useHome((s) => s.snapshot?.source.kind === 'sample');

  return (
    <div
      className={cx(
        'pointer-events-none fixed inset-x-4 z-40 flex flex-col items-end gap-2 md:right-6 md:left-auto md:w-[380px]',
        placement === 'bottom' ? 'bottom-[calc(var(--bottom-nav-h)+12px)] md:bottom-6' : 'top-16',
      )}
    >
      <div aria-live="polite" className="contents">
        {toasts.filter((t) => t.tone !== 'error').map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} sample={isSample} />
        ))}
      </div>
      <div aria-live="assertive" className="contents">
        {toasts.filter((t) => t.tone === 'error').map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} sample={isSample} />
        ))}
      </div>
    </div>
  );
}

function ToastItem({ toast, onDismiss, sample }: { toast: Toast; onDismiss: (id: number) => void; sample: boolean }) {
  const Icon = ICON[toast.tone];
  return (
    <div
      role={toast.tone === 'error' ? 'alert' : 'status'}
      className={cx(
        'pointer-events-auto flex w-full items-start gap-3 rounded-md border bg-surface px-4 py-3 shadow-[var(--shadow)] animate-zh-in',
        toast.tone === 'error' ? 'border-danger' : toast.tone === 'event' ? 'border-accent' : 'border-rule-strong',
      )}
    >
      <Icon
        aria-hidden
        strokeWidth={1.75}
        className={cx(
          'mt-0.5 size-4 shrink-0',
          toast.tone === 'error' ? 'text-danger' : toast.tone === 'success' ? 'text-fg-2' : 'text-accent-ink',
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="text-body font-medium text-fg">{toast.title}</p>
        {toast.detail && <p className="mt-0.5 text-label text-muted">{toast.detail}</p>}
        {sample && <p className="mt-1 text-micro uppercase tracking-[0.1em] text-faint">Prototype · sample data</p>}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="-mr-1 grid size-6 shrink-0 place-items-center rounded-xs text-muted hover:text-fg"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
