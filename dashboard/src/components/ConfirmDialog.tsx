/**
 * ConfirmDialog — required before potentially disruptive operations
 * (pool heater, pumps, valves). Built on Radix AlertDialog: focus is trapped,
 * Escape cancels, and the safe choice (Cancel) receives initial focus.
 *
 * Usage: const confirm = useConfirm(); … confirm({...}).then(ok => ok && run())
 */
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { create } from 'zustand';
import { Button, SampleTag } from './primitives';

interface ConfirmRequest {
  title: string;
  body: string;
  /** Short list of concrete effects, e.g. "Heater turns on", "Setpoint 102°". */
  effects?: string[];
  confirmLabel: string;
  tone?: 'default' | 'danger';
}

interface ConfirmState {
  request: (ConfirmRequest & { resolve: (ok: boolean) => void }) | null;
  open: (r: ConfirmRequest) => Promise<boolean>;
  close: (ok: boolean) => void;
}

const useConfirmStore = create<ConfirmState>((set, get) => ({
  request: null,
  open: (r) =>
    new Promise<boolean>((resolve) => {
      get().request?.resolve(false);
      set({ request: { ...r, resolve } });
    }),
  close: (ok) => {
    get().request?.resolve(ok);
    set({ request: null });
  },
}));

/** Cancel any open confirmation (used when the wall display returns home). */
export function cancelConfirm() {
  useConfirmStore.getState().close(false);
}

export function useConfirm() {
  return useConfirmStore((s) => s.open);
}

/** Mount once at the app root. */
export function ConfirmHost() {
  const request = useConfirmStore((s) => s.request);
  const close = useConfirmStore((s) => s.close);

  return (
    <AlertDialog.Root open={!!request} onOpenChange={(o) => !o && close(false)}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="zh-overlay fixed inset-0 z-50 bg-[var(--scrim)] backdrop-blur-[2px]" />
        <AlertDialog.Content
          className="zh-dialog fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-32px)] w-[min(460px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[22px] border border-rule bg-surface p-6 shadow-[var(--shadow)]"
          onEscapeKeyDown={() => close(false)}
        >
          {request && (
            <>
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="caps text-accent-ink">Confirm</span>
                <SampleTag>Prototype · no real command</SampleTag>
              </div>
              <AlertDialog.Title className="text-h2 font-medium text-fg">{request.title}</AlertDialog.Title>
              <AlertDialog.Description className="mt-2 text-body text-fg-2">{request.body}</AlertDialog.Description>
              {request.effects && request.effects.length > 0 && (
                <ul className="mt-4 border-t border-rule">
                  {request.effects.map((e) => (
                    <li key={e} className="border-b border-rule py-2 text-body text-fg-2">
                      {e}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-6 flex justify-end gap-3">
                <AlertDialog.Cancel asChild>
                  <Button variant="quiet" autoFocus>
                    Cancel
                  </Button>
                </AlertDialog.Cancel>
                <AlertDialog.Action asChild>
                  <Button variant={request.tone === 'danger' ? 'danger' : 'solid'} onClick={() => close(true)}>
                    {request.confirmLabel}
                  </Button>
                </AlertDialog.Action>
              </div>
            </>
          )}
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
