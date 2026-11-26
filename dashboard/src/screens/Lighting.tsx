/**
 * Lights & fans — every light and fan grouped by area (from Home Assistant
 * Areas), scenes, area-level light on/off and filters.
 */
import { useState } from 'react';
import { FanRow } from '@/components/domain/FanRow';
import { CameraView } from '@/components/domain/SecurityParts';
import { LightRow } from '@/components/domain/LightRow';
import { Segmented } from '@/components/controls';
import { Lightbulb, Map, Sparkles } from 'lucide-react';
import { HomeMap, roomStats } from '@/components/domain/HomeMap';
import { floorPlan } from '@/config/floorplan';
import { PageHeader, Section, Stack } from '@/components/layout-parts';
import { Button } from '@/components/primitives';
import type { Fan, HomeSnapshot } from '@/data/types';
import { availabilityOf, fanSummary, lightingSummary, sortAreas } from '@/lib/selectors';
import { useHome, usePendingKey } from '@/store/home';
import { SceneButton } from '@/components/domain/Scenes';

type Filter = 'all' | 'on' | 'unreachable';

export function Lighting({ s }: { s: HomeSnapshot }) {
  const config = useHome((st) => st.config)!;
  const [filter, setFilter] = useState<Filter>('all');
  const [room, setRoom] = useState<string | null>(
    () => floorPlan.rooms.find((r) => roomStats(s, r.areaId).on > 0)?.areaId ?? floorPlan.rooms[0]?.areaId ?? null,
  );
  const sum = lightingSummary(s);
  const fans = fanSummary(s);
  const connected = s.connection.status === 'connected';

  const keep = (x: { on: boolean; deviceId: string }) => {
    const reachable = availabilityOf(s, x.deviceId) === 'online';
    if (filter === 'on') return x.on && reachable;
    if (filter === 'unreachable') return !reachable;
    return true;
  };
  const groups = sortAreas(s.areas, config.areaOrder)
    .map((area) => ({
      area,
      allLights: s.lights.filter((l) => l.areaId === area.id),
      lights: s.lights.filter((l) => l.areaId === area.id && keep(l)),
      fans: s.fans.filter((f) => f.areaId === area.id && keep(f)),
    }))
    .filter((g) => g.lights.length + g.fans.length > 0);

  return (
    <Stack tone="lighting">
      <PageHeader
        title="Lights & fans"
        summary={
          <>
            <span className="num text-fg">{sum.on}</span> of {sum.total} lights on
            {fans.total > 0 && (
              <>
                {' · '}
                <span className="num text-fg">{fans.on}</span> of {fans.total} fans on
              </>
            )}
            {sum.unreachable > 0 && <span className="text-danger"> · {sum.unreachable} unreachable</span>}
          </>
        }
        actions={
          <Segmented<Filter>
            label="Filter lights and fans"
            size="sm"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'on', label: 'On' },
              { value: 'unreachable', label: 'Unreachable' },
            ]}
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-12">
        <Section title="Home map" subtitle="Select a room" icon={Map} className="lg:col-span-8">
          <HomeMap s={s} selected={room} onSelect={setRoom} />
        </Section>
        <RoomPanel s={s} areaId={room} className="lg:col-span-4" />
      </div>

      <Section title="Scenes" subtitle="One tap sets several lights" icon={Sparkles}>
        <div className="rail sm:grid sm:grid-cols-2 sm:gap-3 xl:grid-cols-3">
          {s.scenes.map((sc) => (
            <SceneButton key={sc.id} scene={sc} disabled={!connected} showDescription size="lg" />
          ))}
        </div>
      </Section>

      {groups.length === 0 && <p className="tile p-8 text-center text-body text-muted">Nothing matches this filter.</p>}

      <h2 className="mt-2 text-h2 font-medium tracking-[-0.02em] text-fg">All rooms</h2>
      <div className="grid grid-cols-1 gap-4 md:gap-5 xl:grid-cols-2">
        {groups.map(({ area, allLights, lights, fans: roomFans }) => {
          const on = allLights.filter((l) => l.on && availabilityOf(s, l.deviceId) === 'online').length;
          return (
            <Section
              key={area.id}
              title={area.name}
              subtitle={roomSubtitle(on, allLights.length, s.fans.filter((f) => f.areaId === area.id))}
              icon={Lightbulb}
              iconActive={on > 0}
              meta={allLights.length > 0 && <AreaActions areaId={area.id} areaName={area.name} s={s} />}
            >
              <div>
                {lights.map((l) => (
                  <LightRow key={l.id} light={l} />
                ))}
                {roomFans.map((f) => (
                  <FanRow key={f.id} fan={f} />
                ))}
              </div>
            </Section>
          );
        })}
      </div>
    </Stack>
  );
}

function AreaActions({ areaId, areaName, s }: { areaId: string; areaName: string; s: HomeSnapshot }) {
  const run = useHome((st) => st.run);
  const pending = usePendingKey(`area:${areaId}`);
  const lights = s.lights.filter((l) => l.areaId === areaId && availabilityOf(s, l.deviceId) === 'online');
  const anyOn = lights.some((l) => l.on);
  const disabled = s.connection.status !== 'connected' || lights.length === 0;
  return (
    <Button
      size="sm"
      variant="quiet"
      pending={!!pending}
      disabled={disabled}
      aria-label={`Turn ${anyOn ? 'off' : 'on'} all ${areaName} lights`}
      onClick={() =>
        run({ type: 'lights.setArea', areaId, on: !anyOn }, { pending: 'Sending…', success: `${areaName} ${anyOn ? 'off' : 'on'}` })
      }
    >
      {anyOn ? 'All off' : 'All on'}
    </Button>
  );
}

/** Lights for the room selected on the map. */
function RoomPanel({ s, areaId, className }: { s: HomeSnapshot; areaId: string | null; className?: string }) {
  const area = s.areas.find((a) => a.id === areaId);
  if (!area) {
    return (
      <Section title="Room" icon={Lightbulb} className={className}>
        <p className="text-body text-muted">Select a room on the map.</p>
      </Section>
    );
  }
  const lights = s.lights.filter((l) => l.areaId === area.id);
  const roomFans = s.fans.filter((f) => f.areaId === area.id);
  const roomCams = s.security.cameras.filter((c) => c.areaId === area.id);
  const st = roomStats(s, area.id);
  return (
    <Section
      title={area.name}
      subtitle={
        lights.length || roomFans.length
          ? `${roomSubtitle(st.on, lights.length, roomFans)}${st.unreachable ? ` · ${st.unreachable} unreachable` : ''}`
          : roomCams.length
            ? `${roomCams.length === 1 ? 'Camera' : `${roomCams.length} cameras`} · no lights`
            : 'No lights'
      }
      icon={Lightbulb}
      iconActive={st.on > 0}
      meta={lights.length > 0 && <AreaActions areaId={area.id} areaName={area.name} s={s} />}
      className={className}
    >
      <div aria-live="polite">
        {/* Camera preview first, then the room's lights and fans. */}
        {roomCams.length > 0 && (
          <div key={area.id} className="animate-zh-in mb-3 space-y-3">
            {roomCams.map((c) => (
              <CameraView key={c.id} camera={c} compact />
            ))}
          </div>
        )}
        {lights.length + roomFans.length === 0 ? (
          roomCams.length ? null : (
          <p className="text-body text-muted">No lights are assigned to this room yet. In Home Assistant, assign a light to the “{area.name}” area and it will appear here.</p>
          )
        ) : (
          <>
            {lights.map((l) => (
              <LightRow key={l.id} light={l} />
            ))}
            {roomFans.map((f) => (
              <FanRow key={f.id} fan={f} />
            ))}
          </>
        )}
      </div>
    </Section>
  );
}

/** "1 of 2 lights on · fan on" */
function roomSubtitle(on: number, total: number, fans: Fan[]) {
  const parts: string[] = [];
  if (total) parts.push(`${on} of ${total} ${total === 1 ? 'light' : 'lights'} on`);
  if (fans.length === 1) parts.push(`fan ${fans[0]!.on ? 'on' : 'off'}`);
  else if (fans.length > 1) parts.push(`${fans.filter((f) => f.on).length} of ${fans.length} fans on`);
  return parts.join(' · ');
}
