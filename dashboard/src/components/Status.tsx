/**
 * StatusIndicator — the shared visual language for device state.
 *
 *   On           filled brass dot          switched on / active
 *   Online       filled neutral dot        reachable, nothing to report
 *   Off          hollow neutral ring       reachable, switched off
 *   Offline      filled brick dot          device can't be reached (a real problem)
 *   Unavailable  dashed ring, muted text   its integration can't report a state
 *
 * Shape and wording carry the meaning as well as colour, so it reads in
 * greyscale and for colour-blind users.
 */
import type { DisplayStatus } from '@/lib/selectors';
import { cx, Spinner } from './primitives';

const LABEL: Record<DisplayStatus, string> = {
  on: 'On',
  off: 'Off',
  online: 'Online',
  offline: 'Offline',
  unavailable: 'Unavailable',
};

export function StatusDot({ status, className }: { status: DisplayStatus; className?: string }) {
  return (
    <span
      aria-hidden
      className={cx(
        'inline-block size-2 shrink-0 rounded-full',
        status === 'on' && 'bg-accent',
        status === 'online' && 'bg-fg-2',
        status === 'off' && 'border border-muted',
        status === 'offline' && 'bg-danger',
        status === 'unavailable' && 'border border-dashed border-muted',
        className,
      )}
    />
  );
}

export function StatusIndicator({
  status,
  label,
  pending,
  className,
}: {
  status: DisplayStatus;
  /** Override the default text, e.g. "Heating" or "Offline since 3:10 PM". */
  label?: string;
  /** Show a pending state instead (command in flight). */
  pending?: string;
  className?: string;
}) {
  if (pending) {
    return (
      <span className={cx('inline-flex items-center gap-2 text-label text-accent', className)} role="status">
        <Spinner className="size-3" />
        {pending}
      </span>
    );
  }
  return (
    <span
      className={cx(
        'inline-flex items-center gap-2 text-label',
        status === 'on' && 'text-fg-2',
        (status === 'off' || status === 'online') && 'text-muted',
        status === 'offline' && 'text-danger',
        status === 'unavailable' && 'text-muted italic',
        className,
      )}
    >
      <StatusDot status={status} />
      {label ?? LABEL[status]}
    </span>
  );
}
