/**
 * Climate — the home's two thermostat areas, side by side:
 *   • West Wing      (main thermostat)
 *   • East Wing      (upstairs thermostat)
 * Each area has its own interactive dial, mode and status. Fan and comfort
 * settings sit behind "More settings" so everyday use stays simple.
 * Any additional zones a thermostat reports are listed under its area.
 */
import { Activity, ChevronDown, Droplets, Flame, Gauge, Snowflake, Thermometer, Wind } from 'lucide-react';
import { useState } from 'react';
import { ThermostatControl } from '@/components/domain/ThermostatControl';
import { Segmented } from '@/components/controls';
import { KeyValueList, Note, PageHeader, Section, Stack } from '@/components/layout-parts';
import { Button, cx } from '@/components/primitives';
import { StatusIndicator } from '@/components/Status';
import type { ClimatePreset, ClimateSystem, ClimateZone, FanMode, HomeSnapshot, HvacMode } from '@/data/types';
import { useNow } from '@/hooks';
import { formatTemp, formatTime, relativeTime } from '@/lib/format';
import { climateAreas, isStale } from '@/lib/selectors';
import { useHome, usePendingKey } from '@/store/home';
import { usePreferences } from '@/store/preferences';

const MODE_LABEL: Record<HvacMode, string> = { heat: 'Heat', cool: 'Cool', auto: 'Auto', fan_only: 'Fan', off: 'Off' };

export function Climate({ s }: { s: HomeSnapshot }) {
  const unit = usePreferences((p) => p.tempUnit);
  const areas = climateAreas(s);

  if (areas.length === 0) {
    return (
      <Stack>
        <PageHeader title="Climate" />
        <Note>No thermostats are connected.</Note>
      </Stack>
    );
  }

  const main = s.climate.find((c) => c.outdoorTemp !== null) ?? s.climate[0]!;
  return (
    <Stack tone="climate">
      <PageHeader title="Climate" summary={areas.map((a) => `${a.label} ${formatTemp(a.zone.currentTemp, unit)}`).join(' · ')} />

      <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-2">
        {areas.map((a) => (
          <ClimateArea key={a.zone.id} s={s} system={a.system} zone={a.zone} label={a.label} sublabel={a.sublabel} />
        ))}
      </div>

      <SystemDetails s={s} system={main} />
    </Stack>
  );
}

function ClimateArea({ s, system, zone, label, sublabel }: { s: HomeSnapshot; system: ClimateSystem; zone: ClimateZone; label: string; sublabel: string }) {
  const unit = usePreferences((p) => p.tempUnit);
  const clock = usePreferences((p) => p.clock);
  const run = useHome((st) => st.run);
  const now = useNow(15_000);
  const modePending = usePendingKey(`climate:${zone.id}:mode`);
  const [more, setMore] = useState(false);

  const device = s.devices.find((d) => d.id === system.deviceId);
  const connected = s.connection.status === 'connected';
  const reachable = device?.availability === 'online';
  const stale = isStale(zone.lastUpdated, device?.staleAfterSec ?? 600, now, connected);
  const disabled = !connected || !reachable;
  const extraZones = system.zones.filter((z) => z.id !== zone.id);

  const activity =
    zone.action === 'heating'
      ? { text: 'Heating', icon: Flame, cls: 'bg-accent-soft text-accent-ink' }
      : zone.action === 'cooling'
        ? { text: 'Cooling', icon: Snowflake, cls: 'bg-[color-mix(in_srgb,var(--cool)_16%,transparent)] text-cool' }
        : zone.action === 'fan'
          ? { text: 'Fan running', icon: Wind, cls: 'bg-surface-2 text-fg-2' }
          : zone.action === 'off'
            ? { text: 'Off', icon: Thermometer, cls: 'bg-surface-2 text-muted' }
            : { text: 'Idle, at target', icon: Thermometer, cls: 'bg-surface-2 text-fg-2' };
  const ActivityIcon = activity.icon;

  return (
    <Section
      title={label}
      subtitle={sublabel}
      icon={Thermometer}
      iconActive={zone.action === 'heating' || zone.action === 'cooling'}
      meta={
        reachable ? (
          <span className={cx('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-label font-medium', activity.cls)}>
            <ActivityIcon aria-hidden className="size-3.5" strokeWidth={2} />
            {activity.text}
          </span>
        ) : (
          <StatusIndicator status={device?.availability ?? 'unavailable'} />
        )
      }
    >
      <div className="mb-2 grid grid-cols-2 gap-2">
        <div className="rounded-md bg-surface-2 px-4 py-3">
          <p className="text-label text-muted">Room now</p>
          <p className={cx('num text-[1.75rem] leading-tight font-light', stale ? 'text-muted' : 'text-fg')}>{formatTemp(zone.currentTemp, unit, { decimals: true })}</p>
          {stale && <p className="text-micro text-muted">As of {formatTime(zone.lastUpdated, clock)}</p>}
        </div>
        <div className="rounded-md bg-surface-2 px-4 py-3">
          <p className="flex items-center gap-1 text-label text-muted">
            <Droplets aria-hidden className="size-3.5" strokeWidth={1.75} /> Humidity
          </p>
          <p className="num text-[1.75rem] leading-tight font-light text-fg">{zone.humidity !== null ? `${zone.humidity}%` : '—'}</p>
        </div>
      </div>

      <div className="py-2">
        <ThermostatControl zone={zone} name={label} />
      </div>

      <div className="mt-2 flex flex-col items-center gap-2 border-t border-rule pt-4">
        <p className="text-label text-muted">
          Mode{modePending && <span className="text-accent-ink"> · {modePending}</span>}
        </p>
        <Segmented<HvacMode>
          label={`${label} mode`}
          value={zone.mode}
          disabled={disabled || !!modePending}
          onChange={(mode) => run({ type: 'climate.setMode', zoneId: zone.id, mode }, { pending: 'Changing mode…', success: `${label}: ${MODE_LABEL[mode]}` })}
          options={zone.supportedModes.map((m) => ({ value: m, label: MODE_LABEL[m] }))}
        />
      </div>

      <button
        type="button"
        aria-expanded={more}
        onClick={() => setMore((v) => !v)}
        className="mx-auto mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-body text-fg-2 hover:bg-surface-2"
      >
        More settings
        <ChevronDown aria-hidden className={cx('size-4 transition-transform duration-[var(--dur)]', more && 'rotate-180')} strokeWidth={1.75} />
      </button>
      {more && <MoreSettings zone={zone} label={label} disabled={disabled} />}

      {extraZones.length > 0 && (
        <div className="mt-4 border-t border-rule pt-4">
          <p className="mb-2 text-label text-muted">Other zones on this thermostat</p>
          <ul className="grid grid-cols-2 gap-2">
            {extraZones.map((z) => (
              <li key={z.id} className="rounded-md bg-surface-2 px-3 py-2.5">
                <p className="text-body text-fg">{z.name}</p>
                <p className="num text-label text-muted">
                  {formatTemp(z.currentTemp, unit)} · target {formatTemp(z.mode === 'cool' ? z.coolSetpoint : z.heatSetpoint, unit)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
      {reachable && <p className="mt-3 text-center text-micro text-muted">Updated {relativeTime(zone.lastUpdated, now, clock)}</p>}
    </Section>
  );
}

function MoreSettings({ zone, label, disabled }: { zone: ClimateZone; label: string; disabled: boolean }) {
  const run = useHome((st) => st.run);
  const fanPending = usePendingKey(`climate:${zone.id}:fan`);
  const presetPending = usePendingKey(`climate:${zone.id}:preset`);
  return (
    <div className="mt-2 flex flex-col items-center gap-4 rounded-md bg-surface-2 p-4 animate-zh-in">
      <div className="flex flex-col items-center gap-2">
        <p className="text-label text-muted">
          Fan{fanPending && <span className="text-accent-ink"> · {fanPending}</span>}
        </p>
        <Segmented<FanMode>
          size="sm"
          label={`${label} fan`}
          value={zone.fanMode}
          disabled={disabled || !!fanPending}
          onChange={(fan) => run({ type: 'climate.setFan', zoneId: zone.id, fan }, { pending: 'Setting fan…', success: `${label} fan: ${fan}` })}
          options={[
            { value: 'auto', label: 'Auto' },
            { value: 'low', label: 'Low' },
            { value: 'med', label: 'Medium' },
            { value: 'high', label: 'High' },
          ]}
        />
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="text-label text-muted">
          Comfort setting{presetPending && <span className="text-accent-ink"> · {presetPending}</span>}
        </p>
        <Segmented<ClimatePreset>
          size="sm"
          label={`${label} comfort setting`}
          value={zone.preset}
          disabled={disabled || !!presetPending}
          onChange={(preset) => run({ type: 'climate.setPreset', zoneId: zone.id, preset }, { pending: 'Applying…', success: `${label}: ${preset}` })}
          options={[
            { value: 'home', label: 'Home' },
            { value: 'away', label: 'Away' },
            { value: 'sleep', label: 'Sleep' },
            { value: 'wake', label: 'Wake' },
          ]}
        />
        {zone.hold && (
          <>
            <Button size="sm" variant="quiet" disabled={disabled} onClick={() => run({ type: 'climate.resumeSchedule', zoneId: zone.id }, { pending: 'Resuming…', success: `${label}: schedule resumed` })}>
              Back to schedule
            </Button>
            <p className="text-micro text-muted">Holding your manual setting until the next scheduled change.</p>
          </>
        )}
      </div>
    </div>
  );
}

function SystemDetails({ s, system }: { s: HomeSnapshot; system: ClimateSystem }) {
  const unit = usePreferences((p) => p.tempUnit);
  const device = s.devices.find((d) => d.id === system.deviceId);
  const [open, setOpen] = useState(false);
  return (
    <Section
      title="Equipment details"
      subtitle={`${system.name} · furnace and air handler`}
      icon={Activity}
      meta={
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-body text-fg-2 hover:bg-surface-2">
          {open ? 'Hide' : 'Show'}
          <ChevronDown aria-hidden className={cx('size-4 transition-transform', open && 'rotate-180')} strokeWidth={1.75} />
        </button>
      }
    >
      {open ? (
        <div className="animate-zh-in">
          <KeyValueList
            items={[
              { k: 'Outside temperature', v: formatTemp(system.outdoorTemp, unit) },
              { k: 'Equipment running', v: system.stage ?? '—' },
              { k: 'Air flow', v: system.airflowCfm ? `${system.airflowCfm} CFM` : '—' },
              { k: 'Blower speed', v: system.blowerRpm ? `${system.blowerRpm} rpm` : '—' },
              { k: 'Air pressure', v: system.staticPressureInWc ? `${system.staticPressureInWc.toFixed(2)} in. w.c.` : '—' },
              { k: 'Filter life left', v: system.filterLifePct !== null ? `${system.filterLifePct}%` : '—' },
              { k: 'Energy today', v: system.energyTodayKwh !== null ? `${system.energyTodayKwh.toFixed(1)} kWh` : '—', hint: 'Updated about every 30 minutes' },
              { k: 'Thermostat', v: device ? `${device.manufacturer} ${device.model}` : '—' },
            ]}
          />
          <div className="mt-4 space-y-2">
            <Note>Main thermostat: through Carrier’s cloud. Changes can take a few seconds to reach it.</Note>
            <Note>Upstairs (East Wing) thermostat: brand and connection still to be confirmed, so only room temperature and targets are shown.</Note>
          </div>
        </div>
      ) : (
        <p className="flex items-center gap-2 text-body text-muted">
          <Gauge aria-hidden className="size-4" strokeWidth={1.75} />
          Filter {system.filterLifePct ?? '—'}% left · outside {formatTemp(system.outdoorTemp, unit)}
        </p>
      )}
    </Section>
  );
}
