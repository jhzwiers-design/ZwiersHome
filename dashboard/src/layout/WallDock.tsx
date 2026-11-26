/**
 * WallDock — the wall display's navigation: five large, labelled destinations
 * with a sliding selection pill. "Home" (the ambient Home display) is always
 * first and always one tap away.
 */
import { Bath, House, Lightbulb, ShieldCheck, Thermometer, type LucideIcon } from 'lucide-react';
import { useRef } from 'react';
import { cx } from '@/components/primitives';
import { useRoute } from '@/hooks';
import { useSlidingIndicator } from '@/hooks/useSlidingIndicator';

const ITEMS: { href: string; route: string; label: string; icon: LucideIcon }[] = [
  { href: '#/wall', route: 'wall', label: 'Home', icon: House },
  { href: '#/lighting', route: 'lighting', label: 'Lights', icon: Lightbulb },
  { href: '#/climate', route: 'climate', label: 'Climate', icon: Thermometer },
  { href: '#/pool', route: 'pool', label: 'Pool & Spa', icon: Bath },
  { href: '#/security', route: 'security', label: 'Security', icon: ShieldCheck },
];

export function WallDock() {
  const route = useRoute();
  const ref = useRef<HTMLUListElement>(null);
  const { style } = useSlidingIndicator(ref, '[aria-current="page"]', route);
  return (
    <nav aria-label="Wall display" className="flex justify-center">
      <ul ref={ref} className="tile relative flex items-center gap-1 rounded-full! p-1.5">
        <span aria-hidden className="pointer-events-none absolute top-0 left-0 rounded-full bg-accent shadow-[var(--accent-glow)]" style={style} />
        {ITEMS.map((it) => {
          const active = route === it.route;
          const Icon = it.icon;
          return (
            <li key={it.route} className="relative">
              <a
                href={it.href}
                aria-current={active ? 'page' : undefined}
                className={cx(
                  'flex min-h-[52px] items-center gap-2 rounded-full px-3 font-medium sm:px-5 transition-[color,transform] duration-[var(--dur)] active:scale-95',
                  active ? 'text-on-accent' : 'text-fg-2 hover:text-fg',
                )}
                style={{ fontSize: 'clamp(0.9rem, 1.9vmin, 1.1rem)' }}
              >
                <Icon aria-hidden className={cx('size-5 transition-transform duration-[420ms] ease-[var(--ease-spring)]', active && 'scale-110')} strokeWidth={active ? 2.1 : 1.7} />
                <span className="max-sm:sr-only">{it.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
