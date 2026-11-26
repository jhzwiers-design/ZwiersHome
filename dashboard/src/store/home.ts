/**
 * Home store — the one place screens read state from and send commands through.
 *
 * Responsibilities
 *  - Holds the latest HomeSnapshot from the active DataSource.
 *  - Runs commands: validate → mark pending → execute → success/error toast.
 *  - Tracks which controls have a command in flight (for pending indicators).
 *  - Turns new doorbell presses into an on-screen notification.
 */
import { create } from 'zustand';
import { loadConfig } from '@/config/home.config';
import type { HomeConfig } from '@/config/schema';
import { createDataSource } from '@/data';
import { CommandError, commandTarget, validateCommand, type Command } from '@/data/commands';
import type { DataSource } from '@/data/source';
import type { HomeSnapshot } from '@/data/types';

export type ToastTone = 'success' | 'error' | 'info' | 'event';

export interface Toast {
  id: number;
  /** True while the toast is animating out. */
  leaving?: boolean;
  tone: ToastTone;
  title: string;
  detail?: string;
}

interface HomeStore {
  config: HomeConfig | null;
  configError: string | null;
  snapshot: HomeSnapshot | null;
  /** Commands in flight, keyed by commandTarget(). */
  pending: Record<string, string>;
  toasts: Toast[];
  run: (cmd: Command, labels: { pending: string; success: string }) => Promise<boolean>;
  notify: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: number) => void;
}

let source: DataSource | null = null;
let toastSeq = 0;

export const useHome = create<HomeStore>((set, get) => ({
  config: null,
  configError: null,
  snapshot: null,
  pending: {},
  toasts: [],

  async run(cmd, labels) {
    const { snapshot, config, pending } = get();
    if (!snapshot || !config || !source) return false;
    const key = commandTarget(cmd);
    if (pending[key]) return false;

    try {
      validateCommand(cmd, snapshot, config);
    } catch (e) {
      get().notify({ tone: 'error', title: 'Not sent', detail: errorText(e) });
      return false;
    }

    set((s) => ({ pending: { ...s.pending, [key]: labels.pending } }));
    try {
      const result = await source.execute(cmd);
      get().notify({ tone: 'success', title: labels.success, detail: result.note });
      return true;
    } catch (e) {
      get().notify({ tone: 'error', title: 'Command failed', detail: errorText(e) });
      return false;
    } finally {
      set((s) => {
        const next = { ...s.pending };
        delete next[key];
        return { pending: next };
      });
    }
  },

  notify(toast) {
    const id = ++toastSeq;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { ...toast, id }] }));
    const ms = toast.tone === 'error' ? 8000 : toast.tone === 'event' ? 9000 : 4000;
    setTimeout(() => get().dismiss(id), ms);
  },

  dismiss(id) {
    // Animate out first, then remove.
    set((s) => ({ toasts: s.toasts.map((t) => (t.id === id ? { ...t, leaving: true } : t)) }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 200);
  },
}));

/** Connects the store to the data source. Call once at start-up. */
export function startHome(): DataSource | null {
  if (source) return source;
  const loaded = loadConfig();
  if (!loaded.ok) {
    useHome.setState({ configError: loaded.error });
    return null;
  }
  useHome.setState({ config: loaded.config });
  source = createDataSource(loaded.config);

  let seenEvents: Set<string> | null = null;
  source.subscribe((snapshot) => {
    // Announce doorbell presses that arrive while the dashboard is open.
    const ids = new Set(snapshot.security.events.map((e) => e.id));
    if (seenEvents) {
      for (const ev of snapshot.security.events) {
        if (!seenEvents.has(ev.id) && ev.kind === 'ding') {
          const cam = snapshot.security.cameras.find((c) => c.id === ev.cameraId);
          useHome.getState().notify({ tone: 'event', title: `Doorbell · ${cam?.name ?? 'Camera'}`, detail: 'Someone pressed the doorbell' });
        }
      }
    }
    seenEvents = ids;
    useHome.setState({ snapshot });
  });
  void source.connect();
  return source;
}

export function getSource(): DataSource | null {
  return source;
}

export function usePending(cmd: Command | null): string | undefined {
  return useHome((s) => (cmd ? s.pending[commandTarget(cmd)] : undefined));
}

export function usePendingKey(key: string): string | undefined {
  return useHome((s) => s.pending[key]);
}

function errorText(e: unknown): string {
  if (e instanceof CommandError) return e.message;
  if (e instanceof Error) return e.message;
  return 'Unknown error';
}
