import { useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';

/**
 * Positions one shared "selection pill" under the active item of a list, so it
 * can glide from one destination to the next instead of blinking on and off.
 *
 *   const { style } = useSlidingIndicator(listRef, '[aria-current="page"]', route);
 *   <span className="nav-indicator" style={style} />
 *
 * - Measures the active element relative to the container (layout effect, so
 *   there's no flash), and again whenever the container resizes or rotates.
 * - The very first placement doesn't animate (no slide-in from the corner).
 * - With no active item, the pill fades out in place.
 */
export function useSlidingIndicator(container: RefObject<HTMLElement | null>, activeSelector: string, key: unknown) {
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const placed = useRef(false);
  const [animate, setAnimate] = useState(false);

  useLayoutEffect(() => {
    const el = container.current;
    if (!el) return;
    const measure = () => {
      const active = el.querySelector<HTMLElement>(activeSelector);
      if (!active) {
        setBox((b) => (b ? { ...b } : null));
        return;
      }
      const c = el.getBoundingClientRect();
      const a = active.getBoundingClientRect();
      setBox({ x: a.left - c.left, y: a.top - c.top, w: a.width, h: a.height });
    };
    measure();
    if (!placed.current) {
      placed.current = true;
      requestAnimationFrame(() => setAnimate(true));
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('orientationchange', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('orientationchange', measure);
    };
  }, [container, activeSelector, key]);

  const hasActive = !!container.current?.querySelector(activeSelector);
  const style: CSSProperties = box
    ? {
        width: box.w,
        height: box.h,
        transform: `translate(${box.x}px, ${box.y}px)`,
        opacity: hasActive ? 1 : 0,
        transition: animate
          ? 'transform 420ms var(--ease-spring), width 420ms var(--ease-spring), height 420ms var(--ease-spring), opacity 200ms var(--ease)'
          : 'none',
      }
    : { opacity: 0 };
  return { style };
}
