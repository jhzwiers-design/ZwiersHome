/**
 * Interactive controls. Built on Radix primitives (keyboard + screen reader
 * support) or native inputs, styled with tokens only.
 *
 *  Toggle      on/off switch with pending state
 *  RangeSlider brightness / colour temperature / speed; commits on release
 *  Stepper     − value + for setpoints
 *  Segmented   single choice (native radios → arrow-key navigation for free)
 */
import * as RadixSwitch from '@radix-ui/react-switch';
import * as RadixSlider from '@radix-ui/react-slider';
import { Minus, Plus } from 'lucide-react';
import { useEffect, useId, useState, type ReactNode } from 'react';
import { cx, Spinner } from './primitives';

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
  pending,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Accessible name, e.g. "Kitchen recessed". */
  label: string;
  disabled?: boolean;
  pending?: boolean;
  className?: string;
}) {
  return (
    <span className={cx('inline-flex items-center gap-2', className)}>
      {pending && <Spinner className="size-3 text-accent-ink" label="Sending" />}
      <RadixSwitch.Root
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled || pending}
        aria-label={label}
        className={cx(
          'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-all duration-[var(--dur)]',
          'disabled:cursor-not-allowed disabled:opacity-40',
          checked ? 'border-accent-ink bg-accent shadow-[var(--accent-glow)]' : 'border-[var(--switch-off-border)] bg-[var(--switch-off)]',
        )}
      >
        <RadixSwitch.Thumb
          className={cx(
            'block size-[22px] rounded-full shadow-sm transition-[transform,background-color] duration-[260ms] ease-[var(--ease-spring)]',
            checked ? 'translate-x-[22px] bg-on-accent' : 'translate-x-[2px] bg-[var(--switch-thumb-off)]',
          )}
        />
      </RadixSwitch.Root>
    </span>
  );
}

export function RangeSlider({
  value,
  onCommit,
  min,
  max,
  step = 1,
  label,
  format = (v) => String(v),
  disabled,
  track = 'accent',
  className,
  showValue = true,
  muted,
}: {
  value: number;
  /**
   * Called once when the user releases the thumb (or finishes keyboard input).
   * If it returns a promise, the slider holds the new position until it settles,
   * then shows whatever the real value is (so a failed command snaps back).
   */
  onCommit: (v: number) => unknown;
  min: number;
  max: number;
  step?: number;
  label: string;
  format?: (v: number) => string;
  disabled?: boolean;
  /** "warmth" shows a warm→cool gradient for colour temperature. */
  track?: 'accent' | 'warmth';
  className?: string;
  showValue?: boolean;
  /** Show the filled range in a neutral tone (e.g. the light is off). */
  muted?: boolean;
}) {
  const [local, setLocal] = useState(value);
  const [dragging, setDragging] = useState(false);
  const [holding, setHolding] = useState(false);
  useEffect(() => {
    if (!dragging && !holding) setLocal(value);
  }, [value, dragging, holding]);

  return (
    <div className={cx('flex items-center gap-3', className)}>
      <RadixSlider.Root
        value={[local]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={([v]) => {
          setDragging(true);
          setLocal(v ?? local);
        }}
        onValueCommit={([v]) => {
          setDragging(false);
          if (v === undefined || v === value) return;
          const result = onCommit(v);
          if (result instanceof Promise) {
            setHolding(true);
            void result.finally(() => setHolding(false));
          }
        }}
        className={cx('relative flex h-6 w-full touch-none items-center select-none', disabled && 'opacity-40')}
      >
        <RadixSlider.Track
          className={cx(
            'relative h-1.5 grow overflow-hidden rounded-full',
            track === 'warmth' ? 'bg-[linear-gradient(90deg,#e2a85b,#f1e6d2,#c9dcef)]' : 'bg-rule-strong',
          )}
        >
          {track === 'accent' && <RadixSlider.Range className={cx('absolute h-full', muted ? 'bg-faint' : 'bg-accent')} />}
        </RadixSlider.Track>
        <RadixSlider.Thumb
          aria-label={label}
          aria-valuetext={format(local)}
          className="block size-5 rounded-full border-2 border-accent-ink bg-on-accent shadow-[0_2px_6px_rgb(0_0_0/0.35)] transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-accent"
        />
      </RadixSlider.Root>
      {showValue && <span className="num w-12 shrink-0 text-right text-label text-fg-2">{format(local)}</span>}
    </div>
  );
}

export function Stepper({
  value,
  display,
  onStep,
  label,
  canDecrease = true,
  canIncrease = true,
  disabled,
  size = 'lg',
  tone = 'neutral',
}: {
  value: number;
  /** Formatted value, e.g. "71°". */
  display: string;
  onStep: (delta: -1 | 1) => void;
  label: string;
  canDecrease?: boolean;
  canIncrease?: boolean;
  disabled?: boolean;
  size?: 'lg' | 'md';
  tone?: 'neutral' | 'heat' | 'cool';
}) {
  const btn = cx(
    'grid shrink-0 place-items-center rounded-full border border-control bg-surface-2 text-fg-2 transition-colors',
    'hover:border-accent hover:text-accent-ink disabled:opacity-30',
    size === 'lg' ? 'size-11' : 'size-9',
  );
  return (
    <div className="flex items-center gap-4" role="group" aria-label={label}>
      <button type="button" className={btn} onClick={() => onStep(-1)} disabled={disabled || !canDecrease} aria-label={`Lower ${label}`}>
        <Minus className="size-4" strokeWidth={1.5} />
      </button>
      <output
        aria-live="polite"
        data-value={value}
        className={cx(
          'num min-w-[3.5ch] text-center font-light',
          size === 'lg' ? 'text-h1' : 'text-h2',
          tone === 'heat' && 'text-accent-ink',
          tone === 'cool' && 'text-cool',
        )}
      >
        <span key={display} className="inline-block animate-zh-tick">
          {display}
        </span>
      </output>
      <button type="button" className={btn} onClick={() => onStep(1)} disabled={disabled || !canIncrease} aria-label={`Raise ${label}`}>
        <Plus className="size-4" strokeWidth={1.5} />
      </button>
    </div>
  );
}

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  disabled,
  size = 'md',
  className,
}: {
  value: T;
  options: SegmentOption<T>[];
  onChange: (v: T) => void;
  label: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const name = useId();
  return (
    <fieldset className={cx('inline-flex max-w-full', className)} disabled={disabled}>
      <legend className="sr-only">{label}</legend>
      <div className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-rule bg-surface-2 p-1">
        {options.map((o) => {
          const id = `${name}-${o.value}`;
          const selected = o.value === value;
          return (
            <label
              key={o.value}
              htmlFor={id}
              className={cx(
                'relative cursor-pointer rounded-full whitespace-nowrap font-medium transition-all duration-[var(--dur-fast)]',
                'has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-accent',
                size === 'sm' ? 'px-3 py-1.5 text-label' : 'px-4 py-2 text-body',
                selected ? 'animate-zh-pop bg-accent text-on-accent shadow-[var(--accent-glow)]' : 'text-muted hover:bg-surface hover:text-fg',
                (o.disabled || disabled) && 'cursor-not-allowed opacity-40',
              )}
            >
              <input
                id={id}
                type="radio"
                name={name}
                value={o.value}
                checked={selected}
                disabled={o.disabled}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              {o.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
