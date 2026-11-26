/**
 * Wall display — a dedicated layout for a wall-mounted tablet (landscape,
 * viewed from across a room). Large type, the essentials only, optional
 * quick controls, and automatic dimming at night.
 */
import { ArrowLeft, Moon } from 'lucide-react';
import { useState } from 'react';
import { EventIcon } from '@/components/domain/SecurityParts';
import { Stepper } from '@/components/controls';
import { cx, SampleTag } from '@/components/primitives';
import { StatusDot } from '@/components/Status';
import type { HomeSnapshot } from '@/data/types';
import { inTimeWindow, useNow } from '@/hooks';
import { ConnectionDot, connLabel, Mark } from '@/layout/AppShell';
import { formatDate, formatTemp, formatTime, relativeTime } from '@/lib/format';
import { deriveAlerts, lightingSummary, statusSentence } from '@/lib/selectors';
import { useHome, usePendingKey } from '@/store/home';
import { usePreferences } from '@/store/preferences';
import { SceneButton } from './Overview';

export function Wall({ s }: { s: HomeSnapshot }) {
  const prefs = usePreferences();
  const now = useNow(5_000);
  const [wake, setWake] = useState(0);
  const scheduledDim = prefs.wall.dimAtNight && inTimeWindow(now, prefs.wall.dimFrom, prefs.wall.dimUntil);
  const dimmed = scheduledDim && now - wake > 30_000;
  const status = statusSentence(s);
  const unit = prefs.tempUnit;
  const zone = s.climate[0]?.zones[0];
  const pool = s.pool?.bodies.find((b) => b.id === 'pool');
  const spa = s.pool?.bodies.find((b) => b.id === 'spa');
  const lights = lightingSummary(s);
  const lastEvent = [...s.security.events].sort((a, b) => b.at - a.at)[0];
  const alerts = deriveAlerts(s).filter((a) => a.severity === 'error');
  const stale = s.connection.status !== 'connected';

  return (
    <div
      data-dimmed={dimmed}
      onPointerDown={() => setWake(Date.now())}
      className="min-h-dvh bg-bg text-fg"
    >
      <div className="wall-content mx-auto flex min-h-dvh max-w-[1600px] flex-col px-6 py-6 lg:px-10 lg:py-8">
        <header className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Mark className="size-7" />
            <span className="flex items-center gap-2 text-body text-muted">
              <ConnectionDot status={s.connection.status} /> {connLabel(s.connection.status)}
            </span>
            {s.source.kind === 'sample' && <SampleTag>Prototype · sample data</SampleTag>}
          </div>
          <div className="flex items-center gap-5">
            {scheduledDim && (
              <span className="flex items-center gap-1.5 text-label text-muted">
                <Moon aria-hidden className="size-3.5" strokeWidth={1.5} /> Night mode
              </span>
            )}
            <a href="#/overview" className="flex items-center gap-1.5 rounded-xs text-label text-muted hover:text-fg">
              <ArrowLeft aria-hidden className="size-3.5" strokeWidth={1.5} /> Full dashboard
            </a>
          </div>
        </header>

        <section aria-label="Time and status" className="mt-10 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <div>
            <p className="num text-[7.5rem] leading-[0.9] font-extralight tracking-[-0.05em] xl:text-[9rem]">{formatTime(now, prefs.clock).replace(/\s?[AP]M$/i, '')}</p>
            <p className="mt-4 text-h2 font-light text-fg-2">{formatDate(now)}</p>
          </div>
          <p className={cx('flex items-center gap-3 text-h2 font-light', status.tone === 'ok' ? 'text-fg-2' : 'text-fg')}>
            <StatusDot status={status.tone === 'ok' ? 'online' : 'offline'} className="size-2.5" />
            {status.text}
          </p>
        </section>

        <section aria-label="Key readings" className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
          <WallMetric label="Indoor" value={formatTemp(zone?.currentTemp, unit)} sub={zone ? `${zone.action === 'heating' ? 'Heating' : zone.action === 'cooling' ? 'Cooling' : 'Holding'} · set ${formatTemp(zone.mode === 'cool' ? zone.coolSetpoint : zone.heatSetpoint, unit)}` : '—'} accent={zone?.action === 'heating'} stale={stale} />
          <WallMetric label="Pool" value={formatTemp(pool?.waterTemp, unit)} sub={pool?.heater.state === 'heating' ? 'Heating' : pool?.flow ? 'Filter running' : 'Idle'} accent={pool?.heater.state === 'heating'} stale={stale} />
          <WallMetric label="Spa" value={formatTemp(spa?.waterTemp, unit)} sub={spa?.heater.state === 'heating' ? `Heating to ${formatTemp(spa.heater.setpoint, unit)}` : spa?.heater.enabled ? 'Heater on · no flow' : 'Heater off'} accent={spa?.heater.state === 'heating'} stale={stale} />
          <WallMetric label="Outside" value={formatTemp(s.climate[0]?.outdoorTemp ?? null, unit)} sub="Thermostat sensor" stale={stale} />
        </section>

        <section aria-label="Summary" className="mt-auto grid grid-cols-1 gap-5 pt-5 lg:grid-cols-3 [&>div]:tile [&>div]:p-6">
          <div>
            <p className="caps text-muted">Lights</p>
            <p className="mt-2 text-h2 font-light">
              <span className="num">{lights.on}</span> <span className="text-muted">of {lights.total} on</span>
            </p>
          </div>
          <div>
            <p className="caps text-muted">Front door</p>
            <p className="mt-2 flex items-center gap-2 text-h2 font-light">
              {lastEvent ? (
                <>
                  <EventIcon kind={lastEvent.kind} className="size-5" />
                  {lastEvent.kind === 'ding' ? 'Doorbell' : 'Motion'}
                  <span className="text-muted">{relativeTime(lastEvent.at, now, prefs.clock)}</span>
                </>
              ) : (
                <span className="text-muted">No events</span>
              )}
            </p>
          </div>
          <div>
            <p className="caps text-muted">Alerts</p>
            <p className={cx('mt-2 text-h2 font-light', alerts.length ? 'text-danger' : 'text-muted')}>{alerts.length ? alerts[0]!.title : 'None'}</p>
            {alerts.length > 1 && <p className="text-body text-muted">+{alerts.length - 1} more</p>}
          </div>
        </section>

        {prefs.wall.showControls && (
          <section aria-label="Quick controls" className={cx('tile mt-5 flex flex-wrap items-center justify-between gap-6 p-5', dimmed && 'invisible')}>
            <div className="flex flex-wrap gap-2">
              {s.scenes.map((sc) => (
                <SceneButton key={sc.id} id={sc.id} name={sc.name} disabled={stale} />
              ))}
            </div>
            {zone && <WallThermostat s={s} />}
          </section>
        )}
      </div>
    </div>
  );
}

function WallMetric({ label, value, sub, accent, stale }: { label: string; value: string; sub: string; accent?: boolean; stale?: boolean }) {
  return (
    <div className="tile p-6">
      <p className="caps text-muted">{label}</p>
      <p className={cx('num mt-3 text-[4.5rem] leading-none font-extralight tracking-[-0.04em] xl:text-wall', stale ? 'text-muted' : accent ? 'text-accent-ink' : 'text-fg')}>{value}</p>
      <p className={cx('mt-3 text-lead', stale ? 'text-muted' : 'text-fg-2')}>{stale ? 'Last known' : sub}</p>
    </div>
  );
}

/** Compact one-tap thermostat for the wall (single setpoint for heat/cool modes). */
function WallThermostat({ s }: { s: HomeSnapshot }) {
  const run = useHome((st) => st.run);
  const config = useHome((st) => st.config)!;
  const unit = usePreferences((p) => p.tempUnit);
  const zone = s.climate[0]!.zones[0]!;
  const pending = usePendingKey(`climate:${zone.id}:setpoint`);
  if (zone.mode !== 'heat' && zone.mode !== 'cool') return null;
  const key = zone.mode === 'heat' ? 'heat' : 'cool';
  const value = zone.mode === 'heat' ? zone.heatSetpoint : zone.coolSetpoint;
  const { minF, maxF } = config.safety.thermostat;
  return (
    <div className="flex items-center gap-4">
      <span className="caps text-muted">{zone.mode === 'heat' ? 'Heat to' : 'Cool to'}</span>
      <Stepper
        size="md"
        tone={zone.mode === 'heat' ? 'heat' : 'cool'}
        label={`${key} setpoint`}
        value={value}
        display={formatTemp(value, unit)}
        disabled={!!pending || s.connection.status !== 'connected'}
        canDecrease={value - 1 >= minF}
        canIncrease={value + 1 <= maxF}
        onStep={(d) =>
          run(
            { type: 'climate.setSetpoints', zoneId: zone.id, [key]: value + d },
            { pending: 'Sending…', success: `Thermostat set to ${formatTemp(value + d, unit)}` },
          )
        }
      />
    </div>
  );
}
