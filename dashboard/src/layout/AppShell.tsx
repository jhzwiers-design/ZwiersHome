/**
 * AppShell — frame for every screen except the wall display.
 *
 *  Top bar      brand · prototype label · connection · clock · light/dark switch
 *  ≥768px       floating pill navigation on the left (icon buttons with tooltips)
 *  <768px       floating pill tab bar at the bottom
 *
 * The prototype label is always visible so sample data is never mistaken for
 * live data.
 */
import { Gauge, House, Lightbulb, MonitorSmartphone, Moon, Settings2, ShieldCheck, Sun, Thermometer, Waves, type LucideIcon } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { cx } from '@/components/primitives';
import type { Route } from '@/hooks';
import { useNow } from '@/hooks';
import { formatTime } from '@/lib/format';
import { ROUTE_TONE } from '@/lib/tones';
import { useHome } from '@/store/home';
import { usePreferences } from '@/store/preferences';

export const NAV: { id: Exclude<Route, 'wall'>; label: string; short: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', short: 'Home', icon: House },
  { id: 'lighting', label: 'Lighting', short: 'Lights', icon: Lightbulb },
  { id: 'climate', label: 'Climate', short: 'Climate', icon: Thermometer },
  { id: 'pool', label: 'Pool & Spa', short: 'Pool', icon: Waves },
  { id: 'security', label: 'Security', short: 'Security', icon: ShieldCheck },
  { id: 'devices', label: 'Devices', short: 'Devices', icon: Gauge },
  { id: 'settings', label: 'Settings', short: 'Settings', icon: Settings2 },
];

export function AppShell({ route, children }: { route: Route; children: ReactNode }) {
  const status = useHome((s) => s.snapshot?.connection.status);
  const offline = status === 'disconnected' || status === 'reconnecting';
  return (
    <div className="min-h-dvh md:pl-[calc(var(--nav-pill-w)+28px)]">
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-accent px-4 py-2 text-on-accent focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <PillNav route={route} />
      <div className="mx-auto w-full max-w-[var(--content-max)] px-4 sm:px-6 md:pr-8 md:pl-2 xl:pr-12">
        <TopBar />
        <ConnectionBanner />
        <main
          id="main"
          tabIndex={-1}
          aria-describedby={offline ? 'connection-banner' : undefined}
          className={cx(
            'pt-2 pb-[calc(var(--bottom-nav-h)+40px)] focus:outline-none md:pb-14',
            // Last-known values: visibly dimmed so they can't be mistaken for live data.
            offline && 'opacity-60 saturate-50 transition-opacity',
          )}
        >
          {children}
        </main>
      </div>
      <BottomNav route={route} />
    </div>
  );
}

function TopBar() {
  const conn = useHome((s) => s.snapshot?.connection.status);
  const name = useHome((s) => s.config?.home.name ?? 'Home');
  const isSample = useHome((s) => s.snapshot?.source.kind === 'sample');
  const clock = usePreferences((p) => p.clock);
  const now = useNow(10_000);

  return (
    <header
      className={cx(
        // Phones: a compact sticky app bar with a frosted background.
        'sticky top-0 z-20 -mx-4 flex items-center justify-between gap-3 bg-bg/80 px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3 backdrop-blur-xl',
        'sm:-mx-6 sm:px-6 md:static md:mx-0 md:flex-wrap md:gap-x-4 md:gap-y-3 md:bg-transparent md:px-0 md:py-6 md:backdrop-blur-none',
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5 md:gap-3">
        <Mark className="max-md:size-8" />
        <span className="truncate text-body font-semibold tracking-[-0.01em] text-fg md:text-lead">{name}</span>
        {isSample && (
          <span
            role="note"
            title="Prototype: sample data only. No commands are sent to real devices."
            className="shrink-0 rounded-full border border-dashed border-control px-2 py-0.5 text-micro font-semibold tracking-[0.08em] text-fg-2 uppercase md:hidden"
          >
            Prototype<span className="sr-only">: sample data only. No commands are sent to real devices.</span>
          </span>
        )}
      </div>

      {isSample && (
        <p
          role="note"
          className="hidden items-center gap-2 rounded-full border border-dashed border-control px-3.5 py-1.5 text-label text-muted md:flex"
        >
          <span className="caps text-fg-2">Prototype</span>
          <span className="lg:hidden">Sample data</span>
          <span className="max-lg:hidden">Sample data only. No commands are sent to real devices.</span>
        </p>
      )}

      <div className="flex items-center gap-2">
        <span className="tile hidden items-center gap-2 rounded-full! px-3.5 py-2 text-label text-fg-2 sm:inline-flex">
          <ConnectionDot status={conn} />
          {connLabel(conn)}
          <span className="num text-muted">· {formatTime(now, clock)}</span>
        </span>
        <ThemeSwitch />
      </div>
    </header>
  );
}

/** Light/dark switch: a two-icon pill, like a physical rocker. */
export function ThemeSwitch() {
  const pref = usePreferences((p) => p.theme);
  const set = usePreferences((p) => p.set);
  const [resolved, setResolved] = useState(() => document.documentElement.dataset.theme ?? 'dark');
  useEffect(() => {
    const obs = new MutationObserver(() => setResolved(document.documentElement.dataset.theme ?? 'dark'));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);
  const current = pref === 'system' ? resolved : pref;

  const opt = (value: 'dark' | 'light', Icon: LucideIcon, label: string) => (
    <button
      type="button"
      role="radio"
      aria-checked={current === value}
      aria-label={label}
      title={label}
      onClick={() => set('theme', value)}
      className={cx(
        'grid size-8 place-items-center rounded-full transition-colors duration-[var(--dur)] md:size-9',
        current === value ? 'bg-fg text-bg' : 'text-muted hover:text-fg',
      )}
    >
      <Icon aria-hidden className="size-4" strokeWidth={1.75} />
    </button>
  );

  return (
    <div role="radiogroup" aria-label="Colour mode" className="tile flex items-center gap-0.5 rounded-full! p-1">
      {opt('dark', Moon, 'Dark mode')}
      {opt('light', Sun, 'Light mode')}
    </div>
  );
}

function PillNav({ route }: { route: Route }) {
  return (
    <nav
      aria-label="Primary"
      className="fixed top-1/2 left-5 z-30 hidden w-[var(--nav-pill-w)] -translate-y-1/2 md:block"
    >
      <ul className="tile flex flex-col items-center gap-2 rounded-full! px-2 py-4">
        {NAV.map((item) => (
          <li key={item.id}>
            <NavButton key={item.id === route ? 'on' : 'off'} href={`#/${item.id}`} label={item.label} icon={item.icon} active={item.id === route} tone={ROUTE_TONE[item.id]} />
          </li>
        ))}
        <li aria-hidden className="my-1 h-px w-8 bg-rule" />
        <li>
          <NavButton href="#/wall" label="Wall display" icon={MonitorSmartphone} active={false} />
        </li>
      </ul>
    </nav>
  );
}

function NavButton({ href, label, icon: Icon, active, tone }: { href: string; label: string; icon: LucideIcon; active: boolean; tone?: string }) {
  return (
    <a
      href={href}
      aria-current={active ? 'page' : undefined}
      aria-label={label}
      data-tone={tone}
      className={cx(
        'group relative grid size-12 place-items-center rounded-full transition-[background-color,color,box-shadow,transform] duration-[var(--dur)] ease-[var(--ease-spring)]',
        active ? 'animate-zh-pop scale-105 border border-accent-ink bg-accent text-on-accent shadow-[var(--accent-glow)]' : 'text-muted hover:scale-105 hover:bg-accent-soft hover:text-accent-ink',
      )}
    >
      <Icon aria-hidden className="size-5" strokeWidth={active ? 2 : 1.6} />
      {/* Tooltip */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-full ml-3 rounded-full bg-fg px-3 py-1.5 text-label font-medium whitespace-nowrap text-bg opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        {label}
      </span>
    </a>
  );
}

function BottomNav({ route }: { route: Route }) {
  return (
    <nav aria-label="Primary" className="fixed inset-x-3 bottom-3 z-30 pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="tile grid h-[var(--bottom-nav-h)] grid-cols-7 rounded-full! bg-surface/90! px-1.5 shadow-[var(--shadow)] backdrop-blur-xl">
        {NAV.map((item) => {
          const active = item.id === route;
          const Icon = item.icon;
          return (
            <li key={item.id} className="grid place-items-center">
              <a
                href={`#/${item.id}`}
                aria-current={active ? 'page' : undefined}
                aria-label={item.label}
                data-tone={ROUTE_TONE[item.id]}
                className={cx(
                  'grid size-11 place-items-center rounded-full transition-[background-color,color,transform] duration-[var(--dur)] ease-[var(--ease-spring)]',
                  active ? 'animate-zh-pop scale-105 border border-accent-ink bg-accent text-on-accent shadow-[var(--accent-glow)]' : 'text-muted active:bg-accent-soft',
                )}
              >
                <Icon aria-hidden className="size-5" strokeWidth={active ? 2 : 1.6} />
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ConnectionBanner() {
  const status = useHome((s) => s.snapshot?.connection.status);
  if (!status || status === 'connected' || status === 'connecting') return null;
  return (
    <div role="alert" id="connection-banner" className="mb-4 rounded-md border border-danger bg-danger-soft px-4 py-3 text-body text-danger">
      {status === 'reconnecting'
        ? 'Reconnecting to Home Assistant…'
        : 'Connection to Home Assistant lost. Values below are the last known and may be out of date; controls are paused.'}
    </div>
  );
}

export function ConnectionDot({ status }: { status?: string }) {
  return (
    <span
      aria-hidden
      className={cx(
        'inline-block size-2 rounded-full',
        status === 'connected' && 'bg-accent shadow-[0_0_8px_var(--accent)]',
        (status === 'connecting' || status === 'reconnecting') && 'bg-danger animate-zh-pulse',
        status === 'disconnected' && 'bg-danger',
        !status && 'border border-muted',
      )}
    />
  );
}

export function connLabel(status?: string) {
  switch (status) {
    case 'connected':
      return 'Live';
    case 'connecting':
      return 'Connecting…';
    case 'reconnecting':
      return 'Reconnecting…';
    case 'disconnected':
      return 'Disconnected';
    default:
      return 'Starting…';
  }
}

/** Brand mark: a gable in a filled accent circle. */
export function Mark({ className }: { className?: string }) {
  return (
    <span className={cx('grid size-9 shrink-0 place-items-center rounded-full bg-accent text-on-accent shadow-[var(--accent-glow)]', className)}>
      <svg viewBox="0 0 24 24" aria-hidden className="size-5">
        <path d="M5 19v-8.5l7-5 7 5V19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M10 19v-5h4v5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/** Kept for screens that announce the prototype inline. */
export function PrototypeBanner() {
  return null;
}
