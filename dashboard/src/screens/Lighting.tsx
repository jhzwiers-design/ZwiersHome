/**
 * Lighting — every light grouped by area (from Home Assistant Areas),
 * scenes, area-level on/off and filters.
 */
import { useState } from 'react';
import { LightRow } from '@/components/domain/LightRow';
import { Segmented } from '@/components/controls';
import { Lightbulb, Map, Sparkles } from 'lucide-react';
import { HomeMap, roomStats } from '@/components/domain/HomeMap';
import { floorPlan } from '@/config/floorplan';
import { PageHeader, Section, Stack } from '@/components/layout-parts';
import { Button } from '@/components/primitives';
import type { HomeSnapshot } from '@/data/types';
import { availabilityOf, lightingSummary, lightsByArea } from '@/lib/selectors';
import { useHome, usePendingKey } from '@/store/home';
import { SceneButton } from './Overview';

type Filter = 'all' | 'on' | 'unreachable';

export function Lighting({ s }: { s: HomeSnapshot }) {
  const config = useHome((st) => st.config)!;
  const [filter, setFilter] = useState<Filter>('all');
  const [room, setRoom] = useState<string | null>(
    () => floorPlan.rooms.find((r) => roomStats(s, r.areaId).on > 0)?.areaId ?? floorPlan.rooms[0]?.areaId ?? null,
  );
  const sum = lightingSummary(s);
  const connected = s.connection.status === 'connected';

  const groups = lightsByArea(s, config.areaOrder)
    .map((g) => ({
      ...g,
      lights: g.lights.filter((l) => {
        const reachable = availabilityOf(s, l.deviceId) === 'online';
        if (filter === 'on') return l.on && reachable;
        if (filter === 'unreachable') return !reachable;
        return true;
      }),
    }))
    .filter((g) => g.lights.length > 0);

  return (
    <Stack tone="lighting">
      <PageHeader
        title="Lighting"
        summary={
          <>
            <span className="num text-fg">{sum.on}</span> of {sum.total} on
            {sum.unreachable > 0 && <span className="text-danger"> · {sum.unreachable} unreachable</span>}
          </>
        }
        actions={
          <Segmented<Filter>
            label="Filter lights"
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

      <Section title="Scenes" subtitle="SmartThings lights only" icon={Sparkles}>
        <ul className="rail sm:grid sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
          {s.scenes.map((sc) => (
            <li key={sc.id} className="flex w-[72%] shrink-0 snap-start flex-col items-start gap-3 rounded-md border border-rule bg-surface-2 p-4 sm:w-auto">
              <SceneButton id={sc.id} name={sc.name} disabled={!connected} />
              <p className="text-label text-muted">{sc.description}</p>
            </li>
          ))}
        </ul>
      </Section>

      {groups.length === 0 && <p className="tile p-8 text-center text-body text-muted">No lights match this filter.</p>}

      <h2 className="mt-2 text-h2 font-medium tracking-[-0.02em] text-fg">All rooms</h2>
      <div className="grid grid-cols-1 gap-4 md:gap-5 xl:grid-cols-2">
        {groups.map(({ area, lights }) => {
          const on = lights.filter((l) => l.on && availabilityOf(s, l.deviceId) === 'online').length;
          return (
            <Section
              key={area.id}
              title={area.name}
              subtitle={`${on} of ${lights.length} on`}
              icon={Lightbulb}
              iconActive={on > 0}
              meta={<AreaActions areaId={area.id} areaName={area.name} s={s} />}
            >
              <div>
                {lights.map((l) => (
                  <LightRow key={l.id} light={l} />
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
  const st = roomStats(s, area.id);
  return (
    <Section
      title={area.name}
      subtitle={lights.length ? `${st.on} of ${lights.length} on${st.unreachable ? ` · ${st.unreachable} unreachable` : ''}` : 'No lights'}
      icon={Lightbulb}
      iconActive={st.on > 0}
      meta={lights.length > 0 && <AreaActions areaId={area.id} areaName={area.name} s={s} />}
      className={className}
    >
      <div aria-live="polite">
        {lights.length === 0 ? (
          <p className="text-body text-muted">No lights are assigned to this room yet. In Home Assistant, assign a light to the “{area.name}” area and it will appear here.</p>
        ) : (
          lights.map((l) => <LightRow key={l.id} light={l} />)
        )}
      </div>
    </Section>
  );
}
