/**
 * ThermostatControl — the target-temperature control for one climate zone.
 *
 * variant 'dial'     interactive circular dial (drag, tap the ring, keyboard)
 *                    plus −/+ buttons. In Auto mode a Heat/Cool switch picks
 *                    which target the dial edits.
 * variant 'compact'  −/+ only (wall display quick control).
 *
 * Behaviour (simulated commands for now):
 *  1. The target updates immediately as you drag or tap.
 *  2. It's sent shortly after you stop (one command, not one per degree).
 *  3. While a command is in flight you can keep adjusting; the newest value is
 *     queued and sent next. Nothing locks up.
 *  4. Success shows "Set to 72°"; failure says so and snaps back to the
 *     thermostat's real target.
 *  5. When the connection is lost the control shows the last known target and
 *     pauses (it never sends from a stale state).
 */
import { Check, Minus, Plus, TriangleAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Dial } from '@/components/Dial';
import { Segmented } from '@/components/controls';
import { cx, Spinner } from '@/components/primitives';
import type { ClimateZone } from '@/data/types';
import { clamp } from '@/lib/dial';
import { formatTemp, formatTime, setpointStepF } from '@/lib/format';
import { useHome } from '@/store/home';
import { usePreferences } from '@/store/preferences';

const SEND_DELAY = 650;
type Phase = 'idle' | 'adjusting' | 'sending' | 'done' | 'failed';
type Which = 'heat' | 'cool';

export function ThermostatControl({
  zone,
  variant = 'dial',
  size = 'lg',
  name,
}: {
  zone: ClimateZone;
  variant?: 'dial' | 'compact';
  size?: 'lg' | 'md';
  /** Area name for labels and messages, e.g. "Main floor". */
  name?: string;
}) {
  const config = useHome((s) => s.config)!;
  const connection = useHome((s) => s.snapshot?.connection);
  const run = useHome((s) => s.run);
  const unit = usePreferences((p) => p.tempUnit);
  const clock = usePreferences((p) => p.clock);
  const connected = connection?.status === 'connected';
  const label = name ?? zone.name;

  const [draft, setDraft] = useState<{ heat: number; cool: number } | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [message, setMessage] = useState('');
  const [which, setWhich] = useState<Which>(zone.mode === 'cool' ? 'cool' : 'heat');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);
  const queued = useRef<{ heat: number; cool: number } | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    if (zone.mode === 'cool') setWhich('cool');
    if (zone.mode === 'heat') setWhich('heat');
  }, [zone.mode]);

  const { minF, maxF, minGapF } = config.safety.thermostat;
  const heat = draft?.heat ?? zone.heatSetpoint;
  const cool = draft?.cool ?? zone.coolSetpoint;
  const step = setpointStepF(unit);
  const round = (n: number) => Math.round(n * 10) / 10;

  const send = async (next: { heat: number; cool: number }) => {
    if (inFlight.current) {
      queued.current = next; // keep only the newest
      return;
    }
    inFlight.current = true;
    setPhase('sending');
    const shown = zone.mode === 'auto' ? `${formatTemp(next.heat, unit)}–${formatTemp(next.cool, unit)}` : formatTemp(zone.mode === 'cool' ? next.cool : next.heat, unit);
    const ok = await run(
      { type: 'climate.setSetpoints', zoneId: zone.id, heat: next.heat, cool: next.cool },
      { pending: 'Sending to thermostat…', success: `${label} set to ${shown}` },
    );
    inFlight.current = false;
    if (queued.current) {
      const q = queued.current;
      queued.current = null;
      void send(q);
      return;
    }
    if (ok) {
      setPhase('done');
      setMessage(`Set to ${shown}`);
    } else {
      setPhase('failed');
      setMessage('Couldn’t reach the thermostat. Target unchanged.');
    }
    setDraft(null);
    window.setTimeout(() => setPhase((p) => (p === 'done' || p === 'failed' ? 'idle' : p)), 2600);
  };

  /** Update the target now; send after a short pause. */
  const change = (next: { heat: number; cool: number }, delay = SEND_DELAY) => {
    setDraft(next);
    setPhase('adjusting');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void send(next), delay);
  };

  /** Keep Auto mode's heat/cool targets at least `minGapF` apart. */
  const withGap = (w: Which, v: number) => {
    if (w === 'heat') return { heat: clamp(v, minF, maxF - minGapF), cool: Math.max(cool, v + minGapF) };
    return { heat: Math.min(heat, v - minGapF), cool: clamp(v, minF + minGapF, maxF) };
  };
  const setTarget = (w: Which, v: number, delay?: number) => {
    const next = zone.mode === 'auto' ? withGap(w, v) : w === 'heat' ? { heat: v, cool } : { heat, cool: v };
    change({ heat: round(next.heat), cool: round(next.cool) }, delay);
  };

  if (zone.mode === 'off' || zone.mode === 'fan_only') {
    return (
      <div className="flex min-h-40 flex-col items-center justify-center gap-1 text-center">
        <p className="text-lead text-fg-2">{zone.mode === 'off' ? 'System is off' : 'Fan only'}</p>
        <p className="text-body text-muted">Choose Heat, Cool or Auto to set a temperature.</p>
      </div>
    );
  }

  const active: Which = zone.mode === 'auto' ? which : zone.mode === 'cool' ? 'cool' : 'heat';
  const target = active === 'heat' ? heat : cool;
  const disabled = !connected;
  const canDown = target - step >= minF;
  const canUp = target + step <= maxF;
  const btn =
    'grid size-12 place-items-center rounded-full border border-control bg-surface-2 text-fg transition-[transform,background-color] hover:bg-surface-3 active:scale-90 disabled:opacity-30';

  const status = (
    <p className="flex min-h-6 items-center justify-center gap-1.5 text-center text-label" aria-live="polite">
      {!connected ? (
        <span className="text-muted">Last known · {connection ? formatTime(connection.since, clock) : ''}. Reconnecting…</span>
      ) : phase === 'adjusting' ? (
        <span className="text-fg-2">Adjusting…</span>
      ) : phase === 'sending' ? (
        <span className="flex items-center gap-1.5 text-accent-ink">
          <Spinner className="size-3" /> Sending to thermostat…
        </span>
      ) : phase === 'done' ? (
        <span className="flex items-center gap-1.5 text-positive animate-zh-in">
          <Check className="size-3.5" strokeWidth={2.5} /> {message}
        </span>
      ) : phase === 'failed' ? (
        <span className="flex items-center gap-1.5 text-danger animate-zh-in">
          <TriangleAlert className="size-3.5" strokeWidth={2} /> {message}
        </span>
      ) : (
        <span className="text-muted">
          Range {formatTemp(minF, unit)}–{formatTemp(maxF, unit)}
        </span>
      )}
    </p>
  );

  const buttons = (
    <div className="flex items-center justify-center gap-8">
      <button type="button" className={btn} disabled={disabled || !canDown} onClick={() => setTarget(active, target - step)} aria-label={`Lower ${label} ${active} target`}>
        <Minus className="size-5" strokeWidth={2} />
      </button>
      {variant === 'compact' && (
        <output className="num min-w-[3ch] text-center text-[2.5rem] leading-none font-light tracking-tight text-fg" aria-live="polite">
          <span key={target} className="inline-block animate-zh-tick">
            {formatTemp(target, unit)}
          </span>
        </output>
      )}
      <button type="button" className={btn} disabled={disabled || !canUp} onClick={() => setTarget(active, target + step)} aria-label={`Raise ${label} ${active} target`}>
        <Plus className="size-5" strokeWidth={2} />
      </button>
    </div>
  );

  if (variant === 'compact') {
    return (
      <div className="flex flex-col items-center gap-1">
        {buttons}
        {status}
      </div>
    );
  }

  const actionWord = zone.action === 'heating' ? 'Heating' : zone.action === 'cooling' ? 'Cooling' : 'Holding';
  return (
    <div className="flex w-full flex-col items-center gap-3">
      {zone.mode === 'auto' && (
        <Segmented<Which>
          size="sm"
          label={`${label}: which target to adjust`}
          value={which}
          onChange={setWhich}
          options={[
            { value: 'heat', label: `Heat to ${formatTemp(heat, unit)}` },
            { value: 'cool', label: `Cool to ${formatTemp(cool, unit)}` },
          ]}
        />
      )}
      <Dial
        className={size === 'md' ? 'max-w-[220px]' : undefined}
        value={target}
        min={minF}
        max={maxF}
        step={step}
        current={zone.currentTemp}
        tone={active === 'cool' ? 'cool' : 'heat'}
        disabled={disabled}
        label={`${label} ${active === 'heat' ? 'heat' : 'cool'} target temperature`}
        valueText={`${formatTemp(target, unit)}, currently ${formatTemp(zone.currentTemp, unit, { decimals: true })}`}
        onChange={(v) => {
          setDraft((d) => {
            const base = d ?? { heat, cool };
            const next = zone.mode === 'auto' ? withGap(active, v) : active === 'heat' ? { ...base, heat: v } : { ...base, cool: v };
            return { heat: round(next.heat), cool: round(next.cool) };
          });
          setPhase('adjusting');
          if (timer.current) clearTimeout(timer.current);
        }}
        onCommit={(v) => setTarget(active, v, 250)}
      >
        <span className="text-[clamp(0.625rem,5.2cqw,0.78rem)] font-medium tracking-[0.08em] text-muted uppercase">
          {active === 'heat' ? 'Heat to' : 'Cool to'}
        </span>
        <span className={cx('num my-0.5 text-[clamp(2.25rem,27cqw,4rem)] leading-none font-light tracking-[-0.04em]', disabled ? 'text-muted' : 'text-fg')}>
          {formatTemp(target, unit)}
        </span>
        <span className="text-[clamp(0.625rem,5.2cqw,0.8rem)] text-muted">
          {actionWord} · now {formatTemp(zone.currentTemp, unit, { decimals: true })}
        </span>
      </Dial>
      {buttons}
      {status}
    </div>
  );
}
