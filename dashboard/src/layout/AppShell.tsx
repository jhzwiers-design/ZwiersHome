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
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useSlidingIndicator } from '@/hooks/useSlidingIndicator';
import { WallDock } from '@/layout/WallDock';
import { cx } from '@/components/primitives';
import type { Route } from '@/hooks';
import { useNow } from '@/hooks';
import { formatTime } from '@/lib/format';
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

export function AppShell({ route, wall, children }: { route: Route; wall?: boolean; children: ReactNode }) {
  const status = useHome((s) => s.snapshot?.connection.status);
  const offline = status === 'disconnected' || status === 'reconnecting';
  return (
    <div className={cx('min-h-dvh', !wall && 'md:pl-[calc(var(--nav-pill-w)+28px)]')} data-wall-mode={wall || undefined}>
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-accent px-4 py-2 text-on-accent focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      {!wall && <PillNav route={route} />}
      <div className="mx-auto w-full max-w-[var(--content-max)] px-4 sm:px-6 md:pr-8 md:pl-2 xl:pr-12">
        <TopBar />
        <ConnectionBanner />
        <main
          id="main"
          tabIndex={-1}
          aria-describedby={offline ? 'connection-banner' : undefined}
          className={cx(
            'pt-2 focus:outline-none',
            wall ? 'pb-[calc(96px+env(safe-area-inset-bottom))]' : 'pb-[calc(var(--bottom-nav-h)+40px)] md:pb-14',
            // Last-known values: visibly dimmed so they can't be mistaken for live data.
            offline && 'opacity-60 saturate-50 transition-opacity',
          )}
        >
          {children}
        </main>
      </div>
      {wall ? (
        <div className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-bg via-bg/85 to-transparent px-4 pt-6 pb-[max(env(safe-area-inset-bottom),12px)]">
          <WallDock />
        </div>
      ) : (
        <BottomNav route={route} />
      )}
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
        'hit-44 grid size-8 place-items-center rounded-full transition-colors duration-[var(--dur)] md:size-9',
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
  const listRef = useRef<HTMLUListElement>(null);
  const { style } = useSlidingIndicator(listRef, '[aria-current="page"]', route);
  return (
    <nav aria-label="Primary" className="fixed top-1/2 left-5 z-30 hidden w-[var(--nav-pill-w)] -translate-y-1/2 md:block">
      <ul ref={listRef} className="tile relative flex flex-col items-center gap-2 rounded-full! px-2 py-4">
        {/* One shared selection pill that glides between destinations */}
        <span aria-hidden className="pointer-events-none absolute top-0 left-0 rounded-full bg-accent shadow-[var(--accent-glow)]" style={style} />
        {NAV.map((item) => (
          <li key={item.id} className="relative">
            <NavButton href={`#/${item.id}`} label={item.label} icon={item.icon} active={item.id === route} />
          </li>
        ))}
        <li aria-hidden className="my-1 h-px w-8 bg-rule" />
        <li className="relative">
          <NavButton href="#/wall" label="Home display" icon={MonitorSmartphone} active={false} />
        </li>
      </ul>
    </nav>
  );
}

function NavButton({ href, label, icon: Icon, active }: { href: string; label: string; icon: LucideIcon; active: boolean }) {
  return (
    <a
      href={href}
      aria-current={active ? 'page' : undefined}
      aria-label={label}
      className={cx(
        'group relative grid size-12 place-items-center rounded-full transition-[color,background-color,transform] duration-[var(--dur)] ease-[var(--ease-out)]',
        'active:scale-90',
        active ? 'text-on-accent' : 'text-muted hover:bg-surface-2 hover:text-fg',
      )}
    >
      <Icon
        aria-hidden
        className={cx('size-5 transition-transform duration-[420ms] ease-[var(--ease-spring)]', active && 'scale-110')}
        strokeWidth={active ? 2.1 : 1.7}
      />
      {/* Tooltip */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-full ml-3 translate-x-[-4px] rounded-full bg-fg px-3 py-1.5 text-label font-medium whitespace-nowrap text-bg opacity-0 transition-[opacity,transform] duration-[var(--dur)] group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
      >
        {label}
      </span>
    </a>
  );
}

function BottomNav({ route }: { route: Route }) {
  const listRef = useRef<HTMLUListElement>(null);
  const { style } = useSlidingIndicator(listRef, '[aria-current="page"]', route);
  return (
    <nav aria-label="Primary" className="fixed inset-x-3 bottom-[max(env(safe-area-inset-bottom),12px)] z-30 md:hidden">
      <ul
        ref={listRef}
        className="tile relative grid h-[var(--bottom-nav-h)] grid-cols-7 items-center rounded-[28px]! bg-surface/88! px-1 shadow-[var(--shadow)] backdrop-blur-xl"
      >
        <span aria-hidden className="pointer-events-none absolute top-0 left-0 rounded-[20px] bg-accent-soft" style={style} />
        {NAV.map((item) => {
          const active = item.id === route;
          const Icon = item.icon;
          return (
            <li key={item.id} className="relative flex justify-center">
              <a
                href={`#/${item.id}`}
                aria-current={active ? 'page' : undefined}
                className={cx(
                  'flex h-[52px] w-full max-w-[56px] flex-col items-center justify-center gap-0.5 rounded-[20px] transition-[color,transform] duration-[var(--dur)] active:scale-90',
                  active ? 'text-accent-ink' : 'text-muted',
                )}
              >
                <Icon
                  aria-hidden
                  className={cx('size-[22px] transition-transform duration-[420ms] ease-[var(--ease-spring)]', active && '-translate-y-px scale-110')}
                  strokeWidth={active ? 2.2 : 1.7}
                />
                <span className={cx('text-[10px] leading-none font-medium tracking-tight', active ? 'font-semibold' : '')}>{item.short}</span>
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

/** Brand mark: the "Gable" ZH monogram (a house whose crossbar is a Z) in a Redwood circle. */
export function Mark({ className }: { className?: string }) {
  return (
    <span data-tone="brand" className={cx('grid size-9 shrink-0 place-items-center rounded-full bg-accent text-on-accent shadow-[var(--accent-glow)]', className)}>
      <svg viewBox="0 0 100 100" aria-hidden className="size-[62%]">
        <path
          d="M12 44 L50 10 L88 44 M24 34 L24 90 M76 34 L76 90 M24 52 L58 52 L42 74 L76 74"
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/** Kept for screens that announce the prototype inline. */
export function PrototypeBanner() {
  return null;
}
