/**
 * ArcGauge — a 270° dial for temperatures (thermostat setpoint, water temp).
 * Purely visual: the value is also always present as text for assistive tech.
 */
import { useId, type ReactNode } from 'react';
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
  const gid = `arc-${useId().replace(/:/g, '')}`;
  const accent = !dim && tone === 'accent';
  // Accent arcs run crimson → bright crimson; others are flat.
  const color = dim ? 'var(--faint)' : tone === 'neutral' ? 'var(--gauge-neutral)' : tone === 'cool' ? 'var(--cool)' : 'var(--accent-ink)';
  const stroke = accent ? `url(#${gid})` : color;
  const glow = accent ? 'var(--accent)' : color;
  const tick = marker !== undefined ? START + SWEEP * frac(marker) : null;

  return (
    // @container: the centre text sizes itself relative to the dial (cqw units).
    <div className={cx('@container relative mx-auto aspect-square w-full max-w-[240px] min-w-[176px]', className)}>
      <svg viewBox="0 0 200 200" className="absolute inset-0 size-full" aria-hidden>
        <defs>
          <linearGradient id={gid} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent-ink)" />
          </linearGradient>
        </defs>
        <path d={arcPath(START, START + SWEEP)} fill="none" stroke="var(--surface-2)" strokeWidth="14" strokeLinecap="round" />
        <path d={arcPath(START, START + SWEEP)} fill="none" stroke="var(--rule)" strokeWidth="1" strokeDasharray="1 6" />
        {/* Value arc: the full arc, revealed with a dash so changes animate smoothly. */}
        <path
          d={arcPath(START, START + SWEEP)}
          pathLength={100}
          fill="none"
          stroke={stroke}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${Math.max(0.001, frac(value) * 100)} 100`}
          style={{
            filter: dim ? undefined : `drop-shadow(0 0 6px ${glow})`,
            transition: 'stroke-dasharray 520ms var(--ease), stroke 320ms var(--ease)',
          }}
        />
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
        {/* Knob rides the arc by rotating around the centre. */}
        <g style={{ transform: `rotate(${SWEEP * frac(value)}deg)`, transformOrigin: '100px 100px', transition: 'transform 520ms var(--ease)' }}>
          <circle cx={polar(START).x} cy={polar(START).y} r="9" fill="var(--surface)" stroke={color} strokeWidth="4" />
        </g>
      </svg>
      <div className="absolute inset-[18%] flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
