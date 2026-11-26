/**
 * Commands — every action the interface can request.
 *
 * Commands are plain data. They are validated (validateCommand) before any
 * data source receives them, so the same safety checks will apply when the
 * Home Assistant data source replaces sample data.
 */
import type { ClimatePreset, FanMode, FanSpeed, HomeSnapshot, HvacMode, BodyId } from './types';
import type { HomeConfig } from '@/config/schema';

export type Command =
  | { type: 'light.set'; lightId: string; on?: boolean; brightness?: number; colorTempK?: number }
  | { type: 'lights.setArea'; areaId: string; on: boolean }
  | { type: 'lights.allOff' }
  | { type: 'fan.set'; fanId: string; on?: boolean; speed?: FanSpeed }
  | { type: 'scene.activate'; sceneId: string }
  | { type: 'climate.setMode'; zoneId: string; mode: HvacMode }
  | { type: 'climate.setSetpoints'; zoneId: string; heat?: number; cool?: number }
  | { type: 'climate.setFan'; zoneId: string; fan: FanMode }
  | { type: 'climate.setPreset'; zoneId: string; preset: ClimatePreset }
  | { type: 'climate.resumeSchedule'; zoneId: string }
  | { type: 'pool.setHeater'; body: BodyId; enabled?: boolean; setpoint?: number }
  | { type: 'pool.setEquipment'; equipmentId: string; on?: boolean; speedPct?: number; outputPct?: number }
  | { type: 'pool.setLightShow'; equipmentId: string; show: string }
  | { type: 'pool.setSpaMode'; on: boolean }
  | { type: 'chime.setVolume'; chimeId: string; volume: number }
  | { type: 'chime.test'; chimeId: string };

export class CommandError extends Error {
  constructor(
    message: string,
    /** 'validation' = blocked before sending; 'device' = the system rejected or timed out. */
    readonly kind: 'validation' | 'device' | 'connection' = 'device',
  ) {
    super(message);
    this.name = 'CommandError';
  }
}

/** Key identifying what a command targets — used to show a pending state on that control. */
export function commandTarget(cmd: Command): string {
  switch (cmd.type) {
    case 'light.set':
      return `light:${cmd.lightId}`;
    case 'lights.setArea':
      return `area:${cmd.areaId}`;
    case 'lights.allOff':
      return 'lights:all';
    case 'fan.set':
      return `fan:${cmd.fanId}`;
    case 'scene.activate':
      return `scene:${cmd.sceneId}`;
    case 'climate.setMode':
      return `climate:${cmd.zoneId}:mode`;
    case 'climate.setSetpoints':
      return `climate:${cmd.zoneId}:setpoint`;
    case 'climate.setFan':
      return `climate:${cmd.zoneId}:fan`;
    case 'climate.setPreset':
    case 'climate.resumeSchedule':
      return `climate:${cmd.zoneId}:preset`;
    case 'pool.setHeater':
      return `heater:${cmd.body}`;
    case 'pool.setEquipment':
    case 'pool.setLightShow':
      return `equipment:${cmd.equipmentId}`;
    case 'pool.setSpaMode':
      return 'pool:spaMode';
    case 'chime.setVolume':
    case 'chime.test':
      return `chime:${cmd.chimeId}`;
  }
}

const inRange = (v: number, min: number, max: number) => Number.isFinite(v) && v >= min && v <= max;

/**
 * Checks a command against the current state and the configured safety limits.
 * Throws CommandError('validation') if it must not be sent.
 */
export function validateCommand(cmd: Command, s: HomeSnapshot, config: HomeConfig): void {
  if (s.connection.status !== 'connected') {
    throw new CommandError('Not connected. The command was not sent.', 'connection');
  }
  const deviceAvailable = (deviceId: string, label: string) => {
    const d = s.devices.find((x) => x.id === deviceId);
    if (!d) throw new CommandError(`${label} is not a known device.`, 'validation');
    if (d.availability !== 'online') {
      throw new CommandError(`${d.name} is ${d.availability}. The command was not sent.`, 'validation');
    }
  };

  switch (cmd.type) {
    case 'light.set': {
      const l = s.lights.find((x) => x.id === cmd.lightId);
      if (!l) throw new CommandError('Unknown light.', 'validation');
      deviceAvailable(l.deviceId, l.name);
      if (cmd.brightness !== undefined) {
        if (!l.capabilities.brightness) throw new CommandError(`${l.name} doesn't support dimming.`, 'validation');
        if (!inRange(cmd.brightness, 1, 100)) throw new CommandError('Brightness must be 1–100 %.', 'validation');
      }
      if (cmd.colorTempK !== undefined) {
        const ct = l.capabilities.colorTemp;
        if (!ct) throw new CommandError(`${l.name} doesn't support colour temperature.`, 'validation');
        if (!inRange(cmd.colorTempK, ct.minK, ct.maxK)) {
          throw new CommandError(`Colour temperature must be ${ct.minK}–${ct.maxK} K.`, 'validation');
        }
      }
      return;
    }
    case 'fan.set': {
      const f = s.fans.find((x) => x.id === cmd.fanId);
      if (!f) throw new CommandError('Unknown fan.', 'validation');
      deviceAvailable(f.deviceId, f.name);
      if (cmd.speed !== undefined && !f.speeds.includes(cmd.speed)) {
        throw new CommandError(`${f.name} doesn't support that speed.`, 'validation');
      }
      return;
    }
    case 'lights.setArea':
    case 'lights.allOff':
      return; // unreachable lights are skipped by the source and reported
    case 'scene.activate':
      if (!s.scenes.some((x) => x.id === cmd.sceneId)) throw new CommandError('Unknown scene.', 'validation');
      return;
    case 'climate.setMode':
    case 'climate.setSetpoints':
    case 'climate.setFan':
    case 'climate.setPreset':
    case 'climate.resumeSchedule': {
      const sys = s.climate.find((c) => c.zones.some((z) => z.id === cmd.zoneId));
      const zone = sys?.zones.find((z) => z.id === cmd.zoneId);
      if (!sys || !zone) throw new CommandError('Unknown climate zone.', 'validation');
      deviceAvailable(sys.deviceId, sys.name);
      if (cmd.type === 'climate.setMode' && !zone.supportedModes.includes(cmd.mode)) {
        throw new CommandError(`Mode "${cmd.mode}" isn't supported by this system.`, 'validation');
      }
      if (cmd.type === 'climate.setSetpoints') {
        const { minF, maxF, minGapF } = config.safety.thermostat;
        const heat = cmd.heat ?? zone.heatSetpoint;
        const cool = cmd.cool ?? zone.coolSetpoint;
        if (!inRange(heat, minF, maxF) || !inRange(cool, minF, maxF)) {
          throw new CommandError(`Setpoints must be between ${minF}° and ${maxF}°.`, 'validation');
        }
        // The heat/cool gap only matters when the system can do both (Auto).
        if (zone.mode === 'auto' && cool - heat < minGapF) {
          throw new CommandError(`Cool setpoint must be at least ${minGapF}° above heat.`, 'validation');
        }
      }
      return;
    }
    case 'pool.setHeater': {
      const pool = s.pool;
      const body = pool?.bodies.find((b) => b.id === cmd.body);
      if (!pool || !body) throw new CommandError('Unknown body of water.', 'validation');
      deviceAvailable(pool.controllerDeviceId, 'Pool controller');
      if (cmd.setpoint !== undefined) {
        const [min, max] = config.safety[cmd.body].setpointF;
        if (!inRange(cmd.setpoint, min, max)) {
          throw new CommandError(`${body.name} setpoint must be ${min}°–${max}°.`, 'validation');
        }
      }
      return;
    }
    case 'pool.setEquipment':
    case 'pool.setLightShow': {
      const eq = s.pool?.equipment.find((e) => e.id === cmd.equipmentId);
      if (!s.pool || !eq) throw new CommandError('Unknown equipment.', 'validation');
      deviceAvailable(eq.deviceId, eq.name);
      if (s.pool.serviceMode) throw new CommandError('The controller is in service mode.', 'validation');
      if (cmd.type === 'pool.setEquipment' && cmd.speedPct !== undefined) {
        const { minPct, maxPct } = config.safety.pumpSpeed;
        if (!inRange(cmd.speedPct, minPct, maxPct)) {
          throw new CommandError(`Pump speed must be ${minPct}–${maxPct} %.`, 'validation');
        }
      }
      if (cmd.type === 'pool.setEquipment' && cmd.outputPct !== undefined && !inRange(cmd.outputPct, 0, 100)) {
        throw new CommandError('Chlorinator output must be 0–100 %.', 'validation');
      }
      if (cmd.type === 'pool.setLightShow' && !eq.shows?.includes(cmd.show)) {
        throw new CommandError('That light show is not available.', 'validation');
      }
      return;
    }
    case 'pool.setSpaMode':
      if (!s.pool) throw new CommandError('No pool system.', 'validation');
      deviceAvailable(s.pool.controllerDeviceId, 'Pool controller');
      return;
    case 'chime.setVolume':
    case 'chime.test': {
      const c = s.security.chimes.find((x) => x.id === cmd.chimeId);
      if (!c) throw new CommandError('Unknown chime.', 'validation');
      deviceAvailable(c.deviceId, c.name);
      if (cmd.type === 'chime.setVolume' && !inRange(cmd.volume, 0, 10)) {
        throw new CommandError('Volume must be 0–10.', 'validation');
      }
      return;
    }
  }
}
