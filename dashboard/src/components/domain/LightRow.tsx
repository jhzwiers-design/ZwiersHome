/**
 * LightRow — one light, with only the controls it actually supports.
 *  - On/off always (when reachable)
 *  - Brightness slider only if the light dims
 *  - Colour temperature only if supported (behind a disclosure)
 * Offline and unavailable lights are shown, dimmed, with controls disabled.
 */
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { RangeSlider, Toggle } from '@/components/controls';
import { cx } from '@/components/primitives';
import { StatusDot, StatusIndicator } from '@/components/Status';
import type { Light } from '@/data/types';
import { useNow } from '@/hooks';
import { relativeTime } from '@/lib/format';
import { availabilityOf, lightStatus } from '@/lib/selectors';
import { useHome, usePendingKey } from '@/store/home';
import { usePreferences } from '@/store/preferences';

export function LightRow({ light, showArea }: { light: Light; showArea?: string }) {
  const snapshot = useHome((s) => s.snapshot)!;
  const run = useHome((s) => s.run);
  const pending = usePendingKey(`light:${light.id}`);
  const clock = usePreferences((p) => p.clock);
  const now = useNow(30_000);
  const [showCt, setShowCt] = useState(false);

  const areaName = snapshot.areas.find((a) => a.id === light.areaId)?.name ?? '';
  /** Unique, descriptive name for labels and messages: "Kitchen recessed". */
  const fullName = light.name.toLowerCase().startsWith(areaName.toLowerCase()) ? light.name : `${areaName} ${light.name.toLowerCase()}`;
  const availability = availabilityOf(snapshot, light.deviceId);
  const reachable = availability === 'online';
  const connected = snapshot.connection.status === 'connected';
  const status = lightStatus(snapshot, light);
  const device = snapshot.devices.find((d) => d.id === light.deviceId);
  const ct = light.capabilities.colorTemp;
  const controlsDisabled = !reachable || !connected;

  const sub = (() => {
    if (availability === 'offline') return `Offline · last seen ${relativeTime(device?.lastSeen ?? null, now, clock)}`;
    if (availability === 'unavailable') return `Unavailable · no state since ${relativeTime(device?.lastSeen ?? null, now, clock)}`;
    const parts: string[] = [];
    if (showArea) parts.push(showArea);
    if (!light.capabilities.brightness) parts.push('On/off only');
    return parts.join(' · ');
  })();

  const toggle = (on: boolean) =>
    run({ type: 'light.set', lightId: light.id, on }, { pending: on ? 'Turning on…' : 'Turning off…', success: `${fullName} ${on ? 'on' : 'off'}` });

  return (
    <div className={cx('@container border-b border-rule last:border-b-0', !reachable && 'text-muted')}>
      <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 py-3 @md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_auto]">
        <div className="flex min-w-0 items-center gap-3">
          <StatusDot status={status} />
          <div className="min-w-0">
            <p className={cx('truncate text-lead', reachable ? 'text-fg' : 'text-muted')}>{light.name}</p>
            {pending ? (
              <StatusIndicator status={status} pending={pending} />
            ) : (
              sub && <p className={cx('truncate text-label', availability === 'offline' ? 'text-danger' : 'text-muted', availability === 'unavailable' && 'italic')}>{sub}</p>
            )}
          </div>
        </div>

        {/* Brightness: second line on mobile, middle column on tablet+ */}
        <div className="col-span-2 row-start-2 flex items-center gap-3 @md:col-span-1 @md:row-start-auto">
          {light.capabilities.brightness ? (
            <RangeSlider
              className="flex-1"
              label={`${fullName} brightness`}
              muted={!light.on}
              value={light.brightness ?? 100}
              min={1}
              max={100}
              disabled={controlsDisabled}
              format={(v) => `${v}%`}
              onCommit={(v) =>
                run({ type: 'light.set', lightId: light.id, brightness: v }, { pending: 'Setting brightness…', success: `${fullName} at ${v}%` })
              }
            />
          ) : (
            <span aria-hidden className="hidden @md:inline" />
          )}
          {ct ? (
            <button
              type="button"
              onClick={() => setShowCt((v) => !v)}
              aria-expanded={showCt}
              aria-controls={`ct-${light.id}`}
              disabled={controlsDisabled}
              aria-label={`Colour temperature ${light.colorTempK} K, ${showCt ? 'hide' : 'show'} control`}
              className="num flex w-[4.75rem] shrink-0 items-center justify-end gap-1 whitespace-nowrap rounded-xs px-1 text-label text-muted hover:text-fg disabled:opacity-40"
            >
              {light.colorTempK} K
              <ChevronDown aria-hidden className={cx('size-3 transition-transform', showCt && 'rotate-180')} />
            </button>
          ) : (
            light.capabilities.brightness && <span aria-hidden className="hidden w-[4.75rem] shrink-0 @md:block" />
          )}
        </div>

        <div className="col-start-2 row-start-1 @md:col-start-auto @md:row-start-auto">
          <Toggle checked={light.on && reachable} onChange={toggle} label={fullName} disabled={controlsDisabled} pending={!!pending} />
        </div>
      </div>

      {ct && showCt && (
        <div id={`ct-${light.id}`} className="pb-3 pl-5 @md:grid @md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_auto] @md:gap-x-4 @md:pl-0">
          <span className="hidden self-center pl-5 text-label text-muted @md:block">Colour temperature</span>
          <RangeSlider
            label={`${fullName} colour temperature`}
            value={light.colorTempK ?? ct.minK}
            min={ct.minK}
            max={ct.maxK}
            step={100}
            track="warmth"
            disabled={controlsDisabled}
            format={(v) => `${v} K`}
            onCommit={(v) =>
              run({ type: 'light.set', lightId: light.id, colorTempK: v }, { pending: 'Setting colour…', success: `${fullName} at ${v} K` })
            }
          />
        </div>
      )}
    </div>
  );
}
