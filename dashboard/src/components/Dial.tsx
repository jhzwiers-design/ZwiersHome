/**
 * Dial — an interactive 270° temperature dial.
 *
 * Drag the handle (or anywhere on the ring) with a finger, mouse or trackpad;
 * the value follows continuously in `step` increments. Keyboard: arrows ±1 step,
 * Page Up/Down ±5, Home/End to the limits. Plus/minus buttons live outside this
 * component as an alternative.
 *
 * - The handle has a large invisible hit area (forgiving to grab).
 * - Grabbing the handle never makes the value jump.
 * - Dragging past either end pins at the limit instead of wrapping round.
 * - A small tick marks the CURRENT temperature, separate from the target.
 */
import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { angleFromPoint, clamp, fracFromAngle, fracFromValue, pointOnArc, SWEEP, valueFromFrac } from '@/lib/dial';
import { cx } from './primitives';

const C = 100;
const R = 84;

function arcPath(fromF: number, toF: number, r = R) {
  const a = pointOnArc(fromF, r);
  const b = pointOnArc(toF, r);
  const large = (toF - fromF) * SWEEP > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y}`;
}

export function Dial({
  value,
  min,
  max,
  step = 1,
  current,
  onChange,
  onCommit,
  disabled,
  tone = 'heat',
  label,
  valueText,
  children,
  className,
}: {
  /** Target value (shown by the handle). */
  value: number;
  min: number;
  max: number;
  step?: number;
  /** Current reading, shown as a small tick. */
  current?: number | null;
  /** Called continuously while dragging / on each key press. */
  onChange: (v: number) => void;
  /** Called when the user lets go (or after a key press). */
  onCommit: (v: number) => void;
  disabled?: boolean;
  tone?: 'heat' | 'cool' | 'neutral';
  /** Accessible name, e.g. "Main floor heat setpoint". */
  label: string;
  /** Spoken value, e.g. "71 degrees". */
  valueText: string;
  children?: ReactNode;
  className?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const fracRef = useRef(fracFromValue(value, min, max));
  const [dragging, setDragging] = useState(false);
  const frac = fracFromValue(value, min, max);
  const handle = pointOnArc(frac, R);
  const color = disabled ? 'var(--faint)' : tone === 'cool' ? 'var(--cool)' : tone === 'neutral' ? 'var(--muted)' : 'var(--accent)';

  /** Pointer position → SVG user units (the viewBox is 200×200). */
  const toLocal = (e: PointerEvent) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * 200, y: ((e.clientY - rect.top) / rect.height) * 200 };
  };

  const setFromPoint = (x: number, y: number, guard: boolean) => {
    const f = fracFromAngle(angleFromPoint(C, C, x, y), guard ? fracRef.current : undefined);
    fracRef.current = f;
    const v = valueFromFrac(f, min, max, step);
    if (v !== value) onChange(v);
    return v;
  };

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (disabled || e.button > 0) return;
    const p = toLocal(e);
    const distToHandle = Math.hypot(p.x - handle.x, p.y - handle.y);
    const distToRing = Math.abs(Math.hypot(p.x - C, p.y - C) - R);
    if (distToHandle > 30 && distToRing > 24) return; // centre text etc.: not a drag
    e.preventDefault();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    fracRef.current = frac;
    setDragging(true);
    // Grabbing the handle keeps the value; tapping elsewhere on the ring moves it there.
    if (distToHandle > 30) setFromPoint(p.x, p.y, false);
  };

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!dragging) return;
    const p = toLocal(e);
    setFromPoint(p.x, p.y, true);
  };

  const finish = (e: PointerEvent<SVGSVGElement>) => {
    if (!dragging) return;
    setDragging(false);
    try {
      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    onCommit(value);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (disabled) return;
    const big = step * 5;
    const map: Record<string, number> = { ArrowUp: step, ArrowRight: step, ArrowDown: -step, ArrowLeft: -step, PageUp: big, PageDown: -big };
    let next: number | null = null;
    if (e.key in map) next = value + map[e.key]!;
    if (e.key === 'Home') next = min;
    if (e.key === 'End') next = max;
    if (next === null) return;
    e.preventDefault();
    next = clamp(Math.round(next * 10) / 10, min, max);
    onChange(next);
    onCommit(next);
  };

  const curF = current !== undefined && current !== null ? fracFromValue(current, min, max) : null;
  const tickIn = curF !== null ? pointOnArc(curF, R - 16) : null;
  const tickOut = curF !== null ? pointOnArc(curF, R - 9) : null;

  return (
    <div className={cx('@container relative mx-auto aspect-square w-full max-w-[260px] min-w-[176px] select-none', className)}>
      <svg
        ref={svgRef}
        viewBox="0 0 200 200"
        className={cx('absolute inset-0 size-full touch-none', !disabled && 'cursor-grab', dragging && 'cursor-grabbing')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finish}
        onPointerCancel={finish}
        aria-hidden
      >
        {/* Track */}
        <path d={arcPath(0, 1)} fill="none" stroke="var(--surface-3)" strokeWidth="14" strokeLinecap="round" />
        {/* Filled part: re-drawn each change; transition only when not dragging so the finger is followed exactly */}
        <path
          d={arcPath(0, 1)}
          pathLength={100}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${Math.max(0.001, frac * 100)} 100`}
          style={{
            transition: dragging ? 'none' : 'stroke-dasharray 420ms var(--ease-out), stroke 240ms var(--ease)',
            filter: disabled ? undefined : `drop-shadow(0 0 7px color-mix(in srgb, ${color} 55%, transparent))`,
          }}
        />
        {/* Current temperature tick */}
        {tickIn && tickOut && (
          <line x1={tickIn.x} y1={tickIn.y} x2={tickOut.x} y2={tickOut.y} stroke="var(--fg-2)" strokeWidth="3" strokeLinecap="round" />
        )}
        {/* Handle rides the arc by rotating around the centre */}
        <g
          style={{
            transform: `rotate(${SWEEP * frac}deg)`,
            transformOrigin: '100px 100px',
            transition: dragging ? 'none' : 'transform 420ms var(--ease-out)',
          }}
        >
          {(() => {
            const p0 = pointOnArc(0, R);
            return (
              <>
                <circle cx={p0.x} cy={p0.y} r="26" fill="transparent" />
                {dragging && <circle cx={p0.x} cy={p0.y} r="19" fill={color} opacity="0.18" />}
                <circle
                  cx={p0.x}
                  cy={p0.y}
                  r={dragging ? 13 : 11}
                  fill="var(--surface)"
                  stroke={color}
                  strokeWidth="4.5"
                  style={{ transition: 'r 160ms var(--ease-spring)' }}
                />
              </>
            );
          })()}
        </g>
      </svg>

      {/* Keyboard + screen-reader control (visually it's the handle) */}
      <div
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={valueText}
        aria-disabled={disabled || undefined}
        onKeyDown={onKeyDown}
        className="absolute rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        style={{
          left: `${(handle.x / 200) * 100}%`,
          top: `${(handle.y / 200) * 100}%`,
          width: '15%',
          height: '15%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />

      <div className={cx('pointer-events-none absolute inset-[20%] flex flex-col items-center justify-center text-center transition-transform duration-[var(--dur)]', dragging && 'scale-105')}>
        {children}
      </div>
    </div>
  );
}
