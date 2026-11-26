/**
 * Security building blocks: the camera view and the event list.
 *
 * CameraView never shows fake video. In the prototype it shows a clearly
 * labelled placeholder and demonstrates the loading → result flow of
 * requesting a live view.
 */
import { BellRing, Footprints, Play, VideoOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cameraPhotoLoader } from '@/lib/cameraPhotos';
import { Button, cx, SampleTag, Spinner } from '@/components/primitives';
import type { Camera, SecurityEvent } from '@/data/types';
import { useNow } from '@/hooks';
import { dayLabel, formatTime, relativeTime } from '@/lib/format';
import { useHome } from '@/store/home';
import { usePreferences } from '@/store/preferences';

export function CameraView({ camera, compact }: { camera: Camera; compact?: boolean }) {
  const clock = usePreferences((p) => p.clock);
  const now = useNow(1000);
  const [state, setState] = useState<'idle' | 'starting' | 'unavailable'>('idle');
  const isSample = useHome((s) => s.snapshot?.source.kind === 'sample');
  const [photo, setPhoto] = useState<string | null>(null);
  useEffect(() => {
    const load = cameraPhotoLoader(camera.id);
    let alive = true;
    if (load) load().then((url) => alive && setPhoto(url)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [camera.id]);
  const stand = photo ? 'Sample photo' : 'Illustration';

  const start = () => {
    setState('starting');
    setTimeout(() => setState('unavailable'), 1600);
  };

  return (
    <figure className="relative overflow-hidden rounded-[18px] border border-rule bg-[var(--video-bg)]" aria-label={isSample ? `${camera.name}: camera placeholder, no video connected yet` : camera.name}>
      {/* Stand-in view: a sample photo of what the camera faces (private builds), or a line drawing. */}
      {photo ? (
        <div className="relative aspect-video w-full" aria-hidden>
          <img src={photo} alt="" className="absolute inset-0 size-full object-cover" decoding="async" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgb(0_0_0/0.45),transparent_30%,transparent_70%,rgb(0_0_0/0.5))]" />
        </div>
      ) : (
      <svg viewBox="0 0 320 180" className="block aspect-video w-full" aria-hidden>
        <defs>
          <radialGradient id={`cam-glow-${camera.id}`} cx="50%" cy="38%" r="75%">
            <stop offset="0%" stopColor="var(--video-line-2)" />
            <stop offset="100%" stopColor="var(--video-frame)" />
          </radialGradient>
        </defs>
        <rect width="320" height="180" fill={`url(#cam-glow-${camera.id})`} />
        <g fill="none" stroke="var(--video-sketch)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <Scene scene={camera.scene} />
        </g>
      </svg>
      )}

      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--video-bg)]/70 px-3 py-1 text-label text-[var(--video-fg)] backdrop-blur">
          <span className="size-1.5 rounded-full bg-[var(--video-muted)]" aria-hidden />
          {camera.name}
          {isSample && !compact && <span className="text-[var(--video-muted)]">· {stand}, not live</span>}
        </span>
        {!compact && <span className="num rounded-full bg-[var(--video-bg)]/70 px-3 py-1 text-label text-[var(--video-muted)] backdrop-blur">{formatTime(now, clock)}</span>}
      </div>

      <div className="absolute inset-0 grid place-items-center p-4 text-center">
        {state === 'idle' && compact && (
          <button
            type="button"
            onClick={start}
            aria-label={`Try live view: ${camera.name}`}
            className="absolute bottom-2 left-2 grid size-11 place-items-center rounded-full bg-accent-solid text-on-accent shadow-[var(--accent-glow)] transition-transform active:scale-90"
          >
            <Play aria-hidden className="size-4" strokeWidth={2} />
          </button>
        )}
        {state === 'idle' && !compact && (
          <Button variant="solid" size={compact ? 'sm' : 'md'} icon={<Play className="size-4" strokeWidth={1.75} />} onClick={start}>
            {isSample ? 'Try live view' : 'Start live view'}
          </Button>
        )}
        {state === 'starting' && (
          <span className="flex items-center gap-2 text-body text-[var(--video-fg)]" role="status">
            <Spinner /> Requesting stream…
          </span>
        )}
        {state === 'unavailable' && (
          <div className="max-w-xs text-[var(--video-fg)]" role="status">
            <VideoOff aria-hidden className="mx-auto mb-2 size-5 text-[var(--video-muted)]" strokeWidth={1.5} />
            <p className="text-body">No video in the prototype.</p>
            {!compact && (
              <p className="mt-1 text-label text-[var(--video-muted)]">Live view connects through Home Assistant's Ring integration (WebRTC) in a later milestone.</p>
            )}
            <button type="button" className="mt-3 text-label text-[var(--video-accent)] underline-offset-4 hover:underline" onClick={() => setState('idle')}>
              Close
            </button>
          </div>
        )}
      </div>

      {isSample && (
        <div className="absolute right-3 bottom-3">
          <SampleTag className="border-[var(--video-line-2)] text-[var(--video-muted)]">{stand}</SampleTag>
        </div>
      )}
    </figure>
  );
}

export function EventIcon({ kind, className }: { kind: SecurityEvent['kind']; className?: string }) {
  const Icon = kind === 'ding' ? BellRing : Footprints;
  return <Icon aria-hidden strokeWidth={1.5} className={cx('size-4 shrink-0', kind === 'ding' ? 'text-accent-ink' : 'text-muted', className)} />;
}

export function EventList({ events, cameras, limit, groupByDay = true }: { events: SecurityEvent[]; cameras: Camera[]; limit?: number; groupByDay?: boolean }) {
  const clock = usePreferences((p) => p.clock);
  const now = useNow(30_000);
  const list = [...events].sort((a, b) => b.at - a.at).slice(0, limit ?? events.length);

  if (list.length === 0) return <p className="py-3 text-body text-muted">No events.</p>;

  const groups: { label: string; items: SecurityEvent[] }[] = [];
  for (const e of list) {
    const label = groupByDay ? dayLabel(e.at, now) : '';
    const g = groups[groups.length - 1];
    if (g && g.label === label) g.items.push(e);
    else groups.push({ label, items: [e] });
  }

  return (
    <div>
      {groups.map((g) => (
        <div key={g.label || 'all'}>
          {groupByDay && <p className="caps pt-3 pb-1 text-muted">{g.label}</p>}
          <ul>
            {g.items.map((e) => {
              const cam = cameras.find((c) => c.id === e.cameraId);
              return (
                <li key={e.id} className="flex items-center gap-3 border-b border-rule py-2.5 last:border-b-0">
                  <EventIcon kind={e.kind} />
                  <span className="min-w-0 flex-1 truncate text-body text-fg">
                    {e.kind === 'ding' ? 'Doorbell pressed' : 'Motion detected'}
                    <span className="text-muted"> · {cam?.name}</span>
                  </span>
                  <span className="num shrink-0 text-label text-muted" title={new Date(e.at).toLocaleString()}>
                    {now - e.at < 3_600_000 ? relativeTime(e.at, now, clock) : formatTime(e.at, clock)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

/**
 * Line-drawing stand-ins for each camera's view, drawn from the camera sketch
 * on the floor plan. They show what the camera faces, not real footage.
 */
function Scene({ scene }: { scene: Camera['scene'] }) {
  const hi = 'var(--video-sketch-2)';
  switch (scene) {
    case 'front-door': // doorbell looking out over the front porch and walk
      return (
        <>
          <path d="M0 96 L320 96" />
          <path d="M34 0 L34 180 M54 0 L54 180 M266 0 L266 180 M286 0 L286 180" />
          <path d="M0 132 L320 132 M20 146 L300 146 M8 160 L312 160" />
          <path d="M128 180 L150 96 M192 180 L170 96" stroke={hi} />
          <circle cx="96" cy="78" r="16" /><circle cx="228" cy="74" r="20" />
          <path d="M96 94 L96 96 M228 94 L228 96" />
        </>
      );
    case 'man-door': // doorbell on the garage's east wall looking across the side yard
      return (
        <>
          <path d="M0 0 L74 34 L74 150 L0 180" />
          <path d="M18 40 L18 160 M46 44 L46 158" />
          <path d="M74 92 L320 86" />
          <path d="M74 150 L320 180 M74 150 L240 90" stroke={hi} />
          <path d="M150 88 L150 70 L300 64 L300 86" />
          <path d="M180 87 L180 69 M210 86 L210 68 M240 86 L240 67 M270 86 L270 65" />
        </>
      );
    case 'backyard': // floodlight high on the rec room corner, over the back porch
      return (
        <>
          <path d="M0 18 L320 40" />
          <path d="M40 24 L40 118 M120 30 L120 112 M200 35 L200 106 M280 39 L280 100" />
          <path d="M0 128 L320 96" stroke={hi} />
          <path d="M0 74 L320 68" />
          <ellipse cx="150" cy="150" rx="26" ry="9" />
          <path d="M124 150 L124 166 M176 150 L176 166" />
          <rect x="196" y="140" width="40" height="14" rx="4" />
        </>
      );
    case 'front-yard': // floodlight on the garage's front corner looking south
      return (
        <>
          <path d="M0 70 L320 70" />
          <path d="M40 180 L140 70 M290 180 L190 70" stroke={hi} />
          <path d="M0 64 L320 64" strokeDasharray="6 6" />
          <path d="M86 128 L96 128 M110 108 L118 108" />
          <path d="M262 98 L262 70 M256 70 L268 70 L268 62 L256 62 Z" />
          <circle cx="40" cy="52" r="14" /><path d="M40 66 L40 70" />
        </>
      );
    default:
      return (
        <>
          <path d="M0 132 L320 120" />
          <path d="M96 180 L132 84 L188 84 L224 180" />
          <rect x="140" y="40" width="40" height="70" stroke={hi} />
        </>
      );
  }
}
