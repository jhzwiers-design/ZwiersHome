/**
 * Security — Ring doorbell and chime: camera, device status, event history.
 */
import { useState } from 'react';
import { CameraView, EventList } from '@/components/domain/SecurityParts';
import { Button } from '@/components/primitives';
import { RangeSlider, Segmented } from '@/components/controls';
import { Bell, BellRing, History, Video } from 'lucide-react';
import { KeyValueList, Note, PageHeader, Section, Stack } from '@/components/layout-parts';
import { StatusIndicator } from '@/components/Status';
import type { HomeSnapshot, SecurityEvent } from '@/data/types';
import { useNow } from '@/hooks';
import { relativeTime } from '@/lib/format';
import { useHome, usePendingKey } from '@/store/home';
import { usePreferences } from '@/store/preferences';

type EventFilter = 'all' | SecurityEvent['kind'];

function signalLabel(dbm: number | null) {
  if (dbm === null) return '—';
  const q = dbm >= -60 ? 'Good' : dbm >= -70 ? 'Fair' : 'Weak';
  return `${q} (${dbm} dBm)`;
}

export function Security({ s }: { s: HomeSnapshot }) {
  const clock = usePreferences((p) => p.clock);
  const now = useNow(30_000);
  const [filter, setFilter] = useState<EventFilter>('all');
  const cam = s.security.cameras[0];
  const chime = s.security.chimes[0];

  if (!cam) {
    return (
      <div>
        <PageHeader title="Security" />
        <Note>No cameras are connected.</Note>
      </div>
    );
  }

  const camDevice = s.devices.find((d) => d.id === cam.deviceId);
  const events = s.security.events.filter((e) => filter === 'all' || e.kind === filter);
  const lastDing = [...s.security.events].filter((e) => e.kind === 'ding').sort((a, b) => b.at - a.at)[0];
  const today = s.security.events.filter((e) => now - e.at < 86_400_000);

  return (
    <Stack tone="security">
      <PageHeader
        title="Security"
        summary={
          <>
            {today.filter((e) => e.kind === 'ding').length} doorbell · {today.filter((e) => e.kind === 'motion').length} motion in the last 24 h
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-12">
        <Section title="Camera" subtitle={`${cam.name} · Ring`} icon={Video} className="lg:col-span-8">
          <CameraView camera={cam} />
          <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
            <Note>Live view: supported by the official Ring integration (no two-way audio). To be tested on your doorbell.</Note>
            <Note>
              Recorded clips need a Ring Protect plan.{' '}
              {cam.hasRecordingPlan === null ? 'Your plan is not confirmed yet.' : cam.hasRecordingPlan ? 'Plan active.' : 'No plan.'}
            </Note>
          </div>
        </Section>
        <div className="flex flex-col gap-4 md:gap-5 lg:col-span-4">
          <Section
            title={cam.name}
            subtitle="Doorbell"
            icon={BellRing}
            meta={<StatusIndicator status={camDevice?.availability === 'online' ? 'online' : (camDevice?.availability ?? 'unavailable')} />}
          >
            <KeyValueList
              columns={1}
              items={[
                { k: 'Last doorbell', v: lastDing ? relativeTime(lastDing.at, now, clock) : 'None' },
                { k: 'Motion detection', v: cam.motionDetection ? 'On' : 'Off' },
                { k: 'Wi-Fi signal', v: signalLabel(cam.wifiSignalDbm) },
                { k: 'Power', v: 'Wired' },
                { k: 'Model', v: camDevice?.model ?? '—' },
              ]}
            />
          </Section>
          {chime && <ChimeControls s={s} chimeId={chime.id} />}
        </div>
      </div>

      <Section
        title="Events"
        subtitle="Doorbell presses and motion"
        icon={History}
        meta={
          <Segmented<EventFilter>
            size="sm"
            label="Filter events"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'ding', label: 'Doorbell' },
              { value: 'motion', label: 'Motion' },
            ]}
          />
        }
      >
        <EventList events={events} cameras={s.security.cameras} />
      </Section>
    </Stack>
  );
}

function ChimeControls({ s, chimeId }: { s: HomeSnapshot; chimeId: string }) {
  const run = useHome((st) => st.run);
  const pending = usePendingKey(`chime:${chimeId}`);
  const chime = s.security.chimes.find((c) => c.id === chimeId)!;
  const device = s.devices.find((d) => d.id === chime.deviceId);
  const disabled = s.connection.status !== 'connected' || device?.availability !== 'online';

  return (
    <Section title={chime.name} subtitle="Ring" icon={Bell} meta={<StatusIndicator status={device?.availability === 'online' ? 'online' : (device?.availability ?? 'unavailable')} pending={pending} />}>
      <div className="flex items-center gap-4 py-3">
        <span className="w-16 text-body text-muted">Volume</span>
        <RangeSlider
          className="flex-1"
          label="Chime volume"
          value={chime.volume}
          min={0}
          max={10}
          disabled={disabled || !!pending}
          onCommit={(v) => run({ type: 'chime.setVolume', chimeId, volume: v }, { pending: 'Setting volume…', success: `Chime volume ${v}` })}
        />
      </div>
      <Button
        size="sm"
        variant="quiet"
        disabled={disabled}
        pending={!!pending}
        onClick={() => run({ type: 'chime.test', chimeId }, { pending: 'Playing…', success: 'Test sound sent' })}
      >
        Play test sound
      </Button>
    </Section>
  );
}
