/**
 * Page-level structure: headers, tiles, metrics, key/value lists, notes.
 *
 * Everything sits on rounded "tiles" (see the `tile` utility in index.css).
 * Each tile has a header row: round icon chip + title, with optional
 * right-side meta (counts, links, status). Inside tiles, hairline rules
 * separate rows.
 */
import { ArrowUpRight, Info, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Tone } from '@/lib/tones';
import { Caps, cx } from './primitives';

/** Top of every screen: title, one-line summary, optional right-side actions. */
export function PageHeader({ title, summary, actions }: { title: string; summary?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 pb-1">
      <div className="min-w-0">
        <h1 className="text-h1 font-medium tracking-[-0.03em] text-fg">{title}</h1>
        {summary && <p className="mt-1.5 text-lead text-muted">{summary}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Round icon badge used in tile headers. `active` fills it with the accent. */
export function IconChip({ icon: Icon, active, className }: { icon: LucideIcon; active?: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={cx(
        'grid size-10 shrink-0 place-items-center rounded-full border',
        'transition-[background-color,box-shadow,color] duration-[var(--dur)]',
        active ? 'border-accent-ink bg-accent text-on-accent shadow-[var(--accent-glow)]' : 'border-transparent bg-accent-soft text-accent-ink',
        className,
      )}
    >
      <Icon className="size-[18px]" strokeWidth={1.75} />
    </span>
  );
}

/** A plain tile, for custom layouts. */
export function Tile({ children, className, as: Tag = 'div', ...rest }: { children: ReactNode; className?: string; as?: 'div' | 'section' | 'article' } & Record<string, unknown>) {
  return (
    <Tag className={cx('tile p-5 md:p-6', className)} {...rest}>
      {children}
    </Tag>
  );
}

/**
 * Section — a titled tile.
 * `icon` adds a round icon chip; `subtitle` sits under the title;
 * `meta` sits at the right of the header row.
 */
export function Section({
  title,
  subtitle,
  icon,
  iconActive,
  meta,
  children,
  className,
  id,
  tone,
  band,
}: {
  title: string;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  iconActive?: boolean;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
  /** Signature colour for everything inside this tile. */
  tone?: Tone;
  /** Coloured header band (reference style). Needs a tone to look right. */
  band?: boolean;
}) {
  const headingId = id ?? `sec-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <section aria-labelledby={headingId} data-tone={tone} className={cx('tile animate-zh-rise flex flex-col overflow-hidden p-5 md:p-6', className)}>
      <div
        className={cx(
          'flex min-h-10 items-center justify-between gap-4',
          band ? '-mx-5 -mt-5 mb-5 bg-band px-5 py-3.5 text-band-fg md:-mx-6 md:-mt-6 md:px-6' : 'mb-4',
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          {icon &&
            (band ? (
              <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-band-fg/12">
                {(() => {
                  const I = icon;
                  return <I className="size-[18px]" strokeWidth={1.9} />;
                })()}
              </span>
            ) : (
              <IconChip icon={icon} active={iconActive} />
            ))}
          <div className="min-w-0">
            <h2 id={headingId} className={cx('truncate text-lead font-medium', band ? 'text-band-fg' : 'text-fg')}>
              {title}
            </h2>
            {subtitle && <p className={cx('truncate text-label', band ? 'text-band-fg' : 'text-muted')}>{subtitle}</p>}
          </div>
        </div>
        {meta && (
          <div
            className={cx(
              'flex shrink-0 items-center gap-3 text-label',
              band ? 'text-band-fg [&_a]:border-band-fg/40 [&_a]:text-band-fg [&_a:hover]:bg-band-fg/10' : 'text-muted',
            )}
          >
            {meta}
          </div>
        )}
      </div>
      {children}
    </section>
  );
}

/** Small round "open" link used in tile headers. */
export function TileLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      className="grid size-9 place-items-center rounded-full border border-control text-fg-2 transition-[transform,color,background-color] duration-[var(--dur)] hover:-translate-y-0.5 hover:translate-x-0.5 hover:text-fg active:scale-95"
    >
      <ArrowUpRight aria-hidden className="size-4" strokeWidth={1.75} />
    </a>
  );
}

/**
 * Metric — a primary number with a caption and a supporting line, as a tile.
 * `stale` dims the value and shows when it was last updated.
 */
export function Metric({
  label,
  value,
  sub,
  stale,
  staleText,
  tone = 'neutral',
  size = 'display',
  href,
  icon,
  tile = true,
  system,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  stale?: boolean;
  staleText?: string;
  tone?: 'neutral' | 'accent' | 'cool' | 'danger';
  size?: 'display' | 'h1' | 'wall';
  href?: string;
  icon?: LucideIcon;
  tile?: boolean;
  /** Signature colour: adds a coloured header band with the label and icon. */
  system?: Tone;
}) {
  const active = !stale && tone === 'accent';
  const Icon = icon;
  const body = (
    <>
      {system ? (
        <div className="-mx-5 -mt-5 mb-1 flex items-center justify-between gap-3 bg-band px-5 py-3 text-band-fg md:-mx-6 md:-mt-6 md:px-6">
          <span className="text-body font-medium">{label}</span>
          {Icon && <Icon aria-hidden className={cx('size-[18px]', active && 'animate-zh-pulse')} strokeWidth={1.9} />}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <Caps className="block">{label}</Caps>
          {icon && <IconChip icon={icon} active={active} className="size-9" />}
        </div>
      )}
      <div
        className={cx(
          'num mt-4 font-light',
          size === 'display' && 'text-[2.75rem] leading-none tracking-[-0.04em] lg:text-[3.5rem]',
          size === 'h1' && 'text-h1',
          size === 'wall' && 'text-wall',
          stale ? 'text-muted' : tone === 'accent' ? 'text-accent-ink' : tone === 'cool' ? 'text-cool' : tone === 'danger' ? 'text-danger' : 'text-fg',
        )}
      >
        {/* Re-keyed on change so new values tick in. */}
        <span key={typeof value === 'string' || typeof value === 'number' ? String(value) : undefined} className="inline-block animate-zh-tick">
          {value}
        </span>
      </div>
      {sub && <div className={cx('mt-2 text-body', stale ? 'text-muted' : 'text-fg-2')}>{sub}</div>}
      {stale && staleText && <div className="mt-1 text-label text-muted italic">{staleText}</div>}
    </>
  );
  const shell = cx(tile && 'tile animate-zh-rise overflow-hidden p-5 md:p-6', 'block');
  if (href) {
    return (
      <a href={href} data-tone={system} className={cx(shell, 'lift')}>
        {body}
      </a>
    );
  }
  return (
    <div data-tone={system} className={shell}>
      {body}
    </div>
  );
}

export function KeyValueList({
  items,
  className,
  columns = 2,
}: {
  items: { k: string; v: ReactNode; hint?: string }[];
  className?: string;
  /** 2 = two columns from tablet width up; 1 = always a single column. */
  columns?: 1 | 2;
}) {
  return (
    <dl className={cx('grid grid-cols-1', columns === 2 && 'sm:grid-cols-2 sm:gap-x-6', className)}>
      {items.map((it) => (
        <div key={it.k} className="flex items-baseline justify-between gap-4 border-b border-rule py-2.5">
          <dt className="text-body text-muted">{it.k}</dt>
          <dd className="num text-right text-body text-fg" title={it.hint}>
            {it.v}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** A clearly-marked limitation of an integration or of the prototype. */
export function Note({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'danger'; className?: string }) {
  return (
    <p
      className={cx(
        'flex items-start gap-2 rounded-sm px-3 py-2 text-label',
        tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-surface-2 text-muted',
        className,
      )}
    >
      <Info aria-hidden className="mt-px size-3.5 shrink-0" strokeWidth={1.75} />
      <span>{children}</span>
    </p>
  );
}

/** A row in a list separated by hairlines. */
export function Row({ children, className, dim }: { children: ReactNode; className?: string; dim?: boolean }) {
  return (
    <div className={cx('flex items-center gap-4 border-b border-rule py-3 last:border-b-0', dim && 'opacity-60', className)}>
      {children}
    </div>
  );
}

/** Vertical stack of tiles with the standard gap. */
export function Stack({ children, className, tone }: { children: ReactNode; className?: string; tone?: Tone }) {
  return (
    <div data-tone={tone} className={cx('stagger flex flex-col gap-4 md:gap-5', className)}>
      {children}
    </div>
  );
}
