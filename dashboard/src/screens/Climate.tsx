/**
 * Climate — Carrier Infinity system: current conditions, setpoints, mode,
 * fan, comfort presets and system information.
 */
import { ThermostatControl } from '@/components/domain/ThermostatControl';
import { Segmented } from '@/components/controls';
import { Activity, Fan, Gauge, Sofa, Thermometer } from 'lucide-react';
import { KeyValueList, Note, PageHeader, Section, Stack } from '@/components/layout-parts';
import { Button, cx } from '@/components/primitives';
import { StatusDot, StatusIndicator } from '@/components/Status';
import type { ClimatePreset, FanMode, HomeSnapshot, HvacMode } from '@/data/types';
import { useNow } from '@/hooks';
import { formatTemp, formatTime, relativeTime } from '@/lib/format';
import { isStale } from '@/lib/selectors';
import { useHome, usePendingKey } from '@/store/home';
import { usePreferences } from '@/store/preferences';

const MODE_LABEL: Record<HvacMode, string> = { heat: 'Heat', cool: 'Cool', auto: 'Auto', fan_only: 'Fan', off: 'Off' };

export function Climate({ s }: { s: HomeSnapshot }) {
  const unit = usePreferences((p) => p.tempUnit);
  const clock = usePreferences((p) => p.clock);
  const run = useHome((st) => st.run);
  const now = useNow(15_000);
  const sys = s.climate[0];
  const zone = sys?.zones[0];
  const modePending = usePendingKey(`climate:${zone?.id}:mode`);
  const fanPending = usePendingKey(`climate:${zone?.id}:fan`);
  const presetPending = usePendingKey(`climate:${zone?.id}:preset`);

  if (!sys || !zone) {
    return (
      <div>
        <PageHeader title="Climate" />
        <Note>No climate system is connected.</Note>
      </div>
    );
  }

  const device = s.devices.find((d) => d.id === sys.deviceId);
  const connected = s.connection.status === 'connected';
  const reachable = device?.availability === 'online';
  const stale = isStale(zone.lastUpdated, device?.staleAfterSec ?? 600, now, connected);
  const disabled = !connected || !reachable;

  const actionText =
    zone.action === 'heating'
      ? 'Heating'
      : zone.action === 'cooling'
        ? 'Cooling'
        : zone.action === 'fan'
          ? 'Fan running'
          : zone.action === 'off'
            ? 'Off'
            : 'Idle: at setpoint';

  return (
    <Stack tone="climate">
      <PageHeader
        title="Climate"
        summary={`${sys.name} · ${zone.name}`}
        actions={<StatusIndicator status={reachable ? 'online' : (device?.availability ?? 'unavailable')} label={reachable ? `Updated ${relativeTime(zone.lastUpdated, now, clock)}` : undefined} />}
      />

      <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-12">
        <Section title="Indoor" subtitle={zone.name} icon={Thermometer} iconActive={zone.action === 'heating'} className="lg:col-span-5">
          <p
            className={cx(
              'num mt-2 text-[5rem] leading-none font-extralight tracking-[-0.05em] md:text-[6.5rem]',
              stale ? 'text-muted' : zone.action === 'heating' ? 'text-accent-ink' : zone.action === 'cooling' ? 'text-cool' : 'text-fg',
            )}
          >
            {formatTemp(zone.currentTemp, unit, { decimals: true })}
          </p>
          <p className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-surface-2 px-3.5 py-1.5 text-body text-fg-2">
            <StatusDot status={zone.action === 'heating' || zone.action === 'cooling' || zone.action === 'fan' ? 'on' : 'off'} />
            {actionText}
          </p>
          {stale && <p className="mt-2 text-label text-muted italic">As of {formatTime(zone.lastUpdated, clock)}</p>}
          {zone.hold && <p className="mt-2 text-label text-muted">Hold until next schedule period</p>}
          <div className="mt-auto grid grid-cols-2 gap-2 pt-6">
            <div className="rounded-sm bg-surface-2 px-4 py-3">
              <p className="caps text-muted">Humidity</p>
              <p className="num mt-1 text-h2 font-light text-fg">{zone.humidity ?? '—'}%</p>
            </div>
            <div className="rounded-sm bg-surface-2 px-4 py-3">
              <p className="caps text-muted">Outside</p>
              <p className="num mt-1 text-h2 font-light text-fg">{formatTemp(sys.outdoorTemp, unit)}</p>
            </div>
          </div>
        </Section>

        <Section
          title="Thermostat"
          subtitle={MODE_LABEL[zone.mode] + ' mode'}
          icon={Gauge}
          className="lg:col-span-7"
          meta={modePending && <StatusIndicator status="on" pending={modePending} />}
        >
          <div className="flex flex-1 flex-col items-center justify-center gap-6 py-2">
            <ThermostatControl zone={zone} variant="dial" />
            <Segmented<HvacMode>
              label="System mode"
              value={zone.mode}
              disabled={disabled || !!modePending}
              onChange={(mode) =>
                run({ type: 'climate.setMode', zoneId: zone.id, mode }, { pending: 'Changing mode…', success: `Mode set to ${MODE_LABEL[mode]}` })
              }
              options={zone.supportedModes.map((m) => ({ value: m, label: MODE_LABEL[m] }))}
            />
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-2">
        <Section title="Fan" icon={Fan} meta={fanPending && <StatusIndicator status="on" pending={fanPending} />}>
          <Segmented<FanMode>
            label="Fan speed"
            value={zone.fanMode}
            disabled={disabled || !!fanPending}
            onChange={(fan) => run({ type: 'climate.setFan', zoneId: zone.id, fan }, { pending: 'Setting fan…', success: `Fan ${fan}` })}
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'low', label: 'Low' },
              { value: 'med', label: 'Med' },
              { value: 'high', label: 'High' },
            ]}
          />
        </Section>
        <Section title="Comfort" icon={Sofa} meta={presetPending && <StatusIndicator status="on" pending={presetPending} />}>
          <div className="flex flex-wrap items-center gap-3">
            <Segmented<ClimatePreset>
              label="Comfort preset"
              value={zone.preset}
              disabled={disabled || !!presetPending}
              onChange={(preset) =>
                run({ type: 'climate.setPreset', zoneId: zone.id, preset }, { pending: 'Applying…', success: `Comfort: ${preset}` })
              }
              options={[
                { value: 'home', label: 'Home' },
                { value: 'away', label: 'Away' },
                { value: 'sleep', label: 'Sleep' },
                { value: 'wake', label: 'Wake' },
              ]}
            />
            {zone.preset === 'manual' && <span className="text-label text-muted">Manual setpoint</span>}
            {zone.hold && (
              <Button
                size="sm"
                variant="quiet"
                disabled={disabled}
                onClick={() => run({ type: 'climate.resumeSchedule', zoneId: zone.id }, { pending: 'Resuming…', success: 'Schedule resumed' })}
              >
                Resume schedule
              </Button>
            )}
          </div>
        </Section>
      </div>

      <Section title="System" subtitle="Carrier Infinity" icon={Activity}>
        <KeyValueList
          items={[
            { k: 'Outdoor', v: formatTemp(sys.outdoorTemp, unit) },
            { k: 'Equipment', v: sys.stage ?? '—' },
            { k: 'Airflow', v: sys.airflowCfm ? `${sys.airflowCfm} CFM` : '—' },
            { k: 'Blower', v: sys.blowerRpm ? `${sys.blowerRpm} rpm` : '—' },
            { k: 'Static pressure', v: sys.staticPressureInWc ? `${sys.staticPressureInWc.toFixed(2)} in. w.c.` : '—' },
            { k: 'Filter life', v: sys.filterLifePct !== null ? `${sys.filterLifePct}%` : '—' },
            { k: 'Energy today', v: sys.energyTodayKwh !== null ? `${sys.energyTodayKwh.toFixed(1)} kWh` : '—', hint: 'Not real-time; Carrier updates energy every 30 min' },
            { k: 'Thermostat', v: device ? `${device.manufacturer} ${device.model}` : '—' },
          ]}
        />
        <div className="mt-5 space-y-2">
          <Note>Via Carrier's cloud (community integration ha_carrier). Changes can take a few seconds to reach the thermostat, and may briefly show the old value.</Note>
          <Note>Compatibility with this exact model is unverified until Milestone 5.</Note>
        </div>
      </Section>
    </Stack>
  );
}
