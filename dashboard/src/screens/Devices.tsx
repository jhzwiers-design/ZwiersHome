/**
 * Devices — troubleshooting view. Every device from every integration, with
 * a clear distinction between Online, Off, Offline and Unavailable.
 */
import { ChevronRight, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { List, Plug } from 'lucide-react';
import { PageHeader, Section, Stack } from '@/components/layout-parts';
import { cx } from '@/components/primitives';
import { StatusDot, StatusIndicator } from '@/components/Status';
import type { Device, HomeSnapshot, IntegrationId } from '@/data/types';
import { useNow } from '@/hooks';
import { capitalize, relativeTime } from '@/lib/format';
import { deviceCounts, deviceDisplayStatus, isStale, type DisplayStatus } from '@/lib/selectors';
import { usePreferences } from '@/store/preferences';

type StatusFilter = 'all' | Exclude<DisplayStatus, 'on'>;

const STATUS_HELP: { status: Exclude<DisplayStatus, 'on'>; text: string }[] = [
  { status: 'online', text: 'Reachable and reporting.' },
  { status: 'off', text: 'Reachable, switched off. Not a problem.' },
  { status: 'offline', text: "The device can't be reached: power, range or pairing." },
  { status: 'unavailable', text: "Its integration isn't reporting a state, so it's unknown." },
];

const CATEGORY_LABEL: Record<Device['category'], string> = {
  light: 'Light',
  fan: 'Fan',
  media: 'TV',
  climate: 'Climate',
  pool: 'Pool',
  security: 'Security',
  hub: 'Hub',
  cleaner: 'Cleaner',
};

export function Devices({ s }: { s: HomeSnapshot }) {
  const clock = usePreferences((p) => p.clock);
  const now = useNow(15_000);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [integration, setIntegration] = useState<IntegrationId | 'all'>('all');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const counts = deviceCounts(s);
  const connected = s.connection.status === 'connected';

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rank: Record<string, number> = { offline: 0, unavailable: 1, online: 2, off: 3 };
    return s.devices
      .map((d) => ({ d, st: deviceDisplayStatus(s, d) }))
      .filter(({ d, st }) => (status === 'all' || st === status) && (integration === 'all' || d.integration === integration))
      .filter(({ d }) => !q || `${d.name} ${d.model} ${d.manufacturer}`.toLowerCase().includes(q))
      .sort((a, b) => (rank[a.st] ?? 9) - (rank[b.st] ?? 9) || a.d.name.localeCompare(b.d.name));
  }, [s, status, integration, query]);

  const areaName = (id: string | null) => s.areas.find((a) => a.id === id)?.name ?? '—';
  const integrationName = (id: IntegrationId) => s.integrations.find((i) => i.id === id)?.name ?? id;

  return (
    <Stack tone="devices">
      <PageHeader title="Devices" summary={`${s.devices.length} devices across ${s.integrations.length} integrations`} />

      {/* Status counts double as filters */}
      <section aria-label="Device status" className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
        {STATUS_HELP.map(({ status: st, text }) => {
          const active = status === st;
          return (
            <button
              key={st}
              type="button"
              aria-pressed={active}
              onClick={() => setStatus(active ? 'all' : st)}
              className={cx(
                'tile p-5 text-left transition-colors md:p-6',
                active ? 'border-accent! bg-accent-soft!' : 'hover:border-rule-strong hover:bg-surface-hover',
              )}
            >
              <span className="flex items-center gap-2">
                <StatusDot status={st} />
                <span className="caps text-muted">{capitalize(st)}</span>
              </span>
              <span className={cx('num mt-2 block text-h1 font-light', st === 'offline' && counts.offline ? 'text-danger' : 'text-fg')}>{counts[st]}</span>
              <span className="mt-1 block text-label text-muted">{text}</span>
            </button>
          );
        })}
      </section>

      <Section title="Integrations" subtitle="Through Home Assistant" icon={Plug}>
        <ul>
          {s.integrations.map((i) => (
            <li key={i.id} className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-0.5 border-b border-rule py-2.5 last:border-b-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_auto]">
              <span className="text-body text-fg">{i.name}</span>
              <span className="col-span-2 row-start-2 text-label text-muted md:col-span-1 md:row-start-auto">
                {i.provider} · {i.transport === 'cloud' ? 'Cloud' : 'Local'}
                {i.detail && ` · ${i.detail}`}
              </span>
              <span className="col-start-2 row-start-1 md:col-start-auto md:row-start-auto">
                <IntegrationStatus status={i.status} />
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="All devices"
        icon={List}
        meta={<span className="num">{rows.length} shown</span>}
      >
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="relative min-w-0 flex-1 basis-56">
            <span className="sr-only">Search devices</span>
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" strokeWidth={1.5} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or model"
              className="h-10 w-full rounded-full border border-control bg-surface-2 pr-4 pl-10 text-body text-fg placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-2 text-label text-muted">
            Integration
            <select
              value={integration}
              onChange={(e) => setIntegration(e.target.value as IntegrationId | 'all')}
              className="h-9 rounded-full border border-control bg-surface-2 px-2 text-body text-fg"
            >
              <option value="all">All</option>
              {s.integrations.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </label>
          {status !== 'all' && (
            <button type="button" className="text-label text-muted underline-offset-4 hover:text-fg hover:underline" onClick={() => setStatus('all')}>
              Clear “{capitalize(status)}” filter
            </button>
          )}
        </div>

        {/* Column headings (tablet and up) */}
        <div className="hidden grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)_20px] gap-4 border-b border-rule-strong pb-2 md:grid">
          {['Device', 'Area · type', 'Integration', 'Status'].map((h) => (
            <span key={h} className="caps text-muted">
              {h}
            </span>
          ))}
        </div>

        <ul>
          {rows.map(({ d, st }) => {
            const expanded = open === d.id;
            const stale = d.availability === 'online' && isStale(d.lastSeen, d.staleAfterSec, now, connected);
            return (
              <li key={d.id} className="border-b border-rule">
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setOpen(expanded ? null : d.id)}
                  className="grid w-full grid-cols-[1fr_auto_20px] items-center gap-x-4 gap-y-0.5 py-3 text-left hover:bg-surface/60 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)_20px]"
                >
                  <span className="min-w-0">
                    <span className={cx('block truncate text-body', st === 'offline' || st === 'unavailable' ? 'text-fg-2' : 'text-fg')}>{d.name}</span>
                    <span className="block truncate text-label text-muted md:hidden">
                      {areaName(d.areaId)} · {integrationName(d.integration)}
                    </span>
                  </span>
                  <span className="hidden truncate text-body text-muted md:block">
                    {areaName(d.areaId)} · {CATEGORY_LABEL[d.category]}
                  </span>
                  <span className="hidden truncate text-body text-muted md:block">{integrationName(d.integration)}</span>
                  <span className="justify-self-end md:justify-self-start">
                    <StatusIndicator status={st} label={stale ? 'Stale' : undefined} />
                  </span>
                  <ChevronRight aria-hidden className={cx('size-4 text-muted transition-transform', expanded && 'rotate-90')} strokeWidth={1.5} />
                </button>
                {expanded && (
                  <dl className="grid grid-cols-1 gap-x-8 pb-4 pl-0 text-body sm:grid-cols-2 md:pl-0 lg:grid-cols-3">
                    {[
                      ['Model', `${d.manufacturer} ${d.model}`],
                      ['Connection', d.protocol],
                      ['Last update', d.lastSeen ? `${relativeTime(d.lastSeen, now, clock)}` : 'Never'],
                      ['Expected update', `Every ${d.staleAfterSec >= 60 ? `${Math.round(d.staleAfterSec / 60)} min` : `${d.staleAfterSec} s`} or sooner`],
                      ['Integration', integrationName(d.integration)],
                      ['Issue', d.issue ?? 'None'],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 border-b border-rule py-2 sm:block sm:border-b-0">
                        <dt className="text-label text-muted">{k}</dt>
                        <dd className={cx('text-body', k === 'Issue' && d.issue ? (st === 'offline' || st === 'unavailable' ? 'text-danger' : 'text-fg') : 'text-fg-2')}>{v}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </li>
            );
          })}
        </ul>
        {rows.length === 0 && <p className="py-6 text-body text-muted">No devices match.</p>}
      </Section>
    </Stack>
  );
}

function IntegrationStatus({ status }: { status: HomeSnapshot['integrations'][number]['status'] }) {
  switch (status) {
    case 'connected':
      return <StatusIndicator status="online" label="Connected" />;
    case 'degraded':
      return <StatusIndicator status="online" label="Connected · issues" className="!text-fg-2" />;
    case 'disconnected':
      return <StatusIndicator status="offline" label="Disconnected" />;
    case 'not_configured':
      return <StatusIndicator status="unavailable" label="Not configured" />;
  }
}
