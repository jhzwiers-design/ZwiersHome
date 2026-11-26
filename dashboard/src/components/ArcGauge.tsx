/**
 * ArcGauge — a 270° dial for temperatures (thermostat setpoint, water temp).
 * Purely visual: the value is also always present as text for assistive tech.
 */
import type { ReactNode } from 'react';
import { cx } from './primitives';

const START = 135; // degrees, measured clockwise from 3 o'clock
const SWEEP = 270;
const R = 84;
const C = 100;

function polar(deg: number, r = R) {
  const rad = (deg * Math.PI) / 180;
  return { x: C + r * Math.cos(rad), y: C + r * Math.sin(rad) };
}

function arcPath(fromDeg: number, toDeg: number) {
  const a = polar(fromDeg);
  const b = polar(toDeg);
  const large = toDeg - fromDeg > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${R} ${R} 0 ${large} 1 ${b.x} ${b.y}`;
}

export function ArcGauge({
  value,
  min,
  max,
  marker,
  tone = 'accent',
  dim,
  children,
  className,
}: {
  /** Drives the filled arc and knob. */
  value: number;
  min: number;
  max: number;
  /** Optional second value shown as a small tick (e.g. heater target). */
  marker?: number;
  tone?: 'accent' | 'cool' | 'neutral';
  /** Stale or off: drawn without colour. */
  dim?: boolean;
  /** Centre content (big number + caption). */
  children?: ReactNode;
  className?: string;
}) {
  const frac = (v: number) => Math.min(1, Math.max(0, (v - min) / (max - min)));
  const end = START + SWEEP * frac(value);
  const knob = polar(end);
  const color = dim || tone === 'neutral' ? 'var(--fg-2)' : tone === 'cool' ? 'var(--cool)' : 'var(--accent)';
  const tick = marker !== undefined ? START + SWEEP * frac(marker) : null;

  return (
    <div className={cx('relative mx-auto aspect-square w-full max-w-[240px]', className)}>
      <svg viewBox="0 0 200 200" className="absolute inset-0 size-full" aria-hidden>
        <path d={arcPath(START, START + SWEEP)} fill="none" stroke="var(--surface-2)" strokeWidth="14" strokeLinecap="round" />
        <path d={arcPath(START, START + SWEEP)} fill="none" stroke="var(--rule)" strokeWidth="1" strokeDasharray="1 6" />
        {frac(value) > 0.001 && (
          <path
            d={arcPath(START, end)}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            style={{ filter: dim ? undefined : `drop-shadow(0 0 6px ${color})`, transition: 'all var(--dur) var(--ease)' }}
          />
        )}
        {tick !== null && (
          <line
            x1={polar(tick, R - 13).x}
            y1={polar(tick, R - 13).y}
            x2={polar(tick, R + 13).x}
            y2={polar(tick, R + 13).y}
            stroke="var(--fg)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}
        <circle cx={knob.x} cy={knob.y} r="9" fill="var(--surface)" stroke={color} strokeWidth="4" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
