/**
 * HomeMap — interactive floor plan (isometric 3D or flat 2D).
 *
 * Rooms come from config/floorplan.ts and are linked to Home Assistant Areas,
 * so their lit/unlit state is computed from whatever lights are in that area.
 * Click (or Enter/Space) a room to select it.
 *
 * Isometric projection is done in JS for points, so labels stay upright and
 * readable in both modes.
 */
import { AlertTriangle, Box, Square } from 'lucide-react';
import { useMemo, useState, type KeyboardEvent } from 'react';
import { floorPlan, type FloorPlan } from '@/config/floorplan';
import type { HomeSnapshot } from '@/data/types';
import { availabilityOf } from '@/lib/selectors';
import { cx } from '@/components/primitives';

type Mode = '3d' | '2d';
type Pt = [number, number];

/** 3D view: rotate the plan slightly, then tilt it back (vertical squash). */
const ROT = (-22 * Math.PI) / 180;
const TILT = 0.62;
const COS = Math.cos(ROT);
const SIN = Math.sin(ROT);
const SLAB = 18; // slab thickness in 3D (screen units)

function project([x, y]: Pt, mode: Mode): Pt {
  if (mode === '2d') return [x, y];
  return [x * COS - y * SIN, (x * SIN + y * COS) * TILT];
}

const toPath = (pts: Pt[]) => pts.map((p) => p.join(',')).join(' ');

function centroid(pts: Pt[]): Pt {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
}

export interface RoomStats {
  on: number;
  total: number;
  unreachable: number;
}

export function roomStats(s: HomeSnapshot, areaId: string): RoomStats {
  const lights = s.lights.filter((l) => l.areaId === areaId);
  const reachable = lights.filter((l) => availabilityOf(s, l.deviceId) === 'online');
  return { on: reachable.filter((l) => l.on).length, total: lights.length, unreachable: lights.length - reachable.length };
}

export function HomeMap({
  s,
  selected,
  onSelect,
  plan = floorPlan,
}: {
  s: HomeSnapshot;
  selected: string | null;
  onSelect: (areaId: string) => void;
  plan?: FloorPlan;
}) {
  const [mode, setMode] = useState<Mode>('3d');
  const [hover, setHover] = useState<string | null>(null);

  const geo = useMemo(() => {
    const outline = plan.outline.map((p) => project(p, mode));
    const all = [...outline, ...(mode === '3d' ? outline.map(([x, y]) => [x, y + SLAB] as Pt) : [])];
    const xs = all.map((p) => p[0]);
    const ys = all.map((p) => p[1]);
    const pad = 24;
    const minX = Math.min(...xs) - pad;
    const minY = Math.min(...ys) - pad;
    return {
      outline,
      viewBox: `${minX} ${minY} ${Math.max(...xs) - minX + pad} ${Math.max(...ys) - minY + pad}`,
      rooms: plan.rooms.map((r) => ({ ...r, pts: r.points.map((p) => project(p, mode)), center: project(r.label ?? centroid(r.points), mode) })),
      spaces: plan.spaces.map((sp) => ({ pts: sp.points.map((p) => project(p, mode)), label: sp.label, center: project(centroid(sp.points), mode) })),
    };
  }, [plan, mode]);

  const areaName = (id: string) => s.areas.find((a) => a.id === id)?.name ?? id;
  const onKey = (e: KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(id);
    }
  };

  return (
    <div className="relative">
      {/* 3D / 2D switch, like the SmartThings map */}
      <div className="mb-2 flex justify-end">
      <div role="radiogroup" aria-label="Map view" className="flex gap-1 rounded-full border border-rule bg-surface-2 p-1">
        {(
          [
            ['3d', Box, '3D'],
            ['2d', Square, '2D'],
          ] as const
        ).map(([m, Icon, label]) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => setMode(m)}
            className={cx(
              'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-label font-medium transition-colors',
              mode === m ? 'bg-fg text-bg' : 'text-muted hover:text-fg',
            )}
          >
            <Icon aria-hidden className="size-3.5" strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </div>
      </div>

      {/* Small screens: keep labels readable and scroll sideways, like zooming the SmartThings map. */}
      <div className="-mx-2 overflow-x-auto px-2 pb-1">
      <svg viewBox={geo.viewBox} className="block h-auto w-full min-w-[640px] select-none" role="group" aria-label={`${plan.name} map. Select a room to see its lights.`}>
        <defs>
          <filter id="room-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="10" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Slab edge (3D only) */}
        {mode === '3d' && (
          <polygon points={toPath(geo.outline.map(([x, y]) => [x, y + SLAB] as Pt))} fill="var(--rule-strong)" opacity="0.9" />
        )}
        {/* Floor */}
        <polygon points={toPath(geo.outline)} fill="var(--surface-2)" stroke="var(--rule-strong)" strokeWidth="5" strokeLinejoin="round" />

        {/* Non-interactive spaces */}
        {geo.spaces.map((sp, i) => (
          <g key={i}>
            <polygon points={toPath(sp.pts)} fill="var(--rule)" opacity="0.55" stroke="var(--rule-strong)" strokeWidth="3" />
            {sp.label && (
              <text x={sp.center[0]} y={sp.center[1] + 4} textAnchor="middle" fontSize="11" fill="var(--muted)" style={{ pointerEvents: 'none' }}>
                {sp.label}
              </text>
            )}
          </g>
        ))}

        {/* Rooms */}
        {geo.rooms.map((r) => {
          const st = roomStats(s, r.areaId);
          const lit = st.on > 0;
          const isSel = selected === r.areaId;
          const isHover = hover === r.areaId;
          const label = `${areaName(r.areaId)}${r.caption ? ` (${r.caption.toLowerCase()})` : ''}, ${st.total ? `${st.on} of ${st.total} lights on` : 'no lights'}${st.unreachable ? `, ${st.unreachable} unreachable` : ''}`;
          return (
            <g
              key={r.areaId}
              role="button"
              tabIndex={0}
              aria-pressed={isSel}
              aria-label={label}
              onClick={() => onSelect(r.areaId)}
              onKeyDown={(e) => onKey(e, r.areaId)}
              onPointerEnter={() => setHover(r.areaId)}
              onPointerLeave={() => setHover(null)}
              className="cursor-pointer outline-none [&:focus-visible>polygon]:stroke-[var(--accent)]"
            >
              {lit && <polygon points={toPath(r.pts)} fill="var(--lit, var(--accent-ink))" opacity="0.35" filter="url(#room-glow)" />}
              <polygon
                points={toPath(r.pts)}
                fill={lit ? 'var(--lit, var(--accent-ink))' : 'var(--surface)'}
                fillOpacity={lit ? undefined : isHover ? 0.85 : 1}
                stroke={isSel ? 'var(--accent-ink)' : 'var(--rule-strong)'}
                strokeWidth={isSel ? 5 : 3}
                strokeDasharray={r.detached && !isSel ? '8 6' : undefined}
                strokeLinejoin="round"
                style={{
                  transition: 'fill-opacity var(--dur-slow), fill var(--dur-slow), stroke var(--dur)',
                  fillOpacity: lit ? (isSel ? 'calc(var(--lit-opacity, 0.28) + 0.15)' : 'var(--lit-opacity, 0.28)') : undefined,
                }}
              />
              {r.caption && (
                <text x={r.center[0]} y={r.center[1] - 24} textAnchor="middle" fontSize="10" fontWeight={600} letterSpacing="0.08em" fill="var(--muted)" style={{ pointerEvents: 'none' }}>
                  {r.caption.toUpperCase()}
                </text>
              )}
              <text
                x={r.center[0]}
                y={r.center[1] - 4}
                textAnchor="middle"
                fontSize={mode === '3d' ? 15 : 14}
                fontWeight={600}
                fill="var(--fg)"
                style={{ pointerEvents: 'none' }}
              >
                {areaName(r.areaId)}
              </text>
              {st.total > 0 && (
                <text
                  x={r.center[0]}
                  y={r.center[1] + 14}
                  textAnchor="middle"
                  fontSize="12"
                  fill={lit ? 'var(--accent-ink)' : 'var(--muted)'}
                  fontWeight={500}
                  style={{ pointerEvents: 'none' }}
                >
                  {st.on}/{st.total} on
                </text>
              )}
              {st.unreachable > 0 && (
                <circle cx={r.center[0] + 34} cy={r.center[1] - 20} r="6" fill="var(--danger)" stroke="var(--surface)" strokeWidth="2">
                  <title>{st.unreachable} unreachable</title>
                </circle>
              )}
            </g>
          );
        })}
      </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-label text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-full bg-accent-ink shadow-[0_0_6px_var(--accent-ink)]" /> Lights on
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-full border border-rule-strong bg-surface" /> All off
        </span>
        <span className="inline-flex items-center gap-1.5">
          <AlertTriangle aria-hidden className="size-3 text-danger" strokeWidth={2} /> Unreachable light
        </span>
        <span className="ml-auto italic">
          {plan.name} · {plan.note}
        </span>
      </div>
    </div>
  );
}
