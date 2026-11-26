/**
 * Primitive building blocks. Every visual decision here comes from tokens.
 *
 *  Rule        hairline divider — the main structural device instead of cards
 *  Button      primary (brass outline) / quiet / danger variants
 *  Spinner     small pending indicator
 *  SampleTag   marks prototype-only data
 *  Skeleton    loading placeholder
 */
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

export function Rule({ className, strong }: { className?: string; strong?: boolean }) {
  return <hr className={cx('border-0 border-t', strong ? 'border-rule-strong' : 'border-rule', className)} />;
}

type ButtonVariant = 'primary' | 'quiet' | 'danger' | 'solid';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
  pending?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'quiet', size = 'md', pending, icon, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-full border font-medium whitespace-nowrap select-none',
        'transition-colors duration-[var(--dur-fast)] disabled:opacity-45',
        size === 'sm' ? 'h-9 px-4 text-label' : 'h-11 px-5 text-body',
        variant === 'primary' && 'border-transparent bg-accent-soft text-accent hover:bg-accent hover:text-on-accent',
        variant === 'solid' && 'border-accent bg-accent font-semibold text-on-accent shadow-[var(--accent-glow)] hover:bg-accent-strong',
        variant === 'quiet' && 'border-rule bg-surface-2 text-fg-2 hover:border-rule-strong hover:text-fg',
        variant === 'danger' && 'border-danger bg-danger text-on-accent hover:opacity-90',
        className,
      )}
      {...rest}
    >
      {pending ? <Spinner /> : icon}
      {children}
    </button>
  );
});

export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <span
      role={label ? 'status' : undefined}
      aria-label={label}
      className={cx('inline-block size-3.5 shrink-0 rounded-full border-[1.5px] border-current border-r-transparent animate-zh-spin', className)}
    />
  );
}

/** Small mono-weight tag marking prototype/sample content. */
export function SampleTag({ className, children = 'Sample data' }: { className?: string; children?: ReactNode }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full border border-dashed border-rule-strong px-2 py-0.5 text-micro font-medium uppercase tracking-[0.1em] text-muted',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cx('block rounded-xs bg-surface-2 animate-zh-pulse', className)} />;
}

/** Uppercase caption label. */
export function Caps({ children, className, as: Tag = 'span', id }: { children: ReactNode; className?: string; as?: 'span' | 'h2' | 'h3' | 'p' | 'dt'; id?: string }) {
  return (
    <Tag id={id} className={cx('caps text-muted', className)}>
      {children}
    </Tag>
  );
}

export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}
