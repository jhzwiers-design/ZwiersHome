/**
 * ThermostatControl — setpoint steppers for one climate zone.
 *
 * Stepping updates a local draft immediately; the command is sent once the
 * user pauses (1 s), so pressing + three times sends one command, not three.
 * While waiting/sending, the state is shown explicitly.
 */
import { useEffect, useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { ArcGauge } from '@/components/ArcGauge';
import { Stepper } from '@/components/controls';
import { Spinner } from '@/components/primitives';
import type { ClimateZone } from '@/data/types';
import { formatTemp, setpointStepF } from '@/lib/format';
import { useHome, usePendingKey } from '@/store/home';
import { usePreferences } from '@/store/preferences';

const COMMIT_DELAY = 1000;

export function ThermostatControl({
  zone,
  size = 'lg',
  variant = 'steppers',
}: {
  zone: ClimateZone;
  size?: 'lg' | 'md';
  /** 'dial' shows a round gauge (single-setpoint modes); auto mode always uses steppers. */
  variant?: 'steppers' | 'dial';
}) {
  const config = useHome((s) => s.config)!;
  const connected = useHome((s) => s.snapshot?.connection.status === 'connected');
  const run = useHome((s) => s.run);
  const pending = usePendingKey(`climate:${zone.id}:setpoint`);
  const unit = usePreferences((p) => p.tempUnit);
  const [draft, setDraft] = useState<{ heat: number; cool: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const { minF, maxF, minGapF } = config.safety.thermostat;
  const heat = draft?.heat ?? zone.heatSetpoint;
  const cool = draft?.cool ?? zone.coolSetpoint;
  const step = setpointStepF(unit);
  const round = (n: number) => Math.round(n * 10) / 10;

  const schedule = (next: { heat: number; cool: number }) => {
    setDraft(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const label = zone.mode === 'auto' ? `${formatTemp(next.heat, unit)}–${formatTemp(next.cool, unit)}` : formatTemp(zone.mode === 'cool' ? next.cool : next.heat, unit);
      await run(
        { type: 'climate.setSetpoints', zoneId: zone.id, heat: next.heat, cool: next.cool },
        { pending: 'Sending to thermostat…', success: `${zone.name} set to ${label}` },
      );
      setDraft(null);
    }, COMMIT_DELAY);
  };

  if (zone.mode === 'off' || zone.mode === 'fan_only') {
    return <p className="text-lead text-muted">{zone.mode === 'off' ? 'System off. No setpoint.' : 'Fan only. No setpoint.'}</p>;
  }

  const disabled = !connected || !!pending;
  const showHeat = zone.mode === 'heat' || zone.mode === 'auto';
  const showCool = zone.mode === 'cool' || zone.mode === 'auto';

  const status = (
    <p className="mt-3 flex h-5 items-center justify-center gap-2 text-label" aria-live="polite">
      {pending ? (
        <span className="flex items-center gap-2 text-accent">
          <Spinner className="size-3" /> {pending}
        </span>
      ) : draft ? (
        <span className="text-muted">Release to send…</span>
      ) : (
        <span className="text-faint">
          Limits {formatTemp(minF, unit)}–{formatTemp(maxF, unit)}
        </span>
      )}
    </p>
  );

  if (variant === 'dial' && zone.mode !== 'auto') {
    const isHeat = zone.mode === 'heat';
    const value = isHeat ? heat : cool;
    const set = (d: -1 | 1) => schedule(isHeat ? { heat: round(heat + d * step), cool } : { heat, cool: round(cool + d * step) });
    const canDec = value - step >= minF;
    const canInc = value + step <= maxF;
    const btn =
      'grid size-11 place-items-center rounded-full border border-rule bg-surface-2 text-fg-2 transition-colors hover:border-accent hover:text-accent disabled:opacity-30';
    return (
      <div role="group" aria-label={`${isHeat ? 'Heat' : 'Cool'} setpoint`}>
        <ArcGauge value={value} min={minF} max={maxF} tone={isHeat ? 'accent' : 'cool'} dim={!connected} className={size === 'md' ? 'max-w-[200px]' : undefined}>
          <span className="caps text-muted">{isHeat ? 'Heat to' : 'Cool to'}</span>
          <output aria-live="polite" className={size === 'md' ? 'num text-[2.75rem] leading-none font-light' : 'num text-[3.5rem] leading-none font-light'}>
            {formatTemp(value, unit)}
          </output>
          <span className="mt-1 text-label text-muted">Now {formatTemp(zone.currentTemp, unit, { decimals: true })}</span>
        </ArcGauge>
        <div className="-mt-4 flex items-center justify-center gap-6">
          <button type="button" className={btn} onClick={() => set(-1)} disabled={disabled || !canDec} aria-label={`Lower ${isHeat ? 'heat' : 'cool'} setpoint`}>
            <Minus className="size-4" strokeWidth={1.75} />
          </button>
          <button type="button" className={btn} onClick={() => set(1)} disabled={disabled || !canInc} aria-label={`Raise ${isHeat ? 'heat' : 'cool'} setpoint`}>
            <Plus className="size-4" strokeWidth={1.75} />
          </button>
        </div>
        {status}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-x-10 gap-y-6">
        {showHeat && (
          <div>
            <p className="caps mb-2 text-muted">{zone.mode === 'auto' ? 'Heat to' : 'Setpoint'}</p>
            <Stepper
              size={size}
              tone="heat"
              label="heat setpoint"
              value={heat}
              display={formatTemp(heat, unit)}
              disabled={disabled}
              canDecrease={heat - step >= minF}
              canIncrease={heat + step <= maxF && (zone.mode !== 'auto' || cool - (heat + step) >= minGapF)}
              onStep={(d) => schedule({ heat: round(heat + d * step), cool })}
            />
          </div>
        )}
        {showCool && (
          <div>
            <p className="caps mb-2 text-muted">{zone.mode === 'auto' ? 'Cool to' : 'Setpoint'}</p>
            <Stepper
              size={size}
              tone="cool"
              label="cool setpoint"
              value={cool}
              display={formatTemp(cool, unit)}
              disabled={disabled}
              canIncrease={cool + step <= maxF}
              canDecrease={cool - step >= minF && (zone.mode !== 'auto' || cool - step - heat >= minGapF)}
              onStep={(d) => schedule({ heat, cool: round(cool + d * step) })}
            />
          </div>
        )}
      </div>
      <div className="[&>p]:justify-start">{status}</div>
    </div>
  );
}
