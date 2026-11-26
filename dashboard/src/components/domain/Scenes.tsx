/**
 * Scenes — one-tap groups of light changes (simulated in the prototype).
 *
 * Each scene shows an icon, a clear name and (optionally) what it does.
 * Tapping it: pending spinner → a green tick for a moment on success, or an
 * error toast on failure. Scenes change sample lights only for now.
 */
import { Check, DoorClosed, Film, House, Moon, Power, Sunset, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { cx, Spinner } from '@/components/primitives';
import type { Scene, SceneIcon } from '@/data/types';
import { useHome, usePendingKey } from '@/store/home';

const ICONS: Record<SceneIcon, LucideIcon> = { arrive: House, leave: DoorClosed, evening: Sunset, movie: Film, night: Moon, off: Power };

export function SceneButton({
  scene,
  disabled,
  showDescription,
  size = 'md',
}: {
  scene: Scene;
  disabled?: boolean;
  showDescription?: boolean;
  size?: 'md' | 'lg';
}) {
  const run = useHome((st) => st.run);
  const pending = usePendingKey(`scene:${scene.id}`);
  const [done, setDone] = useState(false);
  const Icon = ICONS[scene.icon];

  const activate = async () => {
    const ok = await run({ type: 'scene.activate', sceneId: scene.id }, { pending: 'Setting scene…', success: `${scene.name} set` });
    if (ok) {
      setDone(true);
      window.setTimeout(() => setDone(false), 1600);
    }
  };

  return (
    <button
      type="button"
      onClick={activate}
      disabled={disabled || !!pending}
      aria-busy={!!pending || undefined}
      aria-label={showDescription ? undefined : `${scene.name}: ${scene.description}`}
      className={cx(
        'group flex shrink-0 snap-start items-center gap-3 rounded-[18px] border text-left transition-[transform,background-color,border-color] duration-[var(--dur)] active:scale-[0.97] disabled:opacity-50',
        size === 'lg' ? 'min-h-16 w-[78%] px-4 py-3 sm:w-auto' : 'min-h-12 px-3.5 py-2',
        done ? 'border-positive/40 bg-positive-soft' : 'border-rule bg-surface-2 hover:border-rule-strong hover:bg-surface-3',
      )}
    >
      <span
        aria-hidden
        className={cx(
          'grid shrink-0 place-items-center rounded-full transition-colors duration-[var(--dur)]',
          size === 'lg' ? 'size-10' : 'size-8',
          done ? 'bg-positive text-[var(--surface)]' : 'bg-surface text-fg-2 group-hover:text-fg',
        )}
      >
        {pending ? <Spinner className="size-3.5" /> : done ? <Check className="size-4 animate-zh-done" strokeWidth={2.6} /> : <Icon className="size-4" strokeWidth={1.8} />}
      </span>
      <span className="min-w-0">
        <span className={cx('block font-medium text-fg', size === 'lg' ? 'text-lead' : 'text-body')}>{scene.name}</span>
        {showDescription && <span className="block text-label leading-snug text-muted">{scene.description}</span>}
      </span>
    </button>
  );
}
