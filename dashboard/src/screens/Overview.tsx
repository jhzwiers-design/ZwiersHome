/**
 * Overview — "What is happening in my home right now?"
 *
 *  1. Greeting, date/time, outside temperature and ONE status line.
 *  2. Temperatures: Main Floor, East Wing, Pool, Spa (each opens its section).
 *  3. Lighting (with one-tap scenes) and Security.
 *  4. Alerts, only when something needs attention.
 *
 * Which blocks appear comes from home.config + Settings → Overview sections.
 */
import { ArrowRight, Bath, BellRing, CircleCheck, CloudSun, Lightbulb, ShieldCheck, Thermometer, TriangleAlert, Waves } from 'lucide-react';
import { SceneButton } from '@/components/domain/Scenes';
import { EventIcon } from '@/components/domain/SecurityParts';
import { Metric, Section, TileLink } from '@/components/layout-parts';
import { Button, cx } from '@/components/primitives';
import { StatusDot } from '@/components/Status';
import type { HomeSnapshot } from '@/data/types';
import { useNow } from '@/hooks';
import { formatDate, formatTemp, formatTime, relativeTime } from '@/lib/format';
import { climateAreas, deriveAlerts, isStale, lightingSummary, lightsByArea, outdoorTemp, statusSentence } from '@/lib/selectors';
import { useHome, usePendingKey } from '@/store/home';
import { usePreferences } from '@/store/preferences';

export function Overview({ s }: { s: HomeSnapshot }) {
  const config = useHome((st) => st.config)!;
  const hidden = usePreferences((p) => p.hiddenModules);
  const show = (m: (typeof config.overview.modules)[number]) => config.overview.modules.includes(m) && !hidden.includes(m);
  const alerts = deriveAlerts(s);

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <Greeting s={s} />
      <Temperatures s={s} showClimate={show('climate')} showPool={show('pool')} />
      <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-12">
        {show('lighting') && (
          <div className="flex min-w-0 lg:col-span-7 [&>*]:flex-1">
            <LightingSummary s={s} />
          </div>
        )}
        {show('security') && (
          <div className="flex min-w-0 lg:col-span-5 [&>*]:flex-1">
            <SecuritySummary s={s} />
          </div>
        )}
        {show('alerts') && alerts.length > 0 && (
          <div className="lg:col-span-12">
            <AlertsSummary s={s} />
          </div>
        )}
      </div>
    </div>
  );
}

function Greeting({ s }: { s: HomeSnapshot }) {
  const clock = usePreferences((p) => p.clock);
  const unit = usePreferences((p) => p.tempUnit);
  const now = useNow(10_000);
  const status = statusSentence(s);
  const outside = outdoorTemp(s);
  const h = new Date(now).getHours();
  const greeting = h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const ok = status.tone === 'ok';
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3 pb-1">
      <div>
        <p className="flex flex-wrap items-center gap-x-2 text-body text-muted md:text-lead">
          <span>{formatDate(now)}</span>
          <span aria-hidden>·</span>
          <span className="num">{formatTime(now, clock)}</span>
          {outside !== null && (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <CloudSun aria-hidden className="size-4" strokeWidth={1.7} />
                <span className="num">{formatTemp(outside, unit)}</span> outside
              </span>
            </>
          )}
        </p>
        <h1 className="mt-1 text-[2rem] leading-tight font-semibold tracking-[-0.03em] text-fg md:text-h1">{greeting}</h1>
      </div>
      <a
        href="#/devices"
        className={cx(
          'inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-body transition-colors',
          ok ? 'border-positive/30 bg-positive-soft text-fg' : 'border-danger/40 bg-danger-soft text-fg hover:border-danger',
        )}
      >
        {ok ? <CircleCheck aria-hidden className="size-4 text-positive" strokeWidth={2} /> : <TriangleAlert aria-hidden className="size-4 text-danger" strokeWidth={2} />}
        <span className="max-sm:hidden">{status.text}</span>
        <span className="sm:hidden">{status.short}</span>
        {!ok && <ArrowRight aria-hidden className="size-3.5 text-muted" strokeWidth={1.75} />}
      </a>
    </header>
  );
}

function Temperatures({ s, showClimate, showPool }: { s: HomeSnapshot; showClimate: boolean; showPool: boolean }) {
  const unit = usePreferences((p) => p.tempUnit);
  const clock = usePreferences((p) => p.clock);
  const now = useNow(15_000);
  const connected = s.connection.status === 'connected';
  const areas = showClimate ? climateAreas(s) : [];
  const pool = showPool ? s.pool?.bodies.find((b) => b.id === 'pool') : undefined;
  const spa = showPool ? s.pool?.bodies.find((b) => b.id === 'spa') : undefined;
  const asOf = (t?: number) => (t ? `Last known · ${formatTime(t, clock)}` : undefined);
  const count = areas.length + (pool ? 1 : 0) + (spa ? 1 : 0);
  if (count === 0) return null;

  return (
    <section aria-label="Temperatures" className={cx('grid grid-cols-2 gap-3 md:gap-5', count >= 4 ? 'lg:grid-cols-4' : count === 3 ? 'lg:grid-cols-3' : '')}>
      {areas.map(({ zone, label }) => {
        const target = zone.mode === 'cool' ? zone.coolSetpoint : zone.heatSetpoint;
        const line =
          zone.action === 'heating'
            ? `Heating to ${formatTemp(target, unit)}`
            : zone.action === 'cooling'
              ? `Cooling to ${formatTemp(target, unit)}`
              : zone.mode === 'off'
                ? 'System off'
                : `Holding ${formatTemp(target, unit)}`;
        return (
          <Metric
            key={zone.id}
            href="#/climate"
            system="climate"
            icon={Thermometer}
            label={label}
            value={formatTemp(zone.currentTemp, unit)}
            tone={zone.action === 'heating' ? 'accent' : zone.action === 'cooling' ? 'cool' : 'neutral'}
            sub={line}
            stale={isStale(zone.lastUpdated, 600, now, connected)}
            staleText={asOf(zone.lastUpdated)}
          />
        );
      })}
      {pool && (
        <Metric
          href="#/pool"
          system="pool"
          icon={Waves}
          label="Pool"
          value={formatTemp(pool.waterTemp, unit)}
          sub={pool.heater.state === 'heating' ? `Heating to ${formatTemp(pool.heater.setpoint, unit)}` : pool.flow ? 'Filter running' : 'Not circulating'}
          stale={isStale(pool.lastUpdated, 120, now, connected)}
          staleText={asOf(pool.lastUpdated)}
        />
      )}
      {spa && (
        <Metric
          href="#/pool"
          system="spa"
          icon={Bath}
          label="Spa"
          value={formatTemp(spa.waterTemp, unit)}
          sub={spa.heater.state === 'heating' ? `Heating to ${formatTemp(spa.heater.setpoint, unit)}` : spa.heater.enabled ? 'Heater on · needs spa mode' : 'Heater off'}
          stale={isStale(spa.lastUpdated, 120, now, connected)}
          staleText={asOf(spa.lastUpdated)}
        />
      )}
    </section>
  );
}

function LightingSummary({ s }: { s: HomeSnapshot }) {
  const config = useHome((st) => st.config)!;
  const run = useHome((st) => st.run);
  const allPending = usePendingKey('lights:all');
  const sum = lightingSummary(s);
  const groups = lightsByArea(s, config.areaOrder);
  const litRooms = groups.filter((g) => g.lights.some((l) => l.on));
  const scenes = config.overview.quickScenes.length ? s.scenes.filter((x) => config.overview.quickScenes.includes(x.id)) : s.scenes;
  const disabled = s.connection.status !== 'connected';

  return (
    <Section tone="lighting" title="Lighting" subtitle={sum.on ? `${litRooms.length} ${litRooms.length === 1 ? 'room' : 'rooms'} lit` : 'All lights off'} icon={Lightbulb} iconActive={sum.on > 0} meta={<TileLink href="#/lighting" label="Open lighting" />}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-h2 font-semibold tracking-[-0.02em] text-fg">
          <span className="num">{sum.on}</span> <span className="font-normal text-muted">of {sum.total} lights on</span>
        </p>
        {sum.unreachable > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-soft px-3 py-1 text-label text-danger">
            <TriangleAlert aria-hidden className="size-3.5" strokeWidth={2} /> {sum.unreachable} not responding
          </span>
        )}
      </div>
      {litRooms.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Rooms with lights on">
          {litRooms.map(({ area, lights }) => (
            <li key={area.id} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--chip-bg)] px-3 py-1 text-label text-fg">
              <span aria-hidden className="size-1.5 rounded-full bg-[var(--tone-fill)]" />
              {area.name}
              <span className="num text-muted">
                {lights.filter((l) => l.on).length}/{lights.length}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto pt-5">
        <p className="mb-2 text-label text-muted">Scenes</p>
        <div className="rail sm:flex sm:flex-wrap sm:gap-2">
          {scenes.map((sc) => (
            <SceneButton key={sc.id} scene={sc} disabled={disabled} />
          ))}
        </div>
        {scenes.every((sc) => sc.id !== 'scene-all-off') && (
          <Button size="sm" variant="quiet" className="mt-2" pending={!!allPending} disabled={disabled || sum.on === 0} onClick={() => run({ type: 'lights.allOff' }, { pending: 'Turning all off…', success: 'All lights off' })}>
            All off
          </Button>
        )}
      </div>
    </Section>
  );
}

function SecuritySummary({ s }: { s: HomeSnapshot }) {
  const clock = usePreferences((p) => p.clock);
  const now = useNow(30_000);
  const cam = s.security.cameras[0];
  if (!cam) return null;
  const dev = s.devices.find((d) => d.id === cam.deviceId);
  const events = [...s.security.events].sort((a, b) => b.at - a.at);
  const lastDing = events.find((e) => e.kind === 'ding');
  const lastMotion = events.find((e) => e.kind === 'motion');
  const online = dev?.availability === 'online';
  const today = events.filter((e) => now - e.at < 86_400_000).length;

  return (
    <Section tone="security" title="Security" subtitle={`${cam.name} ${online ? 'online' : 'not responding'}`} icon={ShieldCheck} meta={<TileLink href="#/security" label="Open security" />}>
      <div className="flex flex-col gap-2">
        {[
          { k: 'Doorbell', e: lastDing, icon: BellRing },
          { k: 'Motion', e: lastMotion, icon: undefined },
        ].map(({ k, e }) => (
          <div key={k} className="flex min-h-12 items-center gap-3 rounded-[14px] bg-surface-2 px-3.5">
            {e ? <EventIcon kind={e.kind} /> : <StatusDot status="off" />}
            <span className="flex-1 text-body text-fg-2">{k}</span>
            <span className="num text-body font-medium text-fg">{e ? relativeTime(e.at, now, clock) : 'None today'}</span>
          </div>
        ))}
      </div>
      <p className="mt-auto flex items-center justify-between gap-2 pt-4 text-label text-muted">
        <span>{today} events in the last 24 hours</span>
        <span className="inline-flex items-center gap-1.5">
          <StatusDot status={online ? 'online' : 'offline'} />
          {online ? 'Doorbell online' : 'Doorbell offline'}
        </span>
      </p>
    </Section>
  );
}

function AlertsSummary({ s }: { s: HomeSnapshot }) {
  const clock = usePreferences((p) => p.clock);
  const now = useNow(30_000);
  const alerts = deriveAlerts(s);
  return (
    <Section title="Needs attention" icon={TriangleAlert} meta={<span className="num rounded-full bg-danger-soft px-3 py-1 text-danger">{alerts.length}</span>}>
      <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {alerts.map((a) => (
          <li key={a.id}>
            <a href={a.route} className="group flex min-h-14 items-center gap-3 rounded-[14px] border border-rule bg-surface-2 px-4 py-3 transition-colors hover:border-rule-strong">
              <TriangleAlert aria-hidden className={cx('size-4 shrink-0', a.severity === 'error' ? 'text-danger' : 'text-muted')} strokeWidth={2} />
              <span className="min-w-0 flex-1">
                <span className="block text-body font-medium text-fg">{a.title}</span>
                <span className="block truncate text-label text-muted">
                  {a.detail}
                  {a.since && ` · since ${relativeTime(a.since, now, clock)}`}
                </span>
              </span>
              <ArrowRight aria-hidden className="size-4 text-muted transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} />
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}
