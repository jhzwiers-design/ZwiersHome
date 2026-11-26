/**
 * SampleDataSource — an in-memory simulation for the Milestone 1 prototype.
 *
 * It never opens a network connection and cannot reach any real device.
 * It simulates the behaviour the real source will have, so the interface can
 * be designed against it: connection start-up, command latency, acknowledged
 * and failed commands, live value changes, connection loss and new events.
 */
import { CommandError, type Command } from '../commands';
import type { CommandResult, DataSource, PrototypeControls } from '../source';
import type { Body, ClimateZone, HomeSnapshot, PoolSystem } from '../types';
import { createSampleSnapshot } from './sampleData';

type Listener = (s: HomeSnapshot) => void;

const PRESETS = {
  home: { heat: 71, cool: 76 },
  away: { heat: 62, cool: 82 },
  sleep: { heat: 67, cool: 78 },
  wake: { heat: 70, cool: 76 },
} as const;

export class SampleDataSource implements DataSource, PrototypeControls {
  readonly kind = 'sample' as const;

  private s: HomeSnapshot = createSampleSnapshot();
  private listeners = new Set<Listener>();
  private failAll = false;
  private flakyAttempts = 0;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private tick: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly latencyMs: readonly [number, number] = [450, 1100]) {}

  // ── DataSource ────────────────────────────────────────────────────────────

  connect(): Promise<void> {
    this.emit();
    return new Promise((resolve) => {
      this.later(900, () => {
        this.update((d) => (d.connection = { status: 'connected', since: Date.now() }));
        this.startTicking();
        resolve();
      });
    });
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.s);
    return () => this.listeners.delete(listener);
  }

  async execute(cmd: Command): Promise<CommandResult> {
    await sleep(rand(this.latencyMs[0], this.latencyMs[1]));

    if (this.s.connection.status !== 'connected') {
      throw new CommandError('Connection lost before the command was acknowledged.', 'connection');
    }
    if (this.failAll) {
      throw new CommandError(`${systemName(cmd)} didn't acknowledge within 10 s (simulated failure).`);
    }
    // One realistic flaky device (prototype demo): the Screen Porch switch
    // fails every other attempt.
    if (cmd.type === 'light.set' && cmd.lightId === 'l-screen-porch') {
      this.flakyAttempts += 1;
      if (this.flakyAttempts % 2 === 1) {
        throw new CommandError("Screen Porch didn't acknowledge. It may be out of range of the hub; try again.");
      }
    }

    let note: string | undefined;
    this.update((d) => {
      note = apply(d, cmd);
    });
    return { note };
  }

  disconnect(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    if (this.tick) clearInterval(this.tick);
    this.tick = null;
  }

  // ── Prototype controls ────────────────────────────────────────────────────

  setSimulatedFailures(on: boolean): void {
    this.failAll = on;
  }

  simulateConnectionLoss(seconds: number): void {
    this.update((d) => (d.connection = { status: 'disconnected', since: Date.now() }));
    this.later(seconds * 1000, () => {
      this.update((d) => (d.connection = { status: 'reconnecting', since: Date.now() }));
      this.later(1600, () => {
        this.update((d) => {
          d.connection = { status: 'connected', since: Date.now() };
          refreshTimestamps(d);
        });
      });
    });
  }

  simulateDoorbellPress(): void {
    if (this.s.connection.status !== 'connected') return;
    const cam = this.s.security.cameras[0];
    if (!cam) return;
    const now = Date.now();
    this.update((d) => {
      d.security.events = [
        { id: `ev-${now}`, cameraId: cam.id, kind: 'ding', at: now },
        { id: `ev-${now}-m`, cameraId: cam.id, kind: 'motion', at: now - 8000 },
        ...d.security.events,
      ];
    });
  }

  reset(): void {
    this.disconnect();
    this.flakyAttempts = 0;
    this.s = createSampleSnapshot();
    void this.connect();
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private startTicking() {
    if (this.tick) return;
    this.tick = setInterval(() => {
      if (this.s.connection.status !== 'connected') return;
      this.update((d) => {
        simulatePhysics(d);
        refreshTimestamps(d);
      });
    }, 10_000);
  }

  /** Copy-on-write update, then notify listeners with the new snapshot. */
  private update(mutate: (draft: HomeSnapshot) => void) {
    const draft = structuredClone(this.s);
    mutate(draft);
    this.s = draft;
    this.emit();
  }

  private emit() {
    for (const l of this.listeners) l(this.s);
  }

  private later(ms: number, fn: () => void) {
    this.timers.push(setTimeout(fn, ms));
  }
}

// ── Command application ─────────────────────────────────────────────────────

function apply(d: HomeSnapshot, cmd: Command): string | undefined {
  const now = Date.now();
  const online = (deviceId: string) => d.devices.find((x) => x.id === deviceId)?.availability === 'online';
  const touch = (deviceId: string) => {
    const dev = d.devices.find((x) => x.id === deviceId);
    if (dev) dev.lastSeen = now;
  };

  switch (cmd.type) {
    case 'light.set': {
      const l = d.lights.find((x) => x.id === cmd.lightId)!;
      if (cmd.on !== undefined) l.on = cmd.on;
      if (cmd.brightness !== undefined) {
        l.brightness = cmd.brightness;
        l.on = true;
      }
      if (cmd.colorTempK !== undefined) l.colorTempK = cmd.colorTempK;
      l.lastChanged = now;
      touch(l.deviceId);
      return;
    }
    case 'lights.setArea':
    case 'lights.allOff': {
      const targets = d.lights.filter((l) => (cmd.type === 'lights.allOff' ? true : l.areaId === cmd.areaId));
      const on = cmd.type === 'lights.setArea' ? cmd.on : false;
      const skipped: string[] = [];
      for (const l of targets) {
        if (!online(l.deviceId)) {
          skipped.push(l.name);
          continue;
        }
        l.on = on;
        l.lastChanged = now;
        touch(l.deviceId);
      }
      return skipped.length ? `Skipped ${skipped.length} unreachable: ${skipped.join(', ')}` : undefined;
    }
    case 'scene.activate': {
      const scene = d.scenes.find((x) => x.id === cmd.sceneId)!;
      const skipped: string[] = [];
      for (const [id, t] of Object.entries(scene.targets)) {
        const l = d.lights.find((x) => x.id === id);
        if (!l) continue;
        if (!online(l.deviceId)) {
          skipped.push(l.name);
          continue;
        }
        l.on = t.on;
        if (t.brightness !== undefined && l.capabilities.brightness) l.brightness = t.brightness;
        if (t.colorTempK !== undefined && l.capabilities.colorTemp) l.colorTempK = t.colorTempK;
        l.lastChanged = now;
        touch(l.deviceId);
      }
      return skipped.length ? `Skipped unreachable: ${skipped.join(', ')}` : undefined;
    }
    case 'climate.setMode':
    case 'climate.setSetpoints':
    case 'climate.setFan':
    case 'climate.setPreset':
    case 'climate.resumeSchedule': {
      const zone = d.climate.flatMap((c) => c.zones).find((z) => z.id === cmd.zoneId)!;
      if (cmd.type === 'climate.setMode') zone.mode = cmd.mode;
      if (cmd.type === 'climate.setSetpoints') {
        if (cmd.heat !== undefined) zone.heatSetpoint = cmd.heat;
        if (cmd.cool !== undefined) zone.coolSetpoint = cmd.cool;
        zone.hold = true;
        zone.preset = 'manual';
      }
      if (cmd.type === 'climate.setFan') zone.fanMode = cmd.fan;
      if (cmd.type === 'climate.setPreset' && cmd.preset !== 'manual') {
        zone.preset = cmd.preset;
        zone.heatSetpoint = PRESETS[cmd.preset].heat;
        zone.coolSetpoint = PRESETS[cmd.preset].cool;
        zone.hold = true;
      }
      if (cmd.type === 'climate.resumeSchedule') {
        zone.preset = 'home';
        zone.heatSetpoint = PRESETS.home.heat;
        zone.coolSetpoint = PRESETS.home.cool;
        zone.hold = false;
      }
      zone.action = hvacAction(zone);
      zone.lastUpdated = now;
      return;
    }
    case 'pool.setHeater': {
      const body = d.pool!.bodies.find((b) => b.id === cmd.body)!;
      if (cmd.enabled !== undefined) body.heater.enabled = cmd.enabled;
      if (cmd.setpoint !== undefined) body.heater.setpoint = cmd.setpoint;
      recomputePool(d.pool!);
      body.lastUpdated = now;
      return;
    }
    case 'pool.setEquipment': {
      const eq = d.pool!.equipment.find((e) => e.id === cmd.equipmentId)!;
      if (cmd.on !== undefined) eq.on = cmd.on;
      if (cmd.speedPct !== undefined) {
        eq.speedPct = cmd.speedPct;
        eq.on = true;
      }
      if (cmd.outputPct !== undefined) eq.outputPct = cmd.outputPct;
      touch(eq.deviceId);
      recomputePool(d.pool!);
      return;
    }
    case 'pool.setLightShow': {
      const eq = d.pool!.equipment.find((e) => e.id === cmd.equipmentId)!;
      eq.show = cmd.show;
      eq.on = true;
      touch(eq.deviceId);
      return;
    }
    case 'pool.setSpaMode': {
      d.pool!.spaMode = cmd.on;
      recomputePool(d.pool!);
      return cmd.on ? 'Valves moved to spa; pool circulation paused' : 'Valves returned to pool';
    }
    case 'chime.setVolume': {
      const c = d.security.chimes.find((x) => x.id === cmd.chimeId)!;
      c.volume = cmd.volume;
      touch(c.deviceId);
      return;
    }
    case 'chime.test':
      return 'No sound played: prototype';
  }
}

function hvacAction(z: ClimateZone): ClimateZone['action'] {
  const needsHeat = z.currentTemp < z.heatSetpoint - 0.4;
  const needsCool = z.currentTemp > z.coolSetpoint + 0.4;
  switch (z.mode) {
    case 'heat':
      return needsHeat ? 'heating' : 'idle';
    case 'cool':
      return needsCool ? 'cooling' : 'idle';
    case 'auto':
      return needsHeat ? 'heating' : needsCool ? 'cooling' : 'idle';
    case 'fan_only':
      return 'fan';
    case 'off':
      return 'off';
  }
}

function recomputePool(p: PoolSystem) {
  const filter = p.equipment.find((e) => e.type === 'pump' && e.body === 'pool');
  const circulating = !!filter?.on;
  for (const b of p.bodies) {
    b.flow = circulating && (b.id === 'spa' ? p.spaMode : !p.spaMode);
    b.heater.state = heaterState(b);
  }
}

function heaterState(b: Body): Body['heater']['state'] {
  if (!b.heater.enabled) return 'off';
  if (!b.flow || b.waterTemp === null) return 'idle';
  return b.waterTemp < b.heater.setpoint - 0.5 ? 'heating' : 'idle';
}

/** Gentle, believable drift so the interface shows live changes. */
function simulatePhysics(d: HomeSnapshot) {
  for (const z of d.climate.flatMap((c) => c.zones)) {
    if (z.action === 'heating') z.currentTemp = round1(z.currentTemp + 0.1);
    else if (z.action === 'cooling') z.currentTemp = round1(z.currentTemp - 0.1);
    else if (z.mode !== 'off') z.currentTemp = round1(z.currentTemp + (Math.random() - 0.5) * 0.1);
    z.action = hvacAction(z);
  }
  if (d.pool) {
    for (const b of d.pool.bodies) {
      if (b.waterTemp === null) continue;
      if (b.heater.state === 'heating') b.waterTemp = round1(b.waterTemp + (b.id === 'spa' ? 0.3 : 0.05));
      else if (b.id === 'spa' && b.waterTemp > (d.pool.airTemp ?? 60) + 10) b.waterTemp = round1(b.waterTemp - 0.02);
    }
    recomputePool(d.pool);
  }
}

function refreshTimestamps(d: HomeSnapshot) {
  const now = Date.now();
  for (const dev of d.devices) if (dev.availability === 'online') dev.lastSeen = now - Math.random() * 20_000;
  for (const i of d.integrations) if (i.status !== 'not_configured') i.lastUpdated = now;
  for (const z of d.climate.flatMap((c) => c.zones)) z.lastUpdated = now;
  if (d.pool) for (const b of d.pool.bodies) b.lastUpdated = now;
}

function systemName(cmd: Command): string {
  if (cmd.type.startsWith('light') || cmd.type.startsWith('scene')) return 'SmartThings';
  if (cmd.type.startsWith('climate')) return 'Carrier';
  if (cmd.type.startsWith('pool')) return 'OmniLogic';
  return 'Ring';
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const round1 = (n: number) => Math.round(n * 10) / 10;
