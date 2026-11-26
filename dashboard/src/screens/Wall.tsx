/**
 * Wall display — the kitchen iPad (11" iPad Air, landscape first, portrait OK).
 *
 * WallHome is the ambient Home display: readable from across the room, useful
 * without touching it, and it NEVER scrolls. Every size is tied to the screen
 * height (dvh/vmin) so the same layout fits Safari (with its toolbar) and the
 * installed full-screen app.
 *
 *   ┌ brand ············ connection · prototype · theme ┐
 *   │  9:41                │  West Wing  │ East Wing     │
 *   │  Wednesday, 25 Nov   │  Pool       │ Spa           │
 *   │  status · outside    │  Lighting   │ Security      │
 *   │  alerts              │                             │
 *   └──────────── dock: Home · Lights · Climate · Pool · Security ┘
 *
 * Calm (ambient) presentation lowers colour and contrast of everything except
 * alerts. It can be always on, or start after inactivity (Settings).
 */
import { Bath, BellRing, Settings2, CircleCheck, CloudSun, Lightbulb, Moon, ShieldCheck, Thermometer, TriangleAlert, Waves, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { create } from 'zustand';
import { SceneButton } from '@/components/domain/Scenes';
import { EventIcon } from '@/components/domain/SecurityParts';
import { cx } from '@/components/primitives';
import { StatusDot } from '@/components/Status';
import type { HomeSnapshot } from '@/data/types';
import { inTimeWindow, useNow } from '@/hooks';
import { ConnectionDot, connLabel, Mark, ThemeSwitch } from '@/layout/AppShell';
import { WallDock } from '@/layout/WallDock';
import { formatDate, formatTemp, formatTime, relativeTime } from '@/lib/format';
import { climateAreas, deriveAlerts, isStale, lightingSummary, lightsByArea, outdoorTemp, statusSentence } from '@/lib/selectors';
import { useHome } from '@/store/home';
import { usePreferences } from '@/store/preferences';

/** Calm presentation triggered by inactivity (cleared on the next touch). */
export const useWallCalm = create<{ calm: boolean; setCalm: (v: boolean) => void }>((set) => ({
  calm: false,
  setCalm: (calm) => set({ calm }),
}));

const QUICK_SCENES = ['scene-arrive', 'scene-evening', 'scene-goodnight'];

export function Wall({ s }: { s: HomeSnapshot }) {
  const prefs = usePreferences();
  const config = useHome((st) => st.config)!;
  const now = useNow(5_000);
  const idleCalm = useWallCalm((w) => w.calm);
  const setCalm = useWallCalm((w) => w.setCalm);
  const calm = prefs.wall.ambient === 'always' || (prefs.wall.ambient === 'idle' && idleCalm);
  const night = prefs.wall.dimAtNight && inTimeWindow(now, prefs.wall.dimFrom, prefs.wall.dimUntil);
  const status = statusSentence(s);
  const alerts = deriveAlerts(s).filter((a) => a.severity === 'error');
  const unit = prefs.tempUnit;
  const connected = s.connection.status === 'connected';
  const areas = climateAreas(s);
  const pool = s.pool?.bodies.find((b) => b.id === 'pool');
  const spa = s.pool?.bodies.find((b) => b.id === 'spa');
  const outside = outdoorTemp(s);
  const lights = lightingSummary(s);
  const litRooms = lightsByArea(s, config.areaOrder).filter((g) => g.lights.some((l) => l.on));
  const scenes = s.scenes.filter((sc) => QUICK_SCENES.includes(sc.id));
  const cam = s.security.cameras[0];
  const camDev = cam ? s.devices.find((d) => d.id === cam.deviceId) : undefined;
  const events = [...s.security.events].sort((a, b) => b.at - a.at);
  const lastDing = events.find((e) => e.kind === 'ding');
  const lastMotion = events.find((e) => e.kind === 'motion');
  const time = formatTime(now, prefs.clock);
  const [hhmm, ampm] = prefs.clock === '12h' ? [time.replace(/\s?[AP]M$/i, ''), time.match(/[AP]M$/i)?.[0] ?? ''] : [time, ''];

  return (
    <WallFrame calm={calm} night={night} onWake={idleCalm ? () => setCalm(false) : undefined} s={s}>
      <div className="wall-grid min-h-0 flex-1">
        {/* ── Hero: time, date, status, alerts ── */}
        <section aria-label="Time and status" className="wall-hero flex min-h-0 flex-col">
          <p className="num leading-[0.85] font-extralight tracking-[-0.05em] text-fg" style={{ fontSize: 'clamp(3.5rem, 13.5vmin, 9rem)' }}>
            {hhmm}
            {ampm && <span className="ml-2 align-top text-[0.28em] font-normal tracking-normal text-muted">{ampm}</span>}
          </p>
          <p className="mt-[1.2vmin] text-fg-2" style={{ fontSize: 'clamp(1rem, 2.6vmin, 1.6rem)' }}>
            {formatDate(now)}
            {outside !== null && (
              <span className="ml-3 inline-flex items-center gap-1.5 text-muted">
                <CloudSun aria-hidden className="size-[1em]" strokeWidth={1.6} />
                <span className="num">{formatTemp(outside, unit)}</span>
              </span>
            )}
          </p>
          <p
            className={cx(
              'mt-[2.2vmin] inline-flex w-fit items-center gap-2 rounded-full px-4 py-2',
              status.tone === 'ok' ? 'bg-positive-soft text-fg' : 'bg-danger-soft text-fg',
            )}
            style={{ fontSize: 'clamp(0.95rem, 2.1vmin, 1.25rem)' }}
          >
            {status.tone === 'ok' ? <CircleCheck aria-hidden className="size-[1.1em] text-positive" strokeWidth={2} /> : <TriangleAlert aria-hidden className="size-[1.1em] text-danger" strokeWidth={2} />}
            {status.tone === 'ok' ? 'All is well at home' : status.short}
          </p>

          {/* Alerts stay at full strength, even in calm mode */}
          {alerts.length > 0 && (
            <ul className="wall-alerts mt-[2.2vmin] flex min-h-0 flex-col gap-2 overflow-hidden" aria-label="Needs attention">
              {alerts.slice(0, 2).map((a) => (
                <li key={a.id}>
                  <a href={a.route} className="flex items-center gap-3 rounded-[18px] border border-danger/35 bg-danger-soft px-4 py-3">
                    <TriangleAlert aria-hidden className="size-5 shrink-0 text-danger" strokeWidth={2} />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-fg" style={{ fontSize: 'clamp(0.95rem, 2vmin, 1.15rem)' }}>
                        {a.title}
                      </span>
                      <span className="block truncate text-label text-muted">{a.detail}</span>
                    </span>
                  </a>
                </li>
              ))}
              {alerts.length > 2 && <li className="px-2 text-label text-muted">+{alerts.length - 2} more on the Devices screen</li>}
            </ul>
          )}
          {night && (
            <p className="mt-auto inline-flex items-center gap-1.5 pt-3 text-label text-muted">
              <Moon aria-hidden className="size-3.5" strokeWidth={1.6} /> Night mode until {clockLabel(prefs.wall.dimUntil, prefs.clock)}
            </p>
          )}
        </section>

        {/* ── Temperatures ── */}
        <section aria-label="Temperatures" className="wall-temps grid min-h-0 grid-cols-2 gap-[1.6vmin]">
          {areas.slice(0, 2).map(({ zone, label }) => {
            const target = zone.mode === 'cool' ? zone.coolSetpoint : zone.heatSetpoint;
            return (
              <WallTile
                key={zone.id}
                href="#/climate"
                tone="climate"
                icon={Thermometer}
                label={label}
                value={formatTemp(zone.currentTemp, unit)}
                active={zone.action === 'heating' || zone.action === 'cooling'}
                stale={!connected || isStale(zone.lastUpdated, 600, now, connected)}
                sub={zone.action === 'heating' ? `Heating to ${formatTemp(target, unit)}` : zone.action === 'cooling' ? `Cooling to ${formatTemp(target, unit)}` : `Set to ${formatTemp(target, unit)}`}
              />
            );
          })}
          {pool && (
            <WallTile
              href="#/pool"
              tone="pool"
              icon={Waves}
              label="Pool"
              value={formatTemp(pool.waterTemp, unit)}
              active={pool.heater.state === 'heating'}
              stale={!connected}
              sub={pool.heater.state === 'heating' ? `Heating to ${formatTemp(pool.heater.setpoint, unit)}` : pool.flow ? 'Filter running' : 'Not circulating'}
            />
          )}
          {spa && (
            <WallTile
              href="#/pool"
              tone="spa"
              icon={Bath}
              label="Spa"
              value={formatTemp(spa.waterTemp, unit)}
              active={spa.heater.state === 'heating'}
              stale={!connected}
              sub={spa.heater.state === 'heating' ? `Heating to ${formatTemp(spa.heater.setpoint, unit)}` : spa.heater.enabled ? 'Heater on · needs spa mode' : 'Heater off'}
            />
          )}
        </section>

        {/* ── Lighting + Security ── */}
        <section aria-label="Lights and security" className="wall-info grid min-h-0 grid-cols-2 gap-[1.6vmin]">
          <a href="#/lighting" data-tone="lighting" className="wall-surface lift flex min-h-0 flex-col overflow-hidden rounded-[22px] p-[2.2vmin]">
            <span className="flex items-center gap-2 text-muted" style={{ fontSize: 'clamp(0.85rem, 1.8vmin, 1.05rem)' }}>
              <Lightbulb aria-hidden className="size-[1.1em] text-[var(--tone-ink)]" strokeWidth={1.8} /> Lights
            </span>
            <span className="mt-[0.8vmin] font-semibold tracking-tight text-fg" style={{ fontSize: 'clamp(1.4rem, 3.6vmin, 2.25rem)' }}>
              <span className="num">{lights.on}</span> <span className="font-normal text-muted">of {lights.total} on</span>
            </span>
            <span className="mt-1 truncate text-muted" style={{ fontSize: 'clamp(0.8rem, 1.7vmin, 1rem)' }}>
              {litRooms.length ? litRooms.map((r) => r.area.name).join(', ') : 'Everything is off'}
            </span>
          </a>
          <a href="#/security" data-tone="security" className="wall-surface lift flex min-h-0 flex-col overflow-hidden rounded-[22px] p-[2.2vmin]">
            <span className="flex items-center gap-2 text-muted" style={{ fontSize: 'clamp(0.85rem, 1.8vmin, 1.05rem)' }}>
              <ShieldCheck aria-hidden className="size-[1.1em] text-[var(--tone-ink)]" strokeWidth={1.8} /> Front door
            </span>
            <span className="mt-[0.8vmin] flex items-center gap-2 font-semibold tracking-tight text-fg" style={{ fontSize: 'clamp(1.2rem, 3vmin, 1.9rem)' }}>
              {lastDing ? (
                <>
                  <BellRing aria-hidden className="size-[0.9em] text-[var(--tone-ink)]" strokeWidth={1.8} /> {relativeTime(lastDing.at, now, prefs.clock)}
                </>
              ) : (
                'Quiet'
              )}
            </span>
            <span className="mt-1 flex items-center gap-1.5 truncate text-muted" style={{ fontSize: 'clamp(0.8rem, 1.7vmin, 1rem)' }}>
              {lastMotion && <EventIcon kind="motion" className="size-[1em]" />}
              {lastMotion ? `Motion ${relativeTime(lastMotion.at, now, prefs.clock)}` : 'No motion'}
              <span aria-hidden>·</span>
              <StatusDot status={camDev?.availability === 'online' ? 'online' : 'offline'} />
              {camDev?.availability === 'online' ? 'Doorbell online' : 'Doorbell offline'}
            </span>
          </a>
        </section>

        {/* ── Quick scenes (hidden in calm mode and when switched off) ── */}
        {prefs.wall.showControls && !calm && (
          <section aria-label="Quick scenes" className="wall-scenes flex min-h-0 gap-[1.2vmin]">
            {scenes.map((sc) => (
              <div key={sc.id} className="min-w-0 flex-1 [&>button]:w-full">
                <SceneButton scene={sc} disabled={!connected} />
              </div>
            ))}
          </section>
        )}
      </div>
    </WallFrame>
  );
}

function WallTile({
  href,
  tone,
  icon: Icon,
  label,
  value,
  sub,
  active,
  stale,
}: {
  href: string;
  tone: string;
  icon: LucideIcon;
  label: string;
  value: string;
  sub: string;
  active?: boolean;
  stale?: boolean;
}) {
  return (
    <a href={href} data-tone={tone} className="wall-surface lift flex min-h-0 flex-col justify-between overflow-hidden rounded-[22px] p-[2.2vmin]">
      <span className="flex items-center justify-between gap-2 text-fg-2" style={{ fontSize: 'clamp(0.9rem, 2vmin, 1.15rem)' }}>
        <span className="truncate font-medium">{label}</span>
        <Icon aria-hidden className={cx('size-[1.2em] shrink-0', active ? 'text-[var(--tone-ink)]' : 'text-muted')} strokeWidth={1.8} />
      </span>
      <span className={cx('num leading-none font-light tracking-[-0.04em]', stale ? 'text-muted' : active ? 'text-[var(--tone-ink)]' : 'text-fg')} style={{ fontSize: 'clamp(2.5rem, 9vmin, 5.25rem)' }}>
        {value}
      </span>
      <span className={cx('truncate', stale ? 'text-muted italic' : 'text-muted')} style={{ fontSize: 'clamp(0.8rem, 1.8vmin, 1.05rem)' }}>
        {stale ? 'Last known' : sub}
      </span>
    </a>
  );
}

/** Full-screen frame shared by the Home display and wall-mode screens. */
export function WallFrame({ s, calm, night, onWake, children }: { s: HomeSnapshot; calm?: boolean; night?: boolean; onWake?: () => void; children: ReactNode }) {
  const isSample = s.source.kind === 'sample';
  return (
    <div
      data-wall=""
      data-ambient={calm ? 'calm' : undefined}
      data-dimmed={night || undefined}
      className="relative flex h-dvh w-full flex-col overflow-hidden bg-bg text-fg"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 1.6vmin)',
        paddingRight: 'max(env(safe-area-inset-right), 2.4vmin)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 1.4vmin)',
        paddingLeft: 'max(env(safe-area-inset-left), 2.4vmin)',
      }}
    >
      <header className="wall-content flex shrink-0 items-center justify-between gap-4 pb-[1.6vmin]">
        <span className="flex items-center gap-2.5">
          <Mark className="size-8" />
          <span className="text-body font-semibold text-fg">Zwiers Home</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-label text-fg-2">
            <ConnectionDot status={s.connection.status} /> {s.connection.status === 'connected' ? 'Live' : `${connLabel(s.connection.status)} · last known`}
          </span>
          {isSample && (
            <span role="note" className="rounded-full border border-dashed border-control px-3 py-1 text-micro font-semibold tracking-[0.08em] text-fg-2 uppercase">
              Prototype · sample data
            </span>
          )}
          <ThemeSwitch />
          <a href="#/settings" aria-label="Settings" className="grid size-11 place-items-center rounded-full text-muted transition-colors hover:bg-surface hover:text-fg">
            <Settings2 aria-hidden className="size-5" strokeWidth={1.7} />
          </a>
        </span>
      </header>

      <main id="main" className="wall-content flex min-h-0 flex-1 flex-col">
        {children}
      </main>

      <div className="wall-content shrink-0 pt-[1.4vmin]">
        <WallDock />
      </div>

      {/* First touch after the calm screen only wakes it (never presses a button). */}
      {onWake && (
        <button type="button" aria-label="Wake the display" className="absolute inset-0 z-20 cursor-default bg-transparent" onPointerDown={(e) => { e.preventDefault(); onWake(); }} onClick={onWake} />
      )}
    </div>
  );
}

/** "06:30" → "6:30 AM" (12-hour clock) or "06:30". */
function clockLabel(hhmm: string, clock: '12h' | '24h') {
  if (clock === '24h') return hhmm;
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}
