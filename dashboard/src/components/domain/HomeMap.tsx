/**
 * HomeMap — interactive floor plan (isometric 3D or flat 2D) with two layers:
 *
 *   Lights   rooms glow warm when their lights are on; cameras are quiet.
 *   Cameras  rooms go neutral; each camera shows its field of view as a soft
 *            gradient cone, its name, and a gentle pulse after recent motion.
 *
 * Rooms come from config/floorplan.ts and are linked to Home Assistant Areas.
 * Click (or Enter/Space) a room or a camera to select its area.
 * Projection is done in JS so labels stay upright in both views.
 */
import { AlertTriangle, BellRing, Box, Lightbulb, Square, Video, VideoOff } from 'lucide-react';
import { useMemo, useState, type KeyboardEvent } from 'react';
import { floorPlan, type FloorPlan } from '@/config/floorplan';
import type { HomeSnapshot } from '@/data/types';
import { useNow } from '@/hooks';
import { availabilityOf } from '@/lib/selectors';
import { cx } from '@/components/primitives';

type Mode = '3d' | '2d';
export type MapLayer = 'lights' | 'cameras';
type Pt = [number, number];

/** 3D view: rotate the plan slightly, then tilt it back (vertical squash). */
const ROT = (-22 * Math.PI) / 180;
const TILT = 0.62;
const COS = Math.cos(ROT);
const SIN = Math.sin(ROT);
const SLAB = 18; // slab thickness in 3D (screen units)

/** Field of view drawn on the map (half-angle, degrees) and reach (plan units). */
const FOV = { doorbell: 50, spotlight: 55, planned: 45 } as const;
const REACH = 112;
const RECENT_MOTION_MS = 60 * 60_000;

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

function Toggle<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: readonly (readonly [T, typeof Box, string])[] }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-full border border-rule bg-surface-2 p-1">
      {options.map(([v, Icon, text]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={cx(
            'inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-label font-medium transition-colors duration-[var(--dur)]',
            value === v ? 'bg-fg text-bg' : 'text-muted hover:text-fg',
          )}
        >
          <Icon aria-hidden className="size-3.5" strokeWidth={1.9} />
          {text}
        </button>
      ))}
    </div>
  );
}

export function HomeMap({
  s,
  selected,
  onSelect,
  plan = floorPlan,
  defaultLayer = 'lights',
}: {
  s: HomeSnapshot;
  selected: string | null;
  onSelect: (areaId: string) => void;
  plan?: FloorPlan;
  defaultLayer?: MapLayer;
}) {
  const [mode, setMode] = useState<Mode>('3d');
  const [layer, setLayer] = useState<MapLayer>(defaultLayer);
  const [hover, setHover] = useState<string | null>(null);
  const now = useNow(30_000);
  const camLayer = layer === 'cameras';

  const geo = useMemo(() => {
    const outline = plan.outline.map((p) => project(p, mode));
    const rooms = plan.rooms.map((r) => ({ ...r, pts: r.points.map((p) => project(p, mode)), center: project(r.label ?? centroid(r.points), mode) }));
    const cameras = plan.cameras.map((c) => {
      const kind = c.planned ? 'planned' : (s.security.cameras.find((x) => x.id === c.cameraId)?.kind ?? 'spotlight');
      const half = FOV[kind];
      const wedge: Pt[] = [c.at];
      for (let d = -half; d <= half + 0.01; d += half / 5) {
        const a = ((c.angle + d) * Math.PI) / 180;
        wedge.push([c.at[0] + Math.cos(a) * REACH, c.at[1] + Math.sin(a) * REACH]);
      }
      // Name label sits behind the camera (opposite its view) so it never covers the cone.
      const back = ((c.angle + 180) * Math.PI) / 180;
      const labelAt: Pt = [c.at[0] + Math.cos(back) * 34, c.at[1] + Math.sin(back) * 34];
      return { ...c, pt: project(c.at, mode), cone: wedge.map((p) => project(p, mode)), labelPt: project(labelAt, mode) };
    });
    const grounds = (plan.grounds ?? []).map((g) => ({ ...g, pts: g.points.map((p) => project(p, mode)), center: project(centroid(g.points), mode) }));
    // Bounds include rooms, grounds and camera cones outside the house so nothing is clipped.
    const all = [
      ...grounds.flatMap((g) => g.pts),
      ...outline,
      ...(mode === '3d' ? outline.map(([x, y]) => [x, y + SLAB] as Pt) : []),
      ...rooms.flatMap((r) => r.pts),
      ...cameras.flatMap((c) => c.cone),
    ];
    const xs = all.map((p) => p[0]);
    const ys = all.map((p) => p[1]);
    const pad = 24;
    const minX = Math.min(...xs) - pad;
    const minY = Math.min(...ys) - pad;
    return {
      outline,
      viewBox: `${minX} ${minY} ${Math.max(...xs) - minX + pad} ${Math.max(...ys) - minY + pad}`,
      rooms,
      spaces: plan.spaces.map((sp) => ({ pts: sp.points.map((p) => project(p, mode)), label: sp.label, center: project(centroid(sp.points), mode) })),
      cameras,
      grounds,
    };
  }, [plan, mode, s.security.cameras]);

  const areaName = (id: string) => s.areas.find((a) => a.id === id)?.name ?? id;
  const onKey = (e: KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(id);
    }
  };
  const lastMotion = (cameraId: string) => Math.max(0, ...s.security.events.filter((e) => e.cameraId === cameraId).map((e) => e.at));

  return (
    <div className="relative">
      <div className="mb-2 flex flex-wrap items-center justify-end gap-2">
        <Toggle<MapLayer>
          label="Map layer"
          value={layer}
          onChange={setLayer}
          options={[
            ['lights', Lightbulb, 'Lights'],
            ['cameras', Video, 'Cameras'],
          ]}
        />
        <Toggle<Mode>
          label="Map view"
          value={mode}
          onChange={setMode}
          options={[
            ['3d', Box, '3D'],
            ['2d', Square, '2D'],
          ]}
        />
      </div>

      {/* Small screens: keep labels readable and scroll sideways, like zooming the SmartThings map. */}
      <div className="-mx-2 overflow-x-auto px-2 pb-1">
        <svg
          viewBox={geo.viewBox}
          className="block h-auto w-full min-w-[640px] select-none"
          role="group"
          aria-label={`${plan.name} map, ${camLayer ? 'cameras' : 'lights'} layer. Select a room or camera.`}
        >
          <defs>
            <filter id="room-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="12" />
            </filter>
            {geo.cameras.map((c) => (
              <radialGradient key={c.cameraId} id={`cone-${c.cameraId}`} gradientUnits="userSpaceOnUse" cx={c.pt[0]} cy={c.pt[1]} r={REACH}>
                <stop offset="0%" stopColor="var(--map-cam)" stopOpacity={camLayer ? 0.55 : 0.28} />
                <stop offset="100%" stopColor="var(--map-cam)" stopOpacity={0} />
              </radialGradient>
            ))}
          </defs>

          {/* Paving (driveway) sits under everything */}
          {geo.grounds
            .filter((g) => g.kind === 'paving')
            .map((g, i) => (
              <g key={`pave-${i}`} style={{ pointerEvents: 'none' }}>
                <polygon points={toPath(g.pts)} fill="var(--map-paving)" />
                {g.label && (
                  <text x={g.center[0]} y={g.center[1]} textAnchor="middle" fontSize="11" fill="var(--map-sub)">
                    {g.label}
                  </text>
                )}
              </g>
            ))}

          {/* Slab edge (3D only) and floor */}
          {mode === '3d' && <polygon points={toPath(geo.outline.map(([x, y]) => [x, y + SLAB] as Pt))} fill="var(--map-wall)" />}
          <polygon points={toPath(geo.outline)} fill="var(--map-floor)" stroke="var(--map-wall)" strokeWidth="5" strokeLinejoin="round" />

          {/* Non-interactive spaces */}
          {geo.spaces.map((sp, i) => (
            <g key={i} style={{ pointerEvents: 'none' }}>
              <polygon points={toPath(sp.pts)} fill="var(--map-space)" stroke="var(--map-wall)" strokeWidth="2.5" />
              {sp.label && (
                <text x={sp.center[0]} y={sp.center[1] + 4} textAnchor="middle" fontSize="11" fill="var(--map-sub)">
                  {sp.label}
                </text>
              )}
            </g>
          ))}

          {/* Rooms */}
          {geo.rooms.map((r) => {
            const st = roomStats(s, r.areaId);
            const lit = !camLayer && st.on > 0;
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
                {lit && <polygon points={toPath(r.pts)} fill="var(--map-lit)" opacity="0.45" filter="url(#room-glow)" style={{ pointerEvents: 'none' }} />}
                <polygon points={toPath(r.pts)} fill={isHover ? 'var(--map-room-hover)' : 'var(--map-room)'} style={{ transition: 'fill var(--dur)' }} />
                <polygon
                  points={toPath(r.pts)}
                  fill="var(--map-lit)"
                  stroke={isSel ? 'var(--accent-ink)' : 'var(--map-wall)'}
                  strokeWidth={isSel ? 5 : 2.5}
                  strokeDasharray={r.detached && !isSel ? '8 6' : undefined}
                  strokeLinejoin="round"
                  style={{
                    fillOpacity: lit ? (isSel ? 'calc(var(--map-lit-opacity) + 0.12)' : 'var(--map-lit-opacity)') : 0,
                    transition: 'fill-opacity var(--dur-slow), stroke var(--dur), stroke-width var(--dur)',
                  }}
                />
                {r.caption && (
                  <text x={r.center[0]} y={r.center[1] - 24} textAnchor="middle" fontSize="10" fontWeight={600} letterSpacing="0.08em" fill="var(--map-sub)" style={{ pointerEvents: 'none' }}>
                    {r.caption.toUpperCase()}
                  </text>
                )}
                <text x={r.center[0]} y={r.center[1] - 4} textAnchor="middle" fontSize={mode === '3d' ? 15 : 14} fontWeight={600} fill="var(--map-label)" style={{ pointerEvents: 'none' }}>
                  {areaName(r.areaId)}
                </text>
                {!camLayer && st.total > 0 && (
                  <text x={r.center[0]} y={r.center[1] + 14} textAnchor="middle" fontSize="12" fontWeight={500} fill="var(--map-sub)" style={{ pointerEvents: 'none' }}>
                    {st.on}/{st.total} on
                  </text>
                )}
                {!camLayer && st.unreachable > 0 && (
                  <circle cx={r.center[0] + 34} cy={r.center[1] - 20} r="6" fill="var(--danger)" stroke="var(--map-room)" strokeWidth="2">
                    <title>{st.unreachable} unreachable</title>
                  </circle>
                )}
              </g>
            );
          })}

          {/* Pool, spa and outbuildings: context only, drawn over the deck */}
          {geo.grounds
            .filter((g) => g.kind !== 'paving')
            .map((g, i) => (
              <g key={`ground-${i}`} style={{ pointerEvents: 'none' }}>
                {g.kind === 'building' && mode === '3d' && <polygon points={toPath(g.pts.map(([x, y]) => [x, y + SLAB * 0.7] as Pt))} fill="var(--map-wall)" />}
                <polygon
                  points={toPath(g.pts)}
                  fill={g.kind === 'water' ? 'var(--map-water)' : 'var(--map-space)'}
                  fillOpacity={g.kind === 'water' ? 0.55 : 1}
                  stroke={g.kind === 'water' ? 'var(--map-water)' : 'var(--map-wall)'}
                  strokeWidth={g.kind === 'water' ? 2 : 2.5}
                  strokeLinejoin="round"
                />
                {g.label && (
                  <text x={g.center[0]} y={g.center[1] + 4} textAnchor="middle" fontSize="11" fontWeight={g.kind === 'water' ? 600 : 400} fill={g.kind === 'water' ? 'var(--map-label)' : 'var(--map-sub)'}>
                    {g.label}
                  </text>
                )}
              </g>
            ))}

          {/* Field-of-view cones under all markers */}
          {geo.cameras.map((c) => {
            const isSel = selected === (c.planned?.areaId ?? s.security.cameras.find((x) => x.id === c.cameraId)?.areaId);
            return c.planned ? (
              <polygon
                key={`cone-${c.cameraId}`}
                points={toPath(c.cone)}
                fill={camLayer ? `url(#cone-${c.cameraId})` : 'none'}
                fillOpacity={0.5}
                stroke="var(--map-cam)"
                strokeOpacity={0.55}
                strokeWidth={1.5}
                strokeDasharray="3 5"
                style={{ pointerEvents: 'none' }}
              />
            ) : (
              <polygon
                key={`cone-${c.cameraId}`}
                points={toPath(c.cone)}
                fill={`url(#cone-${c.cameraId})`}
                opacity={isSel ? 1 : camLayer ? 0.85 : 0.6}
                style={{ pointerEvents: 'none', transition: 'opacity var(--dur)' }}
              />
            );
          })}

          {/* Camera markers. Selecting one opens its area (camera preview first). */}
          {geo.cameras.map((c) => {
            const planned = c.planned;
            const cam = planned ? undefined : s.security.cameras.find((x) => x.id === c.cameraId);
            if (!planned && !cam) return null;
            const areaId = planned ? planned.areaId : cam!.areaId;
            const name = planned ? planned.name : cam!.name;
            const online = !!cam && s.devices.find((d) => d.id === cam.deviceId)?.availability === 'online';
            const recent = !!cam && online && now - lastMotion(cam.id) < RECENT_MOTION_MS;
            const isSel = selected === areaId;
            const Icon = planned ? Video : !online ? VideoOff : cam!.kind === 'doorbell' ? BellRing : Video;
            const r = camLayer ? 16 : 13;
            return (
              <g
                key={c.cameraId}
                role="button"
                tabIndex={0}
                aria-pressed={isSel}
                aria-label={
                  planned
                    ? `${name} camera, planned, not installed yet`
                    : `${name} ${cam!.kind === 'doorbell' ? 'doorbell camera' : 'camera'}${online ? (recent ? ', motion in the last hour' : '') : ', offline'}. Show its view.`
                }
                onClick={() => onSelect(areaId)}
                onKeyDown={(e) => onKey(e, areaId)}
                className="cursor-pointer outline-none [&:focus-visible>.cam-dot]:stroke-[var(--accent)]"
              >
                {recent && <circle className="map-ping" cx={c.pt[0]} cy={c.pt[1]} r={r} fill="var(--map-cam)" style={{ pointerEvents: 'none' }} />}
                {isSel && <circle cx={c.pt[0]} cy={c.pt[1]} r={r + 6} fill="none" stroke="var(--accent-ink)" strokeWidth={3} />}
                <circle
                  className="cam-dot"
                  cx={c.pt[0]}
                  cy={c.pt[1]}
                  r={r}
                  fill={planned ? 'var(--map-room)' : online ? 'var(--map-cam)' : 'var(--map-sub)'}
                  stroke={planned ? 'var(--map-cam)' : 'var(--map-room)'}
                  strokeWidth={2.5}
                  strokeDasharray={planned ? '4 3' : undefined}
                  style={{ transition: 'r var(--dur)' }}
                />
                <Icon
                  x={c.pt[0] - r * 0.55}
                  y={c.pt[1] - r * 0.55}
                  width={r * 1.1}
                  height={r * 1.1}
                  color={planned ? 'var(--map-cam)' : 'var(--map-cam-ink)'}
                  strokeWidth={2.2}
                  aria-hidden
                />
                {camLayer && (
                  <g style={{ pointerEvents: 'none' }}>
                    <rect
                      x={c.labelPt[0] - (name.length * 3.6 + 10)}
                      y={c.labelPt[1] - 10}
                      width={name.length * 7.2 + 20}
                      height={20}
                      rx={10}
                      fill="var(--map-room)"
                      stroke="var(--map-wall)"
                      strokeWidth={1}
                    />
                    <text x={c.labelPt[0]} y={c.labelPt[1] + 4} textAnchor="middle" fontSize="11.5" fontWeight={600} fill="var(--map-label)">
                      {name}
                      {planned ? ' · planned' : ''}
                    </text>
                  </g>
                )}
                <title>{planned ? `${name} camera (planned)` : name}</title>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-label text-muted">
        {camLayer ? (
          <>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-full bg-[var(--map-cam)]" /> Camera, tap for its view
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className="size-3 rounded-full bg-[var(--map-cam)] opacity-40 ring-4 ring-[var(--map-cam)]/20" /> Motion in the last hour
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-full border border-dashed border-[var(--map-cam)]" /> Planned
            </span>
          </>
        ) : (
          <>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-full bg-[var(--map-lit)] shadow-[0_0_8px_var(--map-lit)]" /> Lights on
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-full border border-[var(--map-wall)] bg-[var(--map-room)]" /> All off
            </span>
            <span className="inline-flex items-center gap-1.5">
              <AlertTriangle aria-hidden className="size-3 text-danger" strokeWidth={2} /> Unreachable light
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Video aria-hidden className="size-3.5 text-[var(--map-cam)]" strokeWidth={2} /> Camera
            </span>
          </>
        )}
        <span className="ml-auto italic">
          {plan.name} · {plan.note}
        </span>
      </div>
    </div>
  );
}
