/**
 * Settings — appearance, units, dashboard layout, wall display, connection
 * and integration status, plus prototype-only simulation tools.
 * Never shows tokens, passwords or other credentials.
 */
import { Segmented, Toggle } from '@/components/controls';
import { FlaskConical, Info, LayoutGrid, Link2, MonitorSmartphone, Palette, Plug } from 'lucide-react';
import { KeyValueList, Note, PageHeader, Section, Stack } from '@/components/layout-parts';
import { Button, SampleTag } from '@/components/primitives';
import type { OverviewModule } from '@/config/schema';
import type { HomeSnapshot } from '@/data/types';
import { isPrototypeSource } from '@/data/source';
import { getSource, useHome } from '@/store/home';
import { usePreferences, type RouteId, type ThemePref } from '@/store/preferences';
import { NAV } from '@/layout/AppShell';
import type { ReactNode } from 'react';

const MODULE_LABEL: Record<OverviewModule, string> = {
  climate: 'Climate',
  pool: 'Pool & Spa',
  lighting: 'Lighting',
  security: 'Security',
  alerts: 'Alerts',
};

function SettingRow({ title, hint, children, htmlFor }: { title: string; hint?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-b border-rule py-4 last:border-b-0">
      <div className="min-w-0 basis-64">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="text-body text-fg">
            {title}
          </label>
        ) : (
          <p className="text-body text-fg">{title}</p>
        )}
        {hint && <p className="mt-0.5 text-label text-muted">{hint}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

export function Settings({ s }: { s: HomeSnapshot }) {
  const p = usePreferences();
  const config = useHome((st) => st.config)!;
  const notify = useHome((st) => st.notify);
  const source = getSource();
  const proto = source && isPrototypeSource(source) ? source : null;
  const connected = s.connection.status === 'connected';

  return (
    <Stack>
      <PageHeader title="Settings" summary="Preferences apply to this device only." />

      <Section title="Appearance" icon={Palette}>
        <SettingRow title="Theme" hint="Dark suits evenings and wall displays; light suits bright rooms.">
          <Segmented<ThemePref>
            label="Theme"
            size="sm"
            value={p.theme}
            onChange={(v) => p.set('theme', v)}
            options={[
              { value: 'system', label: 'System' },
              { value: 'dark', label: 'Dark' },
              { value: 'light', label: 'Light' },
            ]}
          />
        </SettingRow>
        <SettingRow title="Temperature" hint="Equipment reports °F; °C is converted for display.">
          <Segmented
            label="Temperature unit"
            size="sm"
            value={p.tempUnit}
            onChange={(v) => p.set('tempUnit', v)}
            options={[
              { value: 'F', label: '°F' },
              { value: 'C', label: '°C' },
            ]}
          />
        </SettingRow>
        <SettingRow title="Clock">
          <Segmented
            label="Clock format"
            size="sm"
            value={p.clock}
            onChange={(v) => p.set('clock', v)}
            options={[
              { value: '12h', label: '12-hour' },
              { value: '24h', label: '24-hour' },
            ]}
          />
        </SettingRow>
      </Section>

      <Section title="Dashboard" icon={LayoutGrid}>
        <SettingRow title="Start page" hint="Shown when the dashboard opens." htmlFor="start-page">
          <select
            id="start-page"
            value={p.startPage}
            onChange={(e) => p.set('startPage', e.target.value as RouteId)}
            className="h-10 rounded-full border border-control bg-surface-2 px-4 text-body text-fg"
          >
            {NAV.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label}
              </option>
            ))}
          </select>
        </SettingRow>
        <SettingRow title="Overview sections" hint="Choose what appears on the Overview. Order comes from the home configuration.">
          <div className="flex flex-wrap gap-x-5 gap-y-3">
            {config.overview.modules.map((m) => (
              <label key={m} className="flex items-center gap-2 text-body text-fg-2">
                <Toggle checked={!p.hiddenModules.includes(m)} onChange={() => p.toggleModule(m)} label={`Show ${MODULE_LABEL[m]} on Overview`} />
                {MODULE_LABEL[m]}
              </label>
            ))}
          </div>
        </SettingRow>
      </Section>

      <Section title="Wall display" icon={MonitorSmartphone} meta={<a href="#/wall" className="text-label text-accent-ink hover:underline">Open Home display</a>}>
        <SettingRow title="Use this device as a wall display" hint="Opens on the Home display with a simple dock. Best for the kitchen iPad. Turn off to get the full menu back.">
          <Toggle
            checked={p.wallMode}
            onChange={(v) => {
              p.set('wallMode', v);
              location.hash = v ? '#/wall' : '#/overview';
            }}
            label="Use this device as a wall display"
          />
        </SettingRow>
        <SettingRow title="Calm look" hint="Quieter colours on the Home display. Alerts always stay bright.">
          <Segmented
            label="Calm look"
            value={p.wall.ambient}
            onChange={(v) => p.setWall({ ambient: v as 'off' | 'idle' | 'always' })}
            options={[
              { value: 'off', label: 'Off' },
              { value: 'idle', label: 'When idle' },
              { value: 'always', label: 'Always' },
            ]}
          />
        </SettingRow>
        <SettingRow title="Return to Home display" hint="After this long untouched, go back to the Home display. It only changes the screen — it never turns anything on or off.">
          <Segmented
            label="Return to Home display after"
            value={String(p.wall.idleMinutes)}
            onChange={(v) => p.setWall({ idleMinutes: Number(v) })}
            options={[
              { value: '0', label: 'Never' },
              { value: '1', label: '1 min' },
              { value: '2', label: '2 min' },
              { value: '5', label: '5 min' },
              { value: '10', label: '10 min' },
            ]}
          />
        </SettingRow>
        <SettingRow title="Dim at night" hint="Between these times the wall display switches to the dark theme and lowers its brightness. Alerts stay bright.">
          <Toggle checked={p.wall.dimAtNight} onChange={(v) => p.setWall({ dimAtNight: v })} label="Dim at night" />
          <label className="flex items-center gap-2 text-label text-muted">
            From
            <input
              type="time"
              value={p.wall.dimFrom}
              disabled={!p.wall.dimAtNight}
              onChange={(e) => p.setWall({ dimFrom: e.target.value })}
              className="h-10 rounded-full border border-control bg-surface-2 px-4 text-body text-fg disabled:opacity-40"
            />
          </label>
          <label className="flex items-center gap-2 text-label text-muted">
            Until
            <input
              type="time"
              value={p.wall.dimUntil}
              disabled={!p.wall.dimAtNight}
              onChange={(e) => p.setWall({ dimUntil: e.target.value })}
              className="h-10 rounded-full border border-control bg-surface-2 px-4 text-body text-fg disabled:opacity-40"
            />
          </label>
        </SettingRow>
        <SettingRow title="Quick controls" hint="Show scene buttons on the Home display.">
          <Toggle checked={p.wall.showControls} onChange={(v) => p.setWall({ showControls: v })} label="Show quick controls on wall display" />
        </SettingRow>
      </Section>

      <Section title="Connection" icon={Link2}>
        <KeyValueList
          columns={1}
          items={[
            { k: 'Data source', v: <span className="inline-flex items-center gap-2">{s.source.label} <SampleTag /></span> },
            { k: 'Home Assistant address', v: <span className="text-muted">Not configured (Milestone 2)</span> },
            { k: 'Signed in as', v: <span className="text-muted">Not applicable in the prototype</span> },
            { k: 'Status', v: connected ? 'Connected to sample data' : s.connection.status },
          ]}
        />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="sm" variant="quiet" disabled>
            Sign out
          </Button>
          <span className="text-label text-muted">Available once Home Assistant sign-in is added.</span>
        </div>
        <Note className="mt-4">Sign-in tokens are never displayed here or stored in the dashboard's code. See discovery report §3.1a.</Note>
      </Section>

      <Section title="Integrations" icon={Plug}>
        <ul>
          {s.integrations.map((i) => (
            <li key={i.id} className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-rule py-2.5 last:border-b-0">
              <span className="text-body text-fg">{i.name}</span>
              <span className="text-label text-muted">
                {i.support === 'built-in' ? 'Built-in' : 'Community'} · {i.transport} · {i.status.replace('_', ' ')}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-label text-muted">Integrations are added and removed in Home Assistant, not here.</p>
      </Section>

      {proto && (
        <Section title="Prototype tools" icon={FlaskConical} meta={<SampleTag>Prototype only</SampleTag>}>
          <SettingRow title="Simulate command failures" hint="Every command fails, to preview error handling.">
            <Toggle
              checked={p.prototype.simulateFailures}
              label="Simulate command failures"
              onChange={(v) => {
                usePreferences.setState({ prototype: { simulateFailures: v } });
                proto.setSimulatedFailures(v);
              }}
            />
          </SettingRow>
          <SettingRow title="Simulate connection loss" hint="Drops the connection for 8 seconds, then reconnects. Values dim and controls pause.">
            <Button size="sm" variant="quiet" disabled={!connected} onClick={() => proto.simulateConnectionLoss(8)}>
              Disconnect for 8 s
            </Button>
          </SettingRow>
          <SettingRow title="Simulate doorbell press" hint="Adds a doorbell event and shows the live notification.">
            <Button size="sm" variant="quiet" disabled={!connected} onClick={() => proto.simulateDoorbellPress()}>
              Ring doorbell
            </Button>
          </SettingRow>
          <SettingRow title="Reset sample data" hint="Restores every sample value and preference to its starting state.">
            <Button
              size="sm"
              variant="quiet"
              onClick={() => {
                proto.reset();
                proto.setSimulatedFailures(false);
                p.reset();
                notify({ tone: 'info', title: 'Sample data reset' });
              }}
            >
              Reset
            </Button>
          </SettingRow>
          <Note className="mt-2">The Screen Porch light is deliberately unreliable (every other command fails) to demonstrate a real-world weak signal.</Note>
        </Section>
      )}

      <Section title="About" icon={Info}>
        <KeyValueList
          columns={1}
          items={[
            { k: 'Version', v: '0.1.0 · Milestone 1 prototype' },
            { k: 'Home', v: config.home.name },
          ]}
        />
      </Section>
    </Stack>
  );
}
