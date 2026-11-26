/**
 * Security building blocks: the camera view and the event list.
 *
 * CameraView never shows fake video. In the prototype it shows a clearly
 * labelled placeholder and demonstrates the loading → result flow of
 * requesting a live view.
 */
import { BellRing, Footprints, Play, VideoOff } from 'lucide-react';
import { useState } from 'react';
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

  const start = () => {
    setState('starting');
    setTimeout(() => setState('unavailable'), 1600);
  };

  return (
    <figure className="relative overflow-hidden rounded-md border border-rule bg-[var(--video-bg)]">
      {/* Neutral placeholder frame: an abstract porch outline, not a fake photo. */}
      <svg viewBox="0 0 320 180" className="block aspect-video w-full" aria-hidden>
        <defs>
          <radialGradient id="cam-glow" cx="50%" cy="38%" r="75%">
            <stop offset="0%" stopColor="var(--video-line-2)" />
            <stop offset="100%" stopColor="var(--video-frame)" />
          </radialGradient>
        </defs>
        <rect width="320" height="180" fill="url(#cam-glow)" />
        <path d="M0 132 L320 120" stroke="var(--video-line)" strokeWidth="1" />
        <path d="M96 180 L132 84 L188 84 L224 180" fill="none" stroke="var(--video-line)" strokeWidth="1" />
        <rect x="140" y="40" width="40" height="70" fill="none" stroke="var(--video-line-2)" strokeWidth="1" />
        <circle cx="160" cy="75" r="1.5" fill="var(--video-line-2)" />
      </svg>

      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--video-bg)]/70 px-3 py-1 text-label text-[var(--video-fg)] backdrop-blur">
          <span className="size-1.5 rounded-full bg-[var(--video-muted)]" aria-hidden />
          {camera.name}
        </span>
        <span className="num rounded-full bg-[var(--video-bg)]/70 px-3 py-1 text-label text-[var(--video-muted)] backdrop-blur">{formatTime(now, clock)}</span>
      </div>

      <div className="absolute inset-0 grid place-items-center p-4 text-center">
        {state === 'idle' && (
          <Button variant="solid" size={compact ? 'sm' : 'md'} icon={<Play className="size-4" strokeWidth={1.75} />} onClick={start}>
            Start live view
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
          <SampleTag className="border-[var(--video-line-2)] text-[var(--video-muted)]">Placeholder</SampleTag>
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
    const g = groups.at(-1);
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
