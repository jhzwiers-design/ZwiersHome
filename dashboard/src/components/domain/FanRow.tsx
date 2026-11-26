/**
 * FanRow — one fan, with only the controls its wall control supports:
 *  - On/off always (when reachable)
 *  - Low / Medium / High when the control has speeds
 * The fan icon turns while the fan is on (still under "reduce motion").
 */
import { Fan as FanIcon } from 'lucide-react';
import { Segmented, Toggle } from '@/components/controls';
import { cx } from '@/components/primitives';
import { StatusDot, StatusIndicator } from '@/components/Status';
import type { Fan, FanSpeed } from '@/data/types';
import { useNow } from '@/hooks';
import { relativeTime } from '@/lib/format';
import { availabilityOf } from '@/lib/selectors';
import { useHome, usePendingKey } from '@/store/home';
import { usePreferences } from '@/store/preferences';

const SPEED_LABEL: Record<FanSpeed, string> = { low: 'Low', medium: 'Medium', high: 'High' };
const SPIN: Record<FanSpeed | 'on', string> = { low: '2.4s', medium: '1.4s', high: '0.8s', on: '1.4s' };

export function FanRow({ fan }: { fan: Fan }) {
  const snapshot = useHome((s) => s.snapshot)!;
  const run = useHome((s) => s.run);
  const pending = usePendingKey(`fan:${fan.id}`);
  const clock = usePreferences((p) => p.clock);
  const now = useNow(30_000);

  const availability = availabilityOf(snapshot, fan.deviceId);
  const reachable = availability === 'online';
  const connected = snapshot.connection.status === 'connected';
  const disabled = !reachable || !connected;
  const device = snapshot.devices.find((d) => d.id === fan.deviceId);
  const status = !reachable ? (availability === 'offline' ? 'offline' : 'unavailable') : fan.on ? 'on' : 'off';

  const sub = (() => {
    if (availability === 'offline') return `Offline · last seen ${relativeTime(device?.lastSeen ?? null, now, clock)}`;
    if (availability === 'unavailable') return 'Unavailable';
    if (!fan.speeds.length) return fan.on ? 'On · speed control to confirm' : 'Off · on/off only for now';
    return fan.on && fan.speed ? `On · ${SPEED_LABEL[fan.speed]}` : 'Off';
  })();

  const toggle = (on: boolean) =>
    run({ type: 'fan.set', fanId: fan.id, on }, { pending: on ? 'Turning on…' : 'Turning off…', success: `${fan.name} ${on ? 'on' : 'off'}` });
  const setSpeed = (speed: FanSpeed) =>
    run({ type: 'fan.set', fanId: fan.id, speed }, { pending: 'Setting speed…', success: `${fan.name} on ${SPEED_LABEL[speed].toLowerCase()}` });

  return (
    <div className={cx('@container border-b border-rule last:border-b-0', !reachable && 'text-muted')}>
      <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 py-3 @md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_auto]">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className={cx(
              'grid size-8 shrink-0 place-items-center rounded-full transition-colors duration-[var(--dur)]',
              fan.on && reachable ? 'bg-accent-soft text-accent-ink' : 'bg-surface-2 text-muted',
            )}
          >
            <FanIcon
              className={cx('size-[18px]', fan.on && reachable && 'motion-safe:animate-[zh-spin_linear_infinite]')}
              style={{ animationDuration: SPIN[fan.speed ?? 'on'] }}
              strokeWidth={1.8}
            />
          </span>
          <div className="min-w-0">
            <p className={cx('truncate text-lead', reachable ? 'text-fg' : 'text-muted')}>{fan.name}</p>
            {pending ? (
              <StatusIndicator status={status} pending={pending} />
            ) : (
              <p className={cx('flex items-center gap-1.5 truncate text-label', availability === 'offline' ? 'text-danger' : 'text-muted')}>
                <StatusDot status={status} />
                {sub}
              </p>
            )}
          </div>
        </div>

        {/* Speed: second line on narrow cards, middle column on wide ones */}
        <div className="col-span-2 row-start-2 @md:col-span-1 @md:row-start-auto">
          {fan.speeds.length > 0 && (
            <Segmented<FanSpeed>
              label={`${fan.name} speed`}
              value={fan.on && fan.speed ? fan.speed : ('' as FanSpeed)}
              onChange={setSpeed}
              disabled={disabled}
              options={fan.speeds.map((sp) => ({ value: sp, label: SPEED_LABEL[sp] }))}
            />
          )}
        </div>

        <div className="col-start-2 row-start-1 @md:col-start-3">
          <Toggle checked={fan.on} onChange={toggle} disabled={disabled} pending={!!pending} label={fan.name} />
        </div>
      </div>
    </div>
  );
}
