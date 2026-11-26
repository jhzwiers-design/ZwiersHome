/** Display formatting. Values are stored in °F; conversion happens only here. */
import type { Preferences } from '@/store/preferences';

export function toUnit(f: number, unit: Preferences['tempUnit']): number {
  return unit === 'C' ? ((f - 32) * 5) / 9 : f;
}

/** "71°" / "21.5°". Whole degrees for °F, half degrees for °C. */
export function formatTemp(f: number | null | undefined, unit: Preferences['tempUnit'], opts: { decimals?: boolean } = {}): string {
  if (f === null || f === undefined || Number.isNaN(f)) return '—';
  const v = toUnit(f, unit);
  if (unit === 'C') return `${(Math.round(v * 2) / 2).toFixed(1)}°`;
  return opts.decimals ? `${v.toFixed(1)}°` : `${Math.round(v)}°`;
}

/** Convert a °F step (setpoint stepper) to the size shown in the current unit. */
export function setpointStepF(unit: Preferences['tempUnit']): number {
  return unit === 'C' ? 0.9 : 1; // 0.5 °C ≈ 0.9 °F
}

export function formatTime(ts: number, clock: Preferences['clock']): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: clock === '12h',
  });
}

export function formatDate(ts: number, style: 'long' | 'short' = 'long'): string {
  return new Date(ts).toLocaleDateString(undefined, {
    weekday: 'long',
    month: style === 'long' ? 'long' : 'short',
    day: 'numeric',
  });
}

/** "just now", "4 min ago", "2 h ago", "yesterday", "Mon 3:10 PM". */
export function relativeTime(ts: number | null, now: number, clock: Preferences['clock']): string {
  if (ts === null) return 'never';
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 45) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 12) return `${h} h ago`;
  const d = new Date(ts);
  const today = new Date(now);
  const yesterday = new Date(now - 86_400_000);
  if (d.toDateString() === today.toDateString()) return `today ${formatTime(ts, clock)}`;
  if (d.toDateString() === yesterday.toDateString()) return `yesterday ${formatTime(ts, clock)}`;
  return `${d.toLocaleDateString(undefined, { weekday: 'short' })} ${formatTime(ts, clock)}`;
}

export function dayLabel(ts: number, now: number): string {
  const d = new Date(ts).toDateString();
  if (d === new Date(now).toDateString()) return 'Today';
  if (d === new Date(now - 86_400_000).toDateString()) return 'Yesterday';
  return new Date(ts).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
