/**
 * Pool & Spa — Hayward OmniLogic. Pool and spa are presented side by side
 * so their functions are never confused. Disruptive operations (heaters,
 * pumps, valves, chlorinator) ask for confirmation first.
 */
import { useState } from 'react';
import { useConfirm } from '@/components/ConfirmDialog';
import { RangeSlider, Segmented, Stepper, Toggle } from '@/components/controls';
import { ArrowLeftRight, Bath, Bot, CalendarClock, Droplets, Waves } from 'lucide-react';
import { ArcGauge } from '@/components/ArcGauge';
import { IconChip, KeyValueList, Note, PageHeader, Section, Stack } from '@/components/layout-parts';
import { Button, cx } from '@/components/primitives';
import { StatusDot, StatusIndicator } from '@/components/Status';
import type { Command } from '@/data/commands';
import type { Body, HomeSnapshot, PoolEquipment } from '@/data/types';
import { useNow } from '@/hooks';
import { formatTemp, formatTime, relativeTime } from '@/lib/format';
import { isStale } from '@/lib/selectors';
import { useHome, usePendingKey } from '@/store/home';
import { usePreferences } from '@/store/preferences';

/** Runs a command, asking for confirmation first when config says so. */
function useGuardedRun() {
  const run = useHome((s) => s.run);
  const config = useHome((s) => s.config)!;
  const confirm = useConfirm();
  return async (
    cmd: Command,
    labels: { pending: string; success: string },
    dialog: { title: string; body: string; effects?: string[]; confirmLabel: string },
    opts: { skipConfirm?: boolean } = {},
  ) => {
    if (!opts.skipConfirm && config.safety.confirm.includes(cmd.type)) {
      const ok = await confirm(dialog);
      if (!ok) return false;
    }
    return run(cmd, labels);
  };
}

export function PoolSpa({ s }: { s: HomeSnapshot }) {
  const clock = usePreferences((p) => p.clock);
  const now = useNow(15_000);
  const pool = s.pool;

  if (!pool) {
    return (
      <div>
        <PageHeader title="Pool & Spa" />
        <Note>No pool system is connected.</Note>
      </div>
    );
  }

  const controller = s.devices.find((d) => d.id === pool.controllerDeviceId);
  const lastUpdated = Math.max(...pool.bodies.map((b) => b.lastUpdated));

  return (
    <Stack tone="pool">
      <PageHeader
        title="Pool & Spa"
        summary={pool.spaMode ? 'Spa mode: valves routed to the spa' : 'Pool mode: normal circulation'}
        actions={
          <StatusIndicator
            status={controller?.availability === 'online' ? 'online' : (controller?.availability ?? 'unavailable')}
            label={controller?.availability === 'online' ? `Controller online · ${relativeTime(lastUpdated, now, clock)}` : undefined}
          />
        }
      />

      <PoolGlance s={s} />

      <SpaModeBar s={s} />

      <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-2">
        {pool.bodies.map((b) => (
          <BodyColumn key={b.id} body={b} s={s} />
        ))}
      </div>

      <SharedSection s={s} />

      <Section title="Schedules" subtitle="Read-only" icon={CalendarClock}>
        <ul>
          {pool.schedules.map((sch) => {
            const eq = pool.equipment.find((e) => e.id === sch.equipmentId);
            return (
              <li key={sch.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-rule py-2.5">
                <span className="w-40 text-body text-fg">{sch.name}</span>
                <span className="flex-1 text-body text-fg-2">
                  {eq?.name} · {sch.window}
                </span>
                <span className={cx('text-label', sch.enabled ? 'text-fg-2' : 'text-muted')}>{sch.enabled ? 'Enabled' : 'Disabled'}</span>
              </li>
            );
          })}
        </ul>
        <Note className="mt-4">Schedules and light themes are edited in the Hayward app. The local integration can't create or change them.</Note>
      </Section>

      <Section title="Pool cleaner" subtitle="Maytronics Dolphin" icon={Bot}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-lead text-muted">Maytronics Dolphin</p>
            <p className="text-label text-muted">Integration deferred until the Nautilus model is confirmed.</p>
          </div>
          <StatusIndicator status="unavailable" label="Not connected" />
        </div>
      </Section>
    </Stack>
  );
}

function SpaModeBar({ s }: { s: HomeSnapshot }) {
  const pool = s.pool!;
  const guarded = useGuardedRun();
  const pending = usePendingKey('pool:spaMode');
  const disabled = s.connection.status !== 'connected' || pool.serviceMode;
  const next = !pool.spaMode;
  return (
    <div className="tile flex flex-wrap items-center justify-between gap-4 p-5 md:p-6">
      <div className="flex items-center gap-3">
        <IconChip icon={ArrowLeftRight} active={pool.spaMode} />
        <div>
        <p className="text-lead font-medium text-fg">Spa mode</p>
        <p className="text-label text-muted">Moves the valves so the filter pump circulates the spa instead of the pool.</p>
        </div>
      </div>
      <Toggle
        checked={pool.spaMode}
        label="Spa mode"
        pending={!!pending}
        disabled={disabled}
        onChange={() =>
          guarded(
            { type: 'pool.setSpaMode', on: next },
            { pending: 'Moving valves…', success: next ? 'Spa mode on' : 'Pool mode restored' },
            next
              ? {
                  title: 'Switch to spa mode?',
                  body: 'The valves will rotate to the spa. Pool circulation and pool heating pause until you switch back.',
                  effects: ['Valves → spa', 'Pool circulation paused', 'Spa heater can run once flow is detected'],
                  confirmLabel: 'Switch to spa',
                }
              : {
                  title: 'Return to pool mode?',
                  body: 'The valves will rotate back to the pool. The spa stops circulating and its heater will idle.',
                  effects: ['Valves → pool', 'Spa circulation stops'],
                  confirmLabel: 'Return to pool',
                },
          )
        }
      />
    </div>
  );
}

function BodyColumn({ body, s }: { body: Body; s: HomeSnapshot }) {
  const unit = usePreferences((p) => p.tempUnit);
  const clock = usePreferences((p) => p.clock);
  const config = useHome((st) => st.config)!;
  const guarded = useGuardedRun();
  const heaterPending = usePendingKey(`heater:${body.id}`);
  const now = useNow(15_000);
  const [draft, setDraft] = useState<number | null>(null);

  const connected = s.connection.status === 'connected';
  const stale = isStale(body.lastUpdated, 120, now, connected);
  const [min, max] = config.safety[body.id].setpointF;
  const setpoint = draft ?? body.heater.setpoint;
  const disabled = !connected || !!s.pool?.serviceMode;
  const equipment = s.pool!.equipment.filter((e) => e.body === body.id);
  const heater = body.heater;

  const heaterLine =
    heater.state === 'heating'
      ? `Heating to ${formatTemp(heater.setpoint, unit)}`
      : heater.enabled
        ? body.flow
          ? `At temperature · set ${formatTemp(heater.setpoint, unit)}`
          : 'Heater on · waiting for flow'
        : 'Heater off';

  const applySetpoint = async () => {
    if (draft === null) return;
    await guarded(
      { type: 'pool.setHeater', body: body.id, setpoint: draft },
      { pending: 'Sending setpoint…', success: `${body.name} set to ${formatTemp(draft, unit)}` },
      {
        title: `Set ${body.name.toLowerCase()} to ${formatTemp(draft, unit)}?`,
        body: heater.enabled ? 'The heater will run until the water reaches the new temperature.' : 'The heater is off, so this only changes the target.',
        effects: [`Setpoint ${formatTemp(heater.setpoint, unit)} → ${formatTemp(draft, unit)}`],
        confirmLabel: 'Set temperature',
      },
    );
    setDraft(null);
  };

  return (
    <section aria-labelledby={`body-${body.id}`} data-tone={body.id} className="tile animate-zh-rise p-5 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <IconChip icon={body.id === 'spa' ? Bath : Waves} active={heater.state === 'heating'} />
          <h2 id={`body-${body.id}`} className="text-lead font-medium text-fg">
            {body.name}
          </h2>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-surface-2 px-3 py-1 text-label text-muted">
          <StatusDot status={body.flow ? 'on' : 'off'} />
          {body.flow ? 'Flow' : 'No flow'}
        </span>
      </div>

      <ArcGauge
        className="mt-4 max-w-[220px]"
        value={body.waterTemp ?? min}
        min={min}
        max={max}
        marker={heater.enabled ? heater.setpoint : undefined}
        tone={heater.state === 'heating' ? 'accent' : 'neutral'}
        dim={stale}
      >
        <span className="text-[clamp(0.625rem,5.5cqw,0.75rem)] font-medium tracking-[0.09em] text-muted uppercase">Water</span>
        <span className={cx('num my-0.5 text-[clamp(1.75rem,22cqw,3rem)] leading-none font-light tracking-[-0.03em]', stale ? 'text-muted' : heater.state === 'heating' ? 'text-accent-ink' : 'text-fg')}>
          {formatTemp(body.waterTemp, unit, { decimals: body.id === 'spa' })}
        </span>
        <span className="text-[clamp(0.625rem,5.5cqw,0.75rem)] leading-tight text-muted">{heaterLine}</span>
      </ArcGauge>
      {stale && <p className="text-center text-label text-muted italic">As of {formatTime(body.lastUpdated, clock)}</p>}

      <div className="mt-2 border-t border-rule">
        <div className="flex items-center justify-between gap-4 py-3">
          <div>
            <p className="text-body text-fg">Heater</p>
            <p className="text-label text-muted">{heater.kind}</p>
          </div>
          <Toggle
            checked={heater.enabled}
            label={`${body.name} heater`}
            pending={!!heaterPending}
            disabled={disabled}
            onChange={(on) =>
              guarded(
                { type: 'pool.setHeater', body: body.id, enabled: on },
                { pending: on ? 'Enabling heater…' : 'Disabling heater…', success: `${body.name} heater ${on ? 'on' : 'off'}` },
                {
                  title: `${on ? 'Turn on' : 'Turn off'} the ${body.name.toLowerCase()} heater?`,
                  body: on
                    ? `The gas heater will fire whenever there is flow and the water is below ${formatTemp(heater.setpoint, unit)}.`
                    : 'Heating stops. Water temperature will drift toward air temperature.',
                  effects: on ? [`Target ${formatTemp(heater.setpoint, unit)}`, body.flow ? 'Flow detected: heats now' : 'No flow: waits for circulation'] : ['Heater off'],
                  confirmLabel: on ? 'Turn on heater' : 'Turn off heater',
                },
              )
            }
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-rule py-3">
          <div>
            <p className="text-body text-fg">Target</p>
            <p className="text-label text-muted">
              Limits {formatTemp(min, unit)}–{formatTemp(max, unit)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Stepper
              size="md"
              tone="heat"
              label={`${body.name} target temperature`}
              value={setpoint}
              display={formatTemp(setpoint, unit)}
              disabled={disabled || !!heaterPending}
              canDecrease={setpoint - 1 >= min}
              canIncrease={setpoint + 1 <= max}
              onStep={(d) => {
                const next = setpoint + d;
                setDraft(next === heater.setpoint ? null : next);
              }}
            />
          </div>
        </div>
        {draft !== null && (
          <div className="flex items-center justify-end gap-2 pb-3">
            <Button size="sm" variant="quiet" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="solid" onClick={applySetpoint} pending={!!heaterPending}>
              Set {formatTemp(draft, unit)}
            </Button>
          </div>
        )}
      </div>

      <div className="border-t border-rule">
        {equipment.map((eq) => (
          <EquipmentRow key={eq.id} eq={eq} s={s} />
        ))}
      </div>
    </section>
  );
}

function EquipmentRow({ eq, s }: { eq: PoolEquipment; s: HomeSnapshot }) {
  const guarded = useGuardedRun();
  const run = useHome((st) => st.run);
  const pending = usePendingKey(`equipment:${eq.id}`);
  const device = s.devices.find((d) => d.id === eq.deviceId);
  const reachable = device?.availability === 'online';
  const disabled = s.connection.status !== 'connected' || !reachable || !!s.pool?.serviceMode;
  const isLight = eq.type === 'light';

  const setOn = (on: boolean) =>
    guarded(
      { type: 'pool.setEquipment', equipmentId: eq.id, on },
      { pending: on ? 'Starting…' : 'Stopping…', success: `${eq.name} ${on ? 'on' : 'off'}` },
      {
        title: `${on ? 'Start' : 'Stop'} ${eq.name.toLowerCase()}?`,
        body:
          eq.type === 'pump'
            ? on
              ? 'The pump will start immediately.'
              : 'Stopping the pump also stops circulation and heating on this body of water.'
            : `This ${on ? 'opens' : 'closes'} the valve actuator.`,
        confirmLabel: on ? 'Start' : 'Stop',
      },
      { skipConfirm: isLight },
    );

  const presets = eq.speedPresets;
  const presetValue = presets && eq.speedPct !== undefined ? (Object.entries(presets).find(([, v]) => v === eq.speedPct)?.[0] ?? 'custom') : undefined;

  const setSpeed = (pct: number, label: string) =>
    guarded(
      { type: 'pool.setEquipment', equipmentId: eq.id, speedPct: pct },
      { pending: 'Changing speed…', success: `${eq.name} at ${pct}%` },
      {
        title: `Set ${eq.name.toLowerCase()} to ${label}?`,
        body: 'The variable-speed pump will ramp to the new speed. Higher speeds use considerably more energy.',
        effects: [`${eq.speedPct}% → ${pct}%`],
        confirmLabel: 'Change speed',
      },
    );

  return (
    <div className="border-b border-rule py-3 last:border-b-0">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-body text-fg">{eq.name}</p>
          <p className="text-label text-muted">
            {pending ? (
              <StatusIndicator status="on" pending={pending} />
            ) : eq.type === 'pump' && eq.speedPct !== undefined && eq.on ? (
              `${eq.description} · ${eq.speedPct}%`
            ) : isLight && eq.on ? (
              `Show: ${eq.show}`
            ) : (
              (eq.description ?? (eq.on ? 'On' : 'Off'))
            )}
          </p>
        </div>
        <Toggle checked={eq.on} label={eq.name} pending={!!pending} disabled={disabled} onChange={setOn} />
      </div>

      {presets && eq.on && (
        <div className="mt-3 space-y-3">
          <Segmented
            size="sm"
            label={`${eq.name} speed`}
            value={presetValue ?? 'custom'}
            disabled={disabled || !!pending}
            onChange={(v) => {
              if (v === 'custom') return;
              const pct = presets[v as keyof typeof presets];
              void setSpeed(pct, `${v} (${pct}%)`);
            }}
            options={[
              { value: 'low', label: `Low ${presets.low}%` },
              { value: 'med', label: `Med ${presets.med}%` },
              { value: 'high', label: `High ${presets.high}%` },
              { value: 'custom', label: 'Custom', disabled: presetValue !== 'custom' },
            ]}
          />
          <RangeSlider
            label={`${eq.name} custom speed`}
            value={eq.speedPct ?? 50}
            min={18}
            max={100}
            disabled={disabled || !!pending}
            format={(v) => `${v}%`}
            onCommit={(v) => setSpeed(v, `${v}%`)}
          />
        </div>
      )}

      {isLight && eq.shows && (
        <div className="mt-3">
          <label className="flex items-center justify-between gap-3 text-label text-muted">
            Light show
            <select
              value={eq.show}
              disabled={disabled || !!pending}
              onChange={(e) =>
                run({ type: 'pool.setLightShow', equipmentId: eq.id, show: e.target.value }, { pending: 'Changing show…', success: `${eq.name}: ${e.target.value}` })
              }
              className="h-8 rounded-full border border-control bg-surface-2 px-2 text-body text-fg disabled:opacity-40"
            >
              {eq.shows.map((sh) => (
                <option key={sh} value={sh}>
                  {sh}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </div>
  );
}

function SharedSection({ s }: { s: HomeSnapshot }) {
  const unit = usePreferences((p) => p.tempUnit);
  const guarded = useGuardedRun();
  const pool = s.pool!;
  const chlor = pool.equipment.find((e) => e.type === 'chlorinator');
  const pending = usePendingKey(chlor ? `equipment:${chlor.id}` : '');
  const disabled = s.connection.status !== 'connected' || pool.serviceMode;

  return (
    <Section title="Shared equipment & water" icon={Droplets}>
      <KeyValueList
        items={[
          { k: 'Air temperature', v: formatTemp(pool.airTemp, unit) },
          { k: 'Salt', v: pool.saltPpm ? `${pool.saltPpm.toLocaleString()} ppm` : '—' },
          { k: 'Service mode', v: pool.serviceMode ? 'On: controls locked' : 'Off' },
          { k: 'Controller', v: s.devices.find((d) => d.id === pool.controllerDeviceId)?.model ?? '—' },
        ]}
      />
      {chlor && (
        <div className="mt-6 grid grid-cols-1 items-center gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div>
            <p className="text-body text-fg">{chlor.name}</p>
            <p className="text-label text-muted">{pending ? <StatusIndicator status="on" pending={pending} /> : `Output ${chlor.outputPct}% · ${chlor.description}`}</p>
          </div>
          <RangeSlider
            label="Chlorinator output"
            value={chlor.outputPct ?? 0}
            min={0}
            max={100}
            step={5}
            disabled={disabled || !!pending}
            format={(v) => `${v}%`}
            onCommit={(v) =>
              guarded(
                { type: 'pool.setEquipment', equipmentId: chlor.id, outputPct: v },
                { pending: 'Setting output…', success: `Chlorinator at ${v}%` },
                {
                  title: `Set chlorinator output to ${v}%?`,
                  body: 'Changes how much chlorine the salt cell generates while the pump runs. Over-chlorination can damage equipment and surfaces.',
                  effects: [`${chlor.outputPct}% → ${v}%`],
                  confirmLabel: 'Set output',
                },
              )
            }
          />
        </div>
      )}
      <Note className="mt-5">
        Via the community local integration (haomnilogic-local). Not supported: dual-speed pumps, ORP chlorinator control, schedule editing. Controller model and firmware still to be confirmed.
      </Note>
    </Section>
  );
}

/** Plain-language summary: what each part of the pool system is doing right now. */
function PoolGlance({ s }: { s: HomeSnapshot }) {
  const unit = usePreferences((p) => p.tempUnit);
  const pool = s.pool!;
  const p = pool.bodies.find((b) => b.id === 'pool');
  const sp = pool.bodies.find((b) => b.id === 'spa');
  const pump = pool.equipment.find((e) => e.type === 'pump');
  const chlor = pool.equipment.find((e) => e.type === 'chlorinator');
  const heaterText = (b?: Body) =>
    !b ? '—' : b.heater.state === 'heating' ? `Heating to ${formatTemp(b.heater.setpoint, unit)}` : b.heater.enabled ? `On, holding ${formatTemp(b.heater.setpoint, unit)}` : 'Off';
  const items: { k: string; v: string; on?: boolean }[] = [
    { k: 'Pool water', v: p ? formatTemp(p.waterTemp, unit) : '—' },
    { k: 'Spa water', v: sp ? formatTemp(sp.waterTemp, unit) : '—' },
    { k: 'Pool heater', v: heaterText(p), on: p?.heater.state === 'heating' },
    { k: 'Spa heater', v: heaterText(sp), on: sp?.heater.state === 'heating' },
    { k: 'Pump & filter', v: pump ? (pump.on ? `Running${pump.speedPct !== undefined ? ` at ${pump.speedPct}%` : ''}` : 'Off') : '—', on: pump?.on },
    { k: 'Chlorinator', v: chlor ? (chlor.on ? `On${chlor.outputPct !== undefined ? ` · ${chlor.outputPct}% output` : ''}` : 'Off') : '—', on: chlor?.on },
    { k: 'Water goes to', v: pool.spaMode ? 'Spa (pool paused)' : 'Pool (normal)' },
  ];
  return (
    <section aria-label="At a glance" className="tile p-4 sm:p-5">
      <h2 className="caps mb-3 text-muted">At a glance</h2>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4 2xl:grid-cols-7">
        {items.map((it) => (
          <div key={it.k} className="min-w-0">
            <dt className="text-label text-muted">{it.k}</dt>
            <dd className="mt-0.5 flex items-center gap-1.5 text-body font-medium text-fg">
              {it.on !== undefined && <StatusDot status={it.on ? 'online' : 'off'} />}
              <span>{it.v}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
