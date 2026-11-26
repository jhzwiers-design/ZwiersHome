/**
 * Geometry for the circular thermostat dial (pure functions, unit-tested).
 *
 * The dial is a 270° arc that starts at 135° (bottom-left) and runs clockwise
 * to 45° (bottom-right). Angles are in degrees, measured clockwise from the
 * positive x-axis in screen coordinates (y points down).
 */
export const START = 135;
export const SWEEP = 270;

/** Angle of point (x, y) around centre (cx, cy), 0–360. */
export function angleFromPoint(cx: number, cy: number, x: number, y: number): number {
  const deg = (Math.atan2(y - cy, x - cx) * 180) / Math.PI;
  return (deg + 360) % 360;
}

/**
 * Position along the arc (0–1) for an angle.
 * - Angles in the bottom gap snap to the nearer end.
 * - `prev` guards the gap: dragging past either end never "wraps" to the
 *   other end; it stays pinned at the end you were heading towards.
 */
export function fracFromAngle(deg: number, prev?: number): number {
  const a = (deg - START + 360) % 360;
  let f: number;
  if (a <= SWEEP) f = a / SWEEP;
  else f = a > SWEEP + (360 - SWEEP) / 2 ? 0 : 1;
  if (prev !== undefined && Math.abs(f - prev) > 0.5) f = prev > 0.5 ? 1 : 0;
  return f;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Arc position → value, snapped to `step` and kept within [min, max]. */
export function valueFromFrac(f: number, min: number, max: number, step: number): number {
  const raw = min + clamp(f, 0, 1) * (max - min);
  const snapped = Math.round((raw - min) / step) * step + min;
  return clamp(Math.round(snapped * 10) / 10, min, max);
}

/** Value → arc position (0–1). */
export function fracFromValue(v: number, min: number, max: number): number {
  if (max <= min) return 0;
  return clamp((v - min) / (max - min), 0, 1);
}

/** Point on a circle of radius r around (c, c) for an arc position. */
export function pointOnArc(f: number, r: number, c = 100): { x: number; y: number } {
  const rad = ((START + SWEEP * clamp(f, 0, 1)) * Math.PI) / 180;
  return { x: c + r * Math.cos(rad), y: c + r * Math.sin(rad) };
}
