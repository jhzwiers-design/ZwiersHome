/**
 * Tap feedback for touch and mouse:
 *  - a soft ripple that spreads from the finger on buttons, links, chips and switches
 *  - a tiny haptic tick on devices that support it (Android; iOS Safari ignores it)
 * Everything is skipped when the device asks for reduced motion.
 */
const SELECTOR = 'button:not(:disabled), a[href], [role="radio"], [role="switch"], label:has(> input[type="radio"]), [role="button"]';

export function installTapFeedback(): void {
  if (typeof window === 'undefined') return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  document.addEventListener(
    'pointerdown',
    (e) => {
      if (reduced.matches || e.button !== 0) return;
      const target = (e.target as Element | null)?.closest<HTMLElement>(SELECTOR);
      if (!target || target.closest('[data-no-ripple]')) return;
      // SVG rooms on the map handle their own feedback.
      if (target instanceof SVGElement) return;

      const rect = target.getBoundingClientRect();
      const size = Math.hypot(rect.width, rect.height) * 2;
      if (getComputedStyle(target).position === 'static') target.style.position = 'relative';

      const clip = document.createElement('span');
      clip.className = 'zh-ripple-clip';
      const dot = document.createElement('span');
      dot.className = 'zh-ripple';
      dot.style.width = dot.style.height = `${size}px`;
      dot.style.left = `${e.clientX - rect.left - size / 2}px`;
      dot.style.top = `${e.clientY - rect.top - size / 2}px`;
      clip.appendChild(dot);
      target.appendChild(clip);
      window.setTimeout(() => clip.remove(), 650);

      const isToggle = target.getAttribute('role') === 'switch' || target.matches('button');
      if (isToggle && 'vibrate' in navigator) {
        try {
          navigator.vibrate(8);
        } catch {
          /* not supported */
        }
      }
    },
    { passive: true },
  );
}
