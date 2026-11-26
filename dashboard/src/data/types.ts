/**
 * Domain model — what the interface understands.
 *
 * Screens only ever see these types. Each data source (sample data now,
 * Home Assistant in Milestone 2) is responsible for translating its raw data
 * into this shape. That keeps the UI independent of Home Assistant entity
 * formats and free of hard-coded device IDs.
 *
 * Temperatures are always stored in °F (the units the equipment reports);
 * conversion to °C happens only at display time.
 */

/** Whether a device can be reached. Independent of whether it is on or off. */
export type Availability =
  /** Reachable and reporting. */
  | 'online'
  /** The device itself can't be reached (e.g. bulb powered off at the wall, out of range). */
  | 'offline'
  /** Its integration/service can't report a state, so the state is unknown. */
  | 'unavailable';

export type IntegrationId = 'smartthings' | 'carrier' | 'omnilogic' | 'ring' | 'dolphin';

export interface Integration {
  id: IntegrationId;
  name: string;
  /** Which Home Assistant integration would provide it, and its support level. */
  provider: string;
  support: 'built-in' | 'community';
  transport: 'cloud' | 'local';
  status: 'connected' | 'degraded' | 'disconnected' | 'not_configured';
  detail?: string;
  lastUpdated: number | null;
}

export type DeviceCategory = 'light' | 'fan' | 'media' | 'climate' | 'pool' | 'security' | 'hub' | 'cleaner';

export type Protocol = 'Zigbee' | 'Z-Wave' | 'Wi-Fi' | 'Ethernet' | 'Thread' | 'Cloud' | 'Unknown';

export interface Area {
  id: string;
  name: string;
}

/** A physical device, as listed on the Devices screen. */
export interface Device {
  id: string;
  name: string;
  areaId: string | null;
  category: DeviceCategory;
  integration: IntegrationId;
  manufacturer: string;
  model: string;
  protocol: Protocol;
  availability: Availability;
  /** Last time the device reported anything. */
  lastSeen: number | null;
  /** Human-readable problem description, if any. */
  issue?: string;
  /** Expected maximum seconds between updates. Older data is shown as stale. */
  staleAfterSec: number;
}

// ── Lighting ────────────────────────────────────────────────────────────────

export interface Light {
  id: string;
  deviceId: string;
  name: string;
  areaId: string;
  on: boolean;
  /** 1–100, or null when the light doesn't support dimming. */
  brightness: number | null;
  /** Kelvin, or null when unsupported. */
  colorTempK: number | null;
  capabilities: {
    brightness: boolean;
    colorTemp: { minK: number; maxK: number } | null;
  };
  lastChanged: number;
}

export type FanSpeed = 'low' | 'medium' | 'high';

/** A ceiling or room fan on a wall control. */
export interface Fan {
  id: string;
  deviceId: string;
  name: string;
  areaId: string;
  on: boolean;
  /** Current speed, or null when the control is on/off only. */
  speed: FanSpeed | null;
  /** Speeds the control supports; empty = on/off only. */
  speeds: FanSpeed[];
  /** "All Off" also turns this fan off (the Master Bedroom fan is left alone). */
  inAllOff: boolean;
  lastChanged: number;
}

export type SceneIcon = 'arrive' | 'leave' | 'evening' | 'movie' | 'night' | 'off';

export interface Scene {
  id: string;
  name: string;
  description: string;
  icon: SceneIcon;
  /** Target state per light id. Lights not listed are left unchanged. */
  targets: Record<string, { on: boolean; brightness?: number; colorTempK?: number }>;
}

// ── Climate ─────────────────────────────────────────────────────────────────

export type HvacMode = 'heat' | 'cool' | 'auto' | 'fan_only' | 'off';
export type HvacAction = 'heating' | 'cooling' | 'idle' | 'fan' | 'off';
export type FanMode = 'auto' | 'low' | 'med' | 'high';
export type ClimatePreset = 'home' | 'away' | 'sleep' | 'wake' | 'manual';

export interface ClimateZone {
  id: string;
  name: string;
  currentTemp: number;
  humidity: number | null;
  mode: HvacMode;
  action: HvacAction;
  heatSetpoint: number;
  coolSetpoint: number;
  fanMode: FanMode;
  preset: ClimatePreset;
  /** True when a manual hold is overriding the schedule. */
  hold: boolean;
  supportedModes: HvacMode[];
  lastUpdated: number;
}

export interface ClimateSystem {
  id: string;
  deviceId: string;
  name: string;
  outdoorTemp: number | null;
  filterLifePct: number | null;
  airflowCfm: number | null;
  blowerRpm: number | null;
  staticPressureInWc: number | null;
  stage: string | null;
  energyTodayKwh: number | null;
  zones: ClimateZone[];
}

// ── Pool & spa ──────────────────────────────────────────────────────────────

export type BodyId = 'pool' | 'spa';

export interface Heater {
  id: string;
  deviceId: string;
  kind: string;
  enabled: boolean;
  setpoint: number;
  min: number;
  max: number;
  state: 'heating' | 'idle' | 'off';
}

export interface Body {
  id: BodyId;
  name: string;
  waterTemp: number | null;
  /** Flow sensor: water is moving through this body's plumbing. */
  flow: boolean;
  heater: Heater;
  lastUpdated: number;
}

export type EquipmentType = 'pump' | 'light' | 'relay' | 'chlorinator';

export interface PoolEquipment {
  id: string;
  deviceId: string;
  body: BodyId | 'shared';
  type: EquipmentType;
  name: string;
  on: boolean;
  /** Variable-speed pumps: current speed 0–100 %. */
  speedPct?: number;
  speedPresets?: { low: number; med: number; high: number };
  /** ColorLogic lights */
  show?: string;
  shows?: string[];
  /** Chlorinator output % */
  outputPct?: number;
  description?: string;
}

export interface PoolSchedule {
  id: string;
  name: string;
  equipmentId: string;
  window: string;
  enabled: boolean;
}

export interface PoolSystem {
  controllerDeviceId: string;
  airTemp: number | null;
  saltPpm: number | null;
  serviceMode: boolean;
  /** Valves routed to the spa (pool circulation paused). */
  spaMode: boolean;
  bodies: Body[];
  equipment: PoolEquipment[];
  schedules: PoolSchedule[];
}

// ── Security ────────────────────────────────────────────────────────────────

export interface Camera {
  id: string;
  deviceId: string;
  name: string;
  kind: 'doorbell';
  motionDetection: boolean;
  wifiSignalDbm: number | null;
  liveView: 'supported' | 'unsupported';
  /** Recorded clips need a Ring Protect plan. null = plan not confirmed. */
  hasRecordingPlan: boolean | null;
}

export interface Chime {
  id: string;
  deviceId: string;
  name: string;
  volume: number; // 0–10
}

export interface SecurityEvent {
  id: string;
  cameraId: string;
  kind: 'ding' | 'motion';
  at: number;
}

// ── Snapshot ────────────────────────────────────────────────────────────────

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface HomeSnapshot {
  source: { kind: 'sample' | 'home-assistant'; label: string };
  connection: { status: ConnectionStatus; since: number };
  areas: Area[];
  integrations: Integration[];
  devices: Device[];
  lights: Light[];
  fans: Fan[];
  scenes: Scene[];
  climate: ClimateSystem[];
  pool: PoolSystem | null;
  security: { cameras: Camera[]; chimes: Chime[]; events: SecurityEvent[] };
}
