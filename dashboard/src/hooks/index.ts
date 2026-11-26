import { useEffect, useState, useSyncExternalStore } from 'react';
import { usePreferences, type RouteId } from '@/store/preferences';

/** Current time, re-rendered every `intervalMs`. Aligned to the minute when ≥ 60 s. */
export function useNow(intervalMs = 15_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export type Route = RouteId | 'wall';
export const ROUTES: Route[] = ['overview', 'lighting', 'climate', 'pool', 'security', 'devices', 'settings', 'wall'];

function readHash(fallback: Route): Route {
  const h = window.location.hash.replace(/^#\/?/, '').split('?')[0] as Route;
  return ROUTES.includes(h) ? h : fallback;
}

const subscribeHash = (cb: () => void) => {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
};

/** Minimal hash router: #/overview, #/lighting, … #/wall */
export function useRoute(): Route {
  const start = usePreferences((p) => p.startPage);
  return useSyncExternalStore(subscribeHash, () => readHash(start));
}

/** Resolves the theme preference ("system" follows the OS) and applies it to <html>. */
export function useApplyTheme() {
  const pref = usePreferences((p) => p.theme);
  const density = usePreferences((p) => p.density);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const apply = () => {
      const theme = pref === 'system' ? (mq.matches ? 'light' : 'dark') : pref;
      document.documentElement.dataset.theme = theme;
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [pref]);
  useEffect(() => {
    document.documentElement.dataset.density = density;
  }, [density]);
}

/** Within a "HH:MM"–"HH:MM" window that may wrap past midnight. */
export function inTimeWindow(now: number, from: string, until: string): boolean {
  const mins = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  };
  const d = new Date(now);
  const cur = d.getHours() * 60 + d.getMinutes();
  const a = mins(from);
  const b = mins(until);
  return a <= b ? cur >= a && cur < b : cur >= a || cur < b;
}
