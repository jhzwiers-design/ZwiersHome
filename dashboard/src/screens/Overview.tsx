/**
 * Overview — a tiled summary of the home.
 *  1. Greeting: date, time and a one-sentence status
 *  2. Four reading tiles (Indoor, Pool, Spa, Outside)
 *  3. Module tiles (security, climate, lighting, pool, alerts), order from
 *     home.config + user preferences, laid out on a 12-column grid.
 */
import { AlertTriangle, ArrowRight, Bath, CloudSun, Lightbulb, ShieldCheck, Thermometer, Waves, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { CameraView, EventIcon } from '@/components/domain/SecurityParts';
import { ThermostatControl } from '@/components/domain/ThermostatControl';
import { Metric, Section, TileLink } from '@/components/layout-parts';
import { Button, cx } from '@/components/primitives';
import { StatusDot } from '@/components/Status';
import type { OverviewModule } from '@/config/schema';
import type { HomeSnapshot } from '@/data/types';
import { useNow } from '@/hooks';
import { capitalize, formatDate, formatTemp, formatTime, relativeTime } from '@/lib/format';
import { deriveAlerts, isStale, lightingSummary, lightsByArea, statusSentence } from '@/lib/selectors';
import { useHome, usePendingKey } from '@/store/home';
import { usePreferences } from '@/store/preferences';

/** Column span of each module on the 12-column desktop grid. */
const SPAN: Record<OverviewModule, string> = {
  security: 'lg:col-span-7',
  climate: 'lg:col-span-5',
  lighting: 'lg:col-span-7',
  pool: 'lg:col-span-5',
  alerts: 'lg:col-span-12',
};

export function Overview({ s }: { s: HomeSnapshot }) {
  const config = useHome((st) => st.config)!;
  const hidden = usePreferences((p) => p.hiddenModules);
  const modules = config.overview.modules.filter((m) => !hidden.includes(m));

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <Greeting s={s} />
      <KeyMetrics s={s} />
      <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-12">
        {modules.map((m) => (
          <div key={m} className={cx('flex min-w-0 [&>*]:flex-1', SPAN[m])}>
            {MODULES[m](s)}
          </div>
        ))}
      </div>
    </div>
  );
}

const MODULES: Record<OverviewModule, (s: HomeSnapshot) => ReactNode> = {
  climate: (s) => <ClimateModule s={s} />,
  pool: (s) => <PoolModule s={s} />,
  lighting: (s) => <LightingModule s={s} />,
  security: (s) => <SecurityModule s={s} />,
  alerts: (s) => <AlertsModule s={s} />,
};

function Greeting({ s }: { s: HomeSnapshot }) {
  const clock = usePreferences((p) => p.clock);
  const now = useNow(10_000);
  const status = statusSentence(s);
  const h = new Date(now).getHours();
  const greeting = h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3 pb-1">
      <div>
        <p className="text-lead text-muted">
          {formatDate(now)} · <span className="num">{formatTime(now, clock)}</span>
        </p>
        <h1 className="mt-1 text-h1 font-medium tracking-[-0.03em] text-fg">{greeting}</h1>
      </div>
      <a
        href="#/devices"
        className={cx(
          'inline-flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-body transition-colors',
          status.tone === 'ok' ? 'border-rule bg-surface text-fg-2 hover:border-rule-strong' : 'border-danger/40 bg-danger-soft text-fg hover:border-danger',
        )}
      >
        {status.tone === 'ok' ? <StatusDot status="online" /> : <AlertTriangle aria-hidden className="size-4 text-danger" strokeWidth={1.75} />}
        {status.text}
        {status.tone !== 'ok' && <ArrowRight aria-hidden className="size-3.5 text-muted" strokeWidth={1.75} />}
      </a>
    </header>
  );
}

function KeyMetrics({ s }: { s: HomeSnapshot }) {
  const unit = usePreferences((p) => p.tempUnit);
  const now = useNow(15_000);
  const clock = usePreferences((p) => p.clock);
  const connected = s.connection.status === 'connected';
  const sys = s.climate[0];
  const zone = sys?.zones[0];
  const pool = s.pool?.bodies.find((b) => b.id === 'pool');
  const spa = s.pool?.bodies.find((b) => b.id === 'spa');
  const staleZone = zone ? isStale(zone.lastUpdated, 600, now, connected) : true;
  const stalePool = pool ? isStale(pool.lastUpdated, 120, now, connected) : true;
  const asOf = (t?: number) => (t ? `As of ${formatTime(t, clock)}` : undefined);

  return (
    <section aria-label="Key readings" className="grid grid-cols-2 gap-4 md:gap-5 lg:grid-cols-4">
      {zone && (
        <Metric
          href="#/climate"
          system="climate"
          icon={Thermometer}
          label="Indoor"
          value={formatTemp(zone.currentTemp, unit)}
          tone={zone.action === 'heating' ? 'accent' : zone.action === 'cooling' ? 'cool' : 'neutral'}
          sub={climateLine(zone.action, zone.mode === 'cool' ? zone.coolSetpoint : zone.heatSetpoint, unit)}
          stale={staleZone}
          staleText={asOf(zone.lastUpdated)}
        />
      )}
      {pool && (
        <Metric
          href="#/pool"
          system="pool"
          icon={Waves}
          label="Pool"
          value={formatTemp(pool.waterTemp, unit)}
          tone={pool.heater.state === 'heating' ? 'accent' : 'neutral'}
          sub={pool.heater.state === 'heating' ? `Heating to ${formatTemp(pool.heater.setpoint, unit)}` : pool.flow ? 'Filter running' : 'Circulation off'}
          stale={stalePool}
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
          tone={spa.heater.state === 'heating' ? 'accent' : 'neutral'}
          sub={spa.heater.state === 'heating' ? `Heating to ${formatTemp(spa.heater.setpoint, unit)}` : spa.heater.enabled ? 'Heater on · waiting for flow' : 'Heater off'}
          stale={stalePool}
          staleText={asOf(spa.lastUpdated)}
        />
      )}
      <Metric
        system="devices"
        icon={CloudSun}
        label="Outside"
        value={formatTemp(sys?.outdoorTemp ?? s.pool?.airTemp ?? null, unit)}
        sub="Thermostat sensor"
        stale={!connected}
        staleText={connected ? undefined : 'Last known'}
      />
    </section>
  );
}

function climateLine(action: string, setpoint: number, unit: 'F' | 'C') {
  if (action === 'heating') return `Heating to ${formatTemp(setpoint, unit)}`;
  if (action === 'cooling') return `Cooling to ${formatTemp(setpoint, unit)}`;
  if (action === 'fan') return 'Fan only';
  if (action === 'off') return 'System off';
  return `Holding ${formatTemp(setpoint, unit)}`;
}

function LightingModule({ s }: { s: HomeSnapshot }) {
  const config = useHome((st) => st.config)!;
  const run = useHome((st) => st.run);
  const allPending = usePendingKey('lights:all');
  const sum = lightingSummary(s);
  const groups = lightsByArea(s, config.areaOrder);
  const scenes = config.overview.quickScenes.length ? s.scenes.filter((x) => config.overview.quickScenes.includes(x.id)) : s.scenes;
  const disabled = s.connection.status !== 'connected';
  const pct = sum.total ? Math.round((sum.on / sum.total) * 100) : 0;

  return (
    <Section tone="lighting" band title="Lighting" subtitle={`${groups.length} rooms`} icon={Lightbulb} iconActive={sum.on > 0} meta={<TileLink href="#/lighting" label="Open lighting" />}>
      <div className="flex items-end justify-between gap-4">
        <p className="text-h1 font-light tracking-[-0.03em] text-fg">
          <span className="num">{sum.on}</span> <span className="text-h2 text-muted">of {sum.total} on</span>
        </p>
        {sum.unreachable > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-soft px-3 py-1 text-label text-danger">
            <AlertTriangle aria-hidden className="size-3.5" strokeWidth={1.75} /> {sum.unreachable} unreachable
          </span>
        )}
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
        <div className="h-full rounded-full bg-accent shadow-[0_0_10px_var(--accent)] transition-all" style={{ width: `${pct}%` }} />
      </div>
      <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {groups.map(({ area, lights }) => {
          const on = lights.filter((l) => l.on).length;
          return (
            <li
              key={area.id}
              className={cx(
                'flex items-center justify-between gap-2 rounded-sm border px-3 py-2.5',
                on ? 'border-accent/30 bg-accent-soft' : 'border-rule bg-surface-2',
              )}
            >
              <span className="truncate text-body text-fg-2">{area.name}</span>
              <span className={cx('num text-label font-medium', on ? 'text-accent-ink' : 'text-muted')}>
                {on}/{lights.length}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        {scenes.map((sc) => (
          <SceneButton key={sc.id} id={sc.id} name={sc.name} disabled={disabled} />
        ))}
        <Button
          size="sm"
          variant="quiet"
          pending={!!allPending}
          disabled={disabled || sum.on === 0}
          onClick={() => run({ type: 'lights.allOff' }, { pending: 'Turning all off…', success: 'All lights off' })}
        >
          All off
        </Button>
      </div>
    </Section>
  );
}

export function SceneButton({ id, name, disabled }: { id: string; name: string; disabled?: boolean }) {
  const run = useHome((st) => st.run);
  const pending = usePendingKey(`scene:${id}`);
  return (
    <Button
      size="sm"
      variant="primary"
      pending={!!pending}
      disabled={disabled}
      onClick={() => run({ type: 'scene.activate', sceneId: id }, { pending: 'Activating…', success: `${name} scene set` })}
    >
      {name}
    </Button>
  );
}

function ClimateModule({ s }: { s: HomeSnapshot }) {
  const unit = usePreferences((p) => p.tempUnit);
  const sys = s.climate[0];
  const zone = sys?.zones[0];
  if (!sys || !zone) return null;
  const heating = zone.action === 'heating';
  return (
    <Section
      tone="climate"
      band
      title="Climate"
      subtitle={zone.name}
      icon={Thermometer}
      iconActive={heating}
      meta={<TileLink href="#/climate" label="Open climate" />}
    >
      <div className="flex flex-1 flex-col justify-center">
        <ThermostatControl zone={zone} variant="dial" size="md" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { k: 'Mode', v: zone.mode === 'fan_only' ? 'Fan' : capitalize(zone.mode) },
          { k: 'Humidity', v: `${zone.humidity ?? '—'}%` },
          { k: 'Outside', v: formatTemp(sys.outdoorTemp, unit) },
        ].map((it) => (
          <div key={it.k} className="rounded-sm bg-surface-2 px-3 py-2.5 text-center">
            <p className="text-micro text-muted uppercase tracking-[0.08em]">{it.k}</p>
            <p className="num mt-0.5 text-body font-medium text-fg">{it.v}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function PoolModule({ s }: { s: HomeSnapshot }) {
  const unit = usePreferences((p) => p.tempUnit);
  if (!s.pool) return null;
  const running = s.pool.equipment.filter((e) => e.on);
  const anyHeating = s.pool.bodies.some((b) => b.heater.state === 'heating');
  const ICONS: Record<string, LucideIcon> = { pool: Waves, spa: Bath };
  return (
    <Section
      tone="pool"
      band
      title="Pool & Spa"
      subtitle={s.pool.spaMode ? 'Spa mode' : 'Pool mode'}
      icon={Waves}
      iconActive={anyHeating}
      meta={<TileLink href="#/pool" label="Open pool and spa" />}
    >
      <div className="grid grid-cols-2 gap-3">
        {s.pool.bodies.map((b) => {
          const Icon = ICONS[b.id] ?? Waves;
          const heating = b.heater.state === 'heating';
          return (
            <div key={b.id} data-tone={b.id} className={cx('rounded-md border p-4 transition-colors duration-[var(--dur-slow)]', heating ? 'border-accent-ink/40 bg-accent-soft' : 'border-rule bg-surface-2')}>
              <div className="flex items-center justify-between">
                <span className="text-body font-medium text-fg">{b.name}</span>
                <Icon aria-hidden className="size-4 text-accent-ink" strokeWidth={1.75} />
              </div>
              <p className={cx('num mt-3 text-[2.25rem] leading-none font-light tracking-[-0.03em]', heating ? 'text-accent-ink' : 'text-fg')}>
                {formatTemp(b.waterTemp, unit)}
              </p>
              <p className="mt-2 text-label text-muted">
                {heating ? `Heating to ${formatTemp(b.heater.setpoint, unit)}` : b.heater.enabled ? `Heater on · ${formatTemp(b.heater.setpoint, unit)}` : 'Heater off'}
              </p>
            </div>
          );
        })}
      </div>
      <div className="mt-auto pt-4">
        <p className="caps mb-2 text-muted">Running</p>
        <div className="flex flex-wrap gap-2">
          {running.length ? (
            running.map((e) => (
              <span key={e.id} className="inline-flex items-center gap-1.5 rounded-full border border-rule bg-surface-2 px-3 py-1.5 text-label text-fg-2">
                <StatusDot status="on" />
                {e.name}
                {e.speedPct ? ` ${e.speedPct}%` : ''}
              </span>
            ))
          ) : (
            <span className="text-body text-muted">All equipment off</span>
          )}
        </div>
      </div>
    </Section>
  );
}

function SecurityModule({ s }: { s: HomeSnapshot }) {
  const clock = usePreferences((p) => p.clock);
  const now = useNow(30_000);
  const cam = s.security.cameras[0];
  if (!cam) return null;
  const dev = s.devices.find((d) => d.id === cam.deviceId);
  const events = [...s.security.events].sort((a, b) => b.at - a.at);
  const lastDing = events.find((e) => e.kind === 'ding');
  const lastMotion = events.find((e) => e.kind === 'motion');
  const online = dev?.availability === 'online';

  return (
    <Section
      tone="security"
      band
      title="Security"
      subtitle={`${cam.name} · ${online ? 'Online' : capitalize(dev?.availability ?? 'unavailable')}`}
      icon={ShieldCheck}
      meta={<TileLink href="#/security" label="Open security" />}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <CameraView camera={cam} compact />
        <div className="flex flex-col gap-2">
          {[
            { k: 'Doorbell', e: lastDing },
            { k: 'Motion', e: lastMotion },
          ].map(({ k, e }) => (
            <div key={k} className="flex items-center gap-3 rounded-sm bg-surface-2 px-3 py-3">
              {e ? <EventIcon kind={e.kind} /> : null}
              <span className="flex-1 text-body text-fg-2">{k}</span>
              <span className="num text-body font-medium text-fg">{e ? relativeTime(e.at, now, clock) : 'None'}</span>
            </div>
          ))}
          <p className="mt-auto px-1 text-label text-muted">{events.filter((e) => now - e.at < 86_400_000).length} events in the last 24 h</p>
        </div>
      </div>
    </Section>
  );
}

function AlertsModule({ s }: { s: HomeSnapshot }) {
  const clock = usePreferences((p) => p.clock);
  const now = useNow(30_000);
  const alerts = deriveAlerts(s);
  return (
    <Section title="Alerts" icon={AlertTriangle} meta={<span className="num rounded-full bg-surface-2 px-3 py-1">{alerts.length || 'None'}</span>}>
      {alerts.length === 0 ? (
        <p className="text-body text-muted">Nothing needs attention.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {alerts.map((a) => (
            <li key={a.id}>
              <a
                href={a.route}
                className="group flex items-center gap-3 rounded-sm border border-rule bg-surface-2 px-4 py-3 transition-colors hover:border-rule-strong"
              >
                <AlertTriangle aria-hidden className={cx('size-4 shrink-0', a.severity === 'error' ? 'text-danger' : 'text-muted')} strokeWidth={1.75} />
                <span className="min-w-0 flex-1">
                  <span className={cx('block text-body font-medium', a.severity === 'error' ? 'text-fg' : 'text-fg-2')}>{a.title}</span>
                  <span className="block truncate text-label text-muted">
                    {a.detail}
                    {a.since && ` · since ${relativeTime(a.since, now, clock)}`}
                  </span>
                </span>
                <ArrowRight aria-hidden className="size-3.5 text-muted group-hover:text-fg" strokeWidth={1.5} />
              </a>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
