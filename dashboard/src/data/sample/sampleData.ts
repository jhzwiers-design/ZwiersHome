/**
 * SAMPLE DATA for the Milestone 1 prototype.
 *
 * Nothing in this file comes from, or is sent to, a real device.
 * Rooms and device NAMES mirror the SmartThings device list (screenshots,
 * 25 Nov 2026); their on/off states are a snapshot from those screenshots.
 * Everything else (models, protocols, temperatures, pool equipment, events)
 * is invented until the real details are confirmed.
 */
import type { HomeSnapshot } from '../types';

const MIN = 60_000;
const HOUR = 60 * MIN;

export function createSampleSnapshot(now = Date.now()): HomeSnapshot {
  const ago = (ms: number) => now - ms;

  return {
    source: { kind: 'sample', label: 'Sample data (prototype)' },
    connection: { status: 'connecting', since: now },

    // Rooms mirror the SmartThings rooms (25 Nov 2026 device list).
    areas: [
      { id: 'living', name: 'Living Room' },
      { id: 'kitchen', name: 'Kitchen' },
      { id: 'primary', name: 'Master Bedroom' },
      { id: 'media', name: 'Media Room' },
      { id: 'kids', name: 'Kids Room' },
      { id: 'bedroom2', name: __PUBLIC__ ? 'Bedroom 2' : 'Lauren’s Room' },
      { id: 'bedroom3', name: __PUBLIC__ ? 'Bedroom 3' : 'Allie’s Room' },
      { id: 'bedroom4', name: __PUBLIC__ ? 'Bedroom 4' : 'Tim’s Room' },
      { id: 'porch', name: 'Front Porch' },
      { id: 'outside', name: 'Outside' },
      { id: 'westwing', name: 'West Wing (downstairs)' },
      { id: 'eastwing', name: 'East Wing (upstairs + downstairs)' },
      { id: 'garage', name: 'Garage' },
      { id: 'backyard', name: 'Backyard' },
    ],

    integrations: [
      {
        id: 'smartthings',
        name: 'SmartThings',
        provider: 'Home Assistant built-in',
        support: 'built-in',
        transport: 'cloud',
        status: 'degraded',
        detail: '2 devices offline (Media Room)',
        lastUpdated: ago(0.2 * MIN),
      },
      {
        id: 'carrier',
        name: 'Carrier Infinity',
        provider: 'ha_carrier (community)',
        support: 'community',
        transport: 'cloud',
        status: 'connected',
        lastUpdated: ago(0.5 * MIN),
      },
      {
        id: 'omnilogic',
        name: 'Hayward OmniLogic',
        provider: 'haomnilogic-local (community)',
        support: 'community',
        transport: 'local',
        status: 'connected',
        lastUpdated: ago(0.1 * MIN),
      },
      {
        id: 'ring',
        name: 'Ring',
        provider: 'Home Assistant built-in',
        support: 'built-in',
        transport: 'cloud',
        status: 'connected',
        lastUpdated: ago(0.3 * MIN),
      },
      {
        id: 'dolphin',
        name: 'Maytronics Dolphin',
        provider: 'dolphin-robot (community)',
        support: 'community',
        transport: 'cloud',
        status: 'not_configured',
        detail: 'Deferred until the cleaner model is confirmed',
        lastUpdated: null,
      },
    ],

    devices: [
      // SmartThings (from the device list). Model and protocol are unknown until confirmed in the app.
      dev('hub', 'Hub', 'kitchen', 'hub', 'smartthings', 'Aeotec', __PUBLIC__ ? 'Smart home hub' : 'Smart Home Hub IM6001-V3P01', 'Wi-Fi', 'online', ago(0.2 * MIN), 600),
      dev('d-media-hub', 'Hub – Media Room', 'media', 'hub', 'smartthings', 'Samsung', 'Hub (TV-based, to confirm)', 'Unknown', 'offline', ago(2 * HOUR), 600, 'Offline in SmartThings'),
      dev('d-media-tv', 'Media Room Television', 'media', 'media', 'smartthings', 'Samsung', 'TV (model to confirm)', 'Wi-Fi', 'offline', ago(2 * HOUR), 600, 'Offline in SmartThings'),
      // Confirmed Honeywell Z-Wave (manufacturer 0039) from the SmartThings device info.
      dev('d-living', 'Living Room Light', 'living', 'light', 'smartthings', 'Honeywell', __PUBLIC__ ? 'Z-Wave in-wall dimmer' : 'Z-Wave dimmer 0039-4944-3038', 'Z-Wave', 'online', ago(3 * MIN), 900),
      dev('d-kitchen', 'Kitchen Lights', 'kitchen', 'light', 'smartthings', 'To confirm', 'Wall switch', 'Unknown', 'online', ago(3 * MIN), 900),
      dev('d-primary-light', 'Master Bed Room', 'primary', 'light', 'smartthings', 'To confirm', 'Wall switch', 'Unknown', 'online', ago(5 * MIN), 900),
      dev('d-primary-fan', 'Master Bedroom Fan', 'primary', 'fan', 'smartthings', 'Honeywell', __PUBLIC__ ? 'Z-Wave fan control' : 'Z-Wave fan control 0039-4944-3131', 'Z-Wave', 'online', ago(5 * MIN), 900),
      dev('d-man-door', 'Man Door Light', 'outside', 'light', 'smartthings', 'To confirm', 'Wall switch', 'Unknown', 'online', ago(4 * MIN), 900),
      dev('d-front-outdoor', 'Front Outdoor Light', 'outside', 'light', 'smartthings', 'To confirm', 'Wall switch', 'Unknown', 'online', ago(4 * MIN), 900),
      dev('d-screen-porch', 'Screen Porch', 'outside', 'light', 'smartthings', 'To confirm', 'Wall switch', 'Unknown', 'online', ago(4 * MIN), 900, 'Sometimes slow to respond (prototype demo)'),
      dev('d-media-light', 'Media Room Light', 'media', 'light', 'smartthings', 'To confirm', 'Wall switch', 'Unknown', 'online', ago(6 * MIN), 900),
      dev('d-bedroom1', __PUBLIC__ ? 'Bedroom 1 Light' : 'John’s Room Light', 'kids', 'light', 'smartthings', 'To confirm', 'Wall switch', 'Unknown', 'online', ago(9 * MIN), 900),
      dev('d-upstairs-fan', 'Upstairs Fan', 'kids', 'fan', 'smartthings', 'To confirm', 'Fan control (speeds to confirm)', 'Unknown', 'online', ago(9 * MIN), 900),
      dev('d-upstairs-lights', 'Upstairs Lights', 'kids', 'light', 'smartthings', 'To confirm', 'Wall switch', 'Unknown', 'online', ago(9 * MIN), 900),
      dev('d-bedroom2', __PUBLIC__ ? 'Bedroom 2 Light' : 'Lauren’s Room Light', 'bedroom2', 'light', 'smartthings', 'To confirm', 'Wall switch', 'Unknown', 'online', ago(7 * MIN), 900),
      dev('d-bedroom3', __PUBLIC__ ? 'Bedroom 3 Light' : 'Allie’s Room Light', 'bedroom3', 'light', 'smartthings', 'To confirm', 'Wall switch', 'Unknown', 'online', ago(7 * MIN), 900),
      dev('d-bedroom4', __PUBLIC__ ? 'Bedroom 4 Light' : 'Tim’s Room Light', 'bedroom4', 'light', 'smartthings', 'To confirm', 'Wall switch', 'Unknown', 'online', ago(7 * MIN), 900),
      dev('d-front-porch', 'Front Porch Light', 'porch', 'light', 'smartthings', 'To confirm', 'Wall switch', 'Unknown', 'online', ago(2 * MIN), 900),
      // Climate
      // Two thermostats of the same Carrier model: West Wing (main, downstairs only) and East Wing
      // (one connected space over two floors).
      dev('d-thermostat-east', 'East Wing Thermostat', 'eastwing', 'climate', 'carrier', 'Carrier', __PUBLIC__ ? 'Infinity Touch' : 'SYSTXCCITC01-B', 'Cloud', 'online', ago(0.6 * MIN), 600),
      dev('d-thermostat', 'West Wing Thermostat', 'westwing', 'climate', 'carrier', 'Carrier', __PUBLIC__ ? 'Infinity Touch' : 'SYSTXCCITC01-B · fw 4.31', 'Cloud', 'online', ago(0.5 * MIN), 600),
      // Pool
      dev('d-omnilogic', 'OmniLogic Controller', 'backyard', 'pool', 'omnilogic', 'Hayward', 'OmniLogic (model to confirm)', 'Ethernet', 'online', ago(0.1 * MIN), 120),
      dev('d-filter-pump', 'Filter Pump', 'backyard', 'pool', 'omnilogic', 'Hayward', 'TriStar VS (sample)', 'Ethernet', 'online', ago(0.1 * MIN), 120),
      dev('d-jets-pump', 'Spa Jets Pump', 'backyard', 'pool', 'omnilogic', 'Hayward', 'Single-speed (sample)', 'Ethernet', 'online', ago(0.1 * MIN), 120),
      dev('d-pool-heater', 'Gas Heater', 'backyard', 'pool', 'omnilogic', 'Hayward', 'Universal H-Series (sample)', 'Ethernet', 'online', ago(0.1 * MIN), 120),
      dev('d-pool-light', 'Pool Light', 'backyard', 'pool', 'omnilogic', 'Hayward', 'ColorLogic 4.0 (sample)', 'Ethernet', 'online', ago(0.1 * MIN), 120),
      dev('d-spa-light', 'Spa Light', 'backyard', 'pool', 'omnilogic', 'Hayward', 'ColorLogic 4.0 (sample)', 'Ethernet', 'online', ago(0.1 * MIN), 120),
      dev('d-chlorinator', 'Salt Chlorinator', 'backyard', 'pool', 'omnilogic', 'Hayward', 'AquaRite cell (sample)', 'Ethernet', 'online', ago(0.1 * MIN), 120),
      dev('d-waterfall', 'Waterfall Valve', 'backyard', 'pool', 'omnilogic', 'Hayward', 'Valve actuator (sample)', 'Ethernet', 'online', ago(0.1 * MIN), 120),
      // Security
      dev('d-doorbell', 'Front Door', 'porch', 'security', 'ring', 'Ring', __PUBLIC__ ? 'Video doorbell' : 'Wired Doorbell Plus (2nd Gen)', 'Wi-Fi', 'online', ago(0.3 * MIN), 600),
      dev('d-chime', 'Chime', 'kitchen', 'security', 'ring', 'Ring', 'Chime', 'Wi-Fi', 'online', ago(1 * MIN), 600),
      // Cleaner
      dev('d-dolphin', 'Pool Cleaner', 'backyard', 'cleaner', 'dolphin', 'Maytronics', 'Dolphin Nautilus (model to confirm)', 'Cloud', 'unavailable', null, 3600, 'Integration not configured yet'),
    ],

    // On/off states as shown in the SmartThings app. Dimming support is unknown,
    // so every light is shown as on/off only until confirmed.
    lights: [
      light('l-living', 'd-living', 'Living Room Light', 'living', false, null, null, {}, ago(3 * HOUR)),
      light('l-kitchen', 'd-kitchen', 'Kitchen Lights', 'kitchen', false, null, null, {}, ago(2 * HOUR)),
      light('l-primary', 'd-primary-light', 'Master Bedroom Light', 'primary', true, null, null, {}, ago(40 * MIN)),
      light('l-man-door', 'd-man-door', 'Man Door Light', 'outside', true, null, null, {}, ago(70 * MIN)),
      light('l-front-outdoor', 'd-front-outdoor', 'Front Outdoor Light', 'outside', false, null, null, {}, ago(5 * HOUR)),
      light('l-screen-porch', 'd-screen-porch', 'Screen Porch', 'outside', false, null, null, {}, ago(6 * HOUR)),
      light('l-media', 'd-media-light', 'Media Room Light', 'media', true, null, null, {}, ago(50 * MIN)),
      light('l-bedroom1', 'd-bedroom1', __PUBLIC__ ? 'Bedroom 1 Light' : 'John’s Room Light', 'kids', false, null, null, {}, ago(4 * HOUR)),
      light('l-upstairs', 'd-upstairs-lights', 'Upstairs Lights', 'kids', false, null, null, {}, ago(4 * HOUR)),
      light('l-bedroom2', 'd-bedroom2', __PUBLIC__ ? 'Bedroom 2 Light' : 'Lauren’s Room Light', 'bedroom2', true, null, null, {}, ago(30 * MIN)),
      light('l-bedroom3', 'd-bedroom3', __PUBLIC__ ? 'Bedroom 3 Light' : 'Allie’s Room Light', 'bedroom3', false, null, null, {}, ago(3 * HOUR)),
      light('l-bedroom4', 'd-bedroom4', __PUBLIC__ ? 'Bedroom 4 Light' : 'Tim’s Room Light', 'bedroom4', false, null, null, {}, ago(3 * HOUR)),
      light('l-front-porch', 'd-front-porch', 'Front Porch Light', 'porch', true, null, null, {}, ago(80 * MIN)),
    ],

    // Both fans show Off in SmartThings. The Master Bedroom control is a
    // confirmed Honeywell Z-Wave fan control (low / medium / high). The Upstairs
    // Fan's speed support isn't known yet, so it is on/off only for now.
    fans: [
      { id: 'f-primary', deviceId: 'd-primary-fan', name: 'Master Bedroom Fan', areaId: 'primary', on: false, speed: 'medium', speeds: ['low', 'medium', 'high'], lastChanged: ago(5 * HOUR) },
      { id: 'f-upstairs', deviceId: 'd-upstairs-fan', name: 'Upstairs Fan', areaId: 'kids', on: false, speed: null, speeds: [], lastChanged: ago(6 * HOUR) },
    ],

    // Sample scenes. In the prototype they change sample lights only.
    scenes: [
      {
        id: 'scene-arrive',
        name: 'Arriving Home',
        icon: 'arrive',
        description: 'Outside lights and the kitchen on',
        targets: { 'l-man-door': { on: true }, 'l-front-porch': { on: true }, 'l-front-outdoor': { on: true }, 'l-kitchen': { on: true } },
      },
      {
        id: 'scene-leave',
        name: 'Leaving Home',
        icon: 'leave',
        description: 'Indoor lights off, outdoor lights on',
        targets: { ...allLights(false), 'l-front-porch': { on: true }, 'l-man-door': { on: true }, 'l-front-outdoor': { on: true } },
      },
      {
        id: 'scene-evening',
        name: 'Evening',
        icon: 'evening',
        description: 'Living room, kitchen and the front of the house on',
        targets: { 'l-living': { on: true }, 'l-kitchen': { on: true }, 'l-front-porch': { on: true }, 'l-front-outdoor': { on: true } },
      },
      {
        id: 'scene-movie',
        name: 'Movie Night',
        icon: 'movie',
        description: 'Media room, living room and kitchen lights off',
        targets: { 'l-media': { on: false }, 'l-living': { on: false }, 'l-kitchen': { on: false } },
      },
      {
        id: 'scene-goodnight',
        name: 'Goodnight',
        icon: 'night',
        description: 'Everything off except the front porch',
        targets: { ...allLights(false), 'l-front-porch': { on: true } },
      },
      {
        id: 'scene-all-off',
        name: 'All Off',
        icon: 'off',
        description: 'Every light in the house off',
        targets: allLights(false),
      },
    ],

    climate: [
      {
        id: 'hvac-main',
        deviceId: 'd-thermostat',
        name: 'West Wing Thermostat',
        outdoorTemp: 54,
        filterLifePct: 62,
        airflowCfm: 820,
        blowerRpm: 640,
        staticPressureInWc: 0.42,
        stage: 'Gas furnace · stage 1',
        energyTodayKwh: 6.8,
        zones: [
          {
            id: 'zone-main',
            name: 'West Wing',
            currentTemp: 69.5,
            humidity: 41,
            mode: 'heat',
            action: 'heating',
            heatSetpoint: 71,
            coolSetpoint: 76,
            fanMode: 'auto',
            preset: 'home',
            hold: false,
            supportedModes: ['heat', 'cool', 'auto', 'fan_only', 'off'],
            lastUpdated: ago(0.5 * MIN),
          },
        ],
      },
      {
        // Same thermostat model as the West Wing. Its own equipment readings
        // (filter, airflow, blower) aren't known yet, so they stay empty.
        id: 'hvac-east',
        deviceId: 'd-thermostat-east',
        name: 'East Wing Thermostat',
        outdoorTemp: 54,
        filterLifePct: null,
        airflowCfm: null,
        blowerRpm: null,
        staticPressureInWc: null,
        stage: null,
        energyTodayKwh: null,
        zones: [
          {
            id: 'zone-east',
            name: 'East Wing',
            currentTemp: 70.5,
            humidity: 39,
            mode: 'heat',
            action: 'idle',
            heatSetpoint: 70,
            coolSetpoint: 76,
            fanMode: 'auto',
            preset: 'home',
            hold: false,
            supportedModes: ['heat', 'cool', 'auto', 'fan_only', 'off'],
            lastUpdated: ago(0.6 * MIN),
          },
        ],
      },
    ],

    pool: {
      controllerDeviceId: 'd-omnilogic',
      airTemp: 56,
      saltPpm: 3200,
      serviceMode: false,
      spaMode: false,
      bodies: [
        {
          id: 'pool',
          name: 'Pool',
          waterTemp: 74,
          flow: true,
          heater: { id: 'h-pool', deviceId: 'd-pool-heater', kind: 'Gas heater', enabled: false, setpoint: 82, min: 65, max: 92, state: 'off' },
          lastUpdated: ago(0.1 * MIN),
        },
        {
          id: 'spa',
          name: 'Spa',
          waterTemp: 99.4,
          flow: false,
          heater: { id: 'h-spa', deviceId: 'd-pool-heater', kind: 'Gas heater', enabled: true, setpoint: 102, min: 80, max: 104, state: 'idle' },
          lastUpdated: ago(0.1 * MIN),
        },
      ],
      equipment: [
        {
          id: 'eq-filter',
          deviceId: 'd-filter-pump',
          body: 'pool',
          type: 'pump',
          name: 'Filter Pump',
          on: true,
          speedPct: 50,
          speedPresets: { low: 35, med: 50, high: 80 },
          description: 'Variable speed',
        },
        {
          id: 'eq-pool-light',
          deviceId: 'd-pool-light',
          body: 'pool',
          type: 'light',
          name: 'Pool Light',
          on: false,
          show: 'Caribbean',
          shows: ['Voodoo Lounge', 'Deep Blue Sea', 'Afternoon Skies', 'Emerald', 'Sangria', 'Cloud White', 'Twilight', 'Caribbean', 'American', 'Cali Sunset', 'Royal'],
        },
        {
          id: 'eq-waterfall',
          deviceId: 'd-waterfall',
          body: 'pool',
          type: 'relay',
          name: 'Waterfall',
          on: false,
          description: 'Valve actuator',
        },
        {
          id: 'eq-jets',
          deviceId: 'd-jets-pump',
          body: 'spa',
          type: 'pump',
          name: 'Jets',
          on: false,
          description: 'Single speed',
        },
        {
          id: 'eq-spa-light',
          deviceId: 'd-spa-light',
          body: 'spa',
          type: 'light',
          name: 'Spa Light',
          on: false,
          show: 'Twilight',
          shows: ['Voodoo Lounge', 'Deep Blue Sea', 'Afternoon Skies', 'Emerald', 'Sangria', 'Cloud White', 'Twilight', 'Caribbean', 'American', 'Cali Sunset', 'Royal'],
        },
        {
          id: 'eq-chlorinator',
          deviceId: 'd-chlorinator',
          body: 'shared',
          type: 'chlorinator',
          name: 'Salt Chlorinator',
          on: true,
          outputPct: 40,
          description: 'Timed percent',
        },
      ],
      schedules: [
        { id: 'sch-1', name: 'Filtration', equipmentId: 'eq-filter', window: '8:00 AM – 4:00 PM · 50 %', enabled: true },
        { id: 'sch-2', name: 'Evening skim', equipmentId: 'eq-filter', window: '7:00 PM – 9:00 PM · 35 %', enabled: true },
        { id: 'sch-3', name: 'Pool light', equipmentId: 'eq-pool-light', window: 'Sunset – 10:30 PM', enabled: false },
      ],
    },

    security: {
      cameras: [
        {
          id: 'cam-front',
          deviceId: 'd-doorbell',
          name: 'Front Door',
          kind: 'doorbell',
          motionDetection: true,
          wifiSignalDbm: -54,
          liveView: 'supported',
          hasRecordingPlan: null,
        },
      ],
      chimes: [{ id: 'chime-entry', deviceId: 'd-chime', name: 'Chime', volume: 6 }],
      events: [
        { id: 'ev-1', cameraId: 'cam-front', kind: 'ding', at: ago(34 * MIN) },
        { id: 'ev-2', cameraId: 'cam-front', kind: 'motion', at: ago(36 * MIN) },
        { id: 'ev-3', cameraId: 'cam-front', kind: 'motion', at: ago(2.6 * HOUR) },
        { id: 'ev-4', cameraId: 'cam-front', kind: 'motion', at: ago(4.1 * HOUR) },
        { id: 'ev-5', cameraId: 'cam-front', kind: 'ding', at: ago(5.4 * HOUR) },
        { id: 'ev-6', cameraId: 'cam-front', kind: 'motion', at: ago(5.45 * HOUR) },
        { id: 'ev-7', cameraId: 'cam-front', kind: 'motion', at: ago(21 * HOUR) },
        { id: 'ev-8', cameraId: 'cam-front', kind: 'ding', at: ago(26 * HOUR) },
        { id: 'ev-9', cameraId: 'cam-front', kind: 'motion', at: ago(27 * HOUR) },
      ],
    },
  };
}

/** Every sample light set to one state (for whole-house scenes). */
function allLights(on: boolean): Record<string, { on: boolean }> {
  const ids = ['l-living','l-kitchen','l-primary','l-man-door','l-front-outdoor','l-screen-porch','l-media','l-bedroom1','l-upstairs','l-bedroom2','l-bedroom3','l-bedroom4','l-front-porch'];
  return Object.fromEntries(ids.map((id) => [id, { on }]));
}

function dev(
  id: string,
  name: string,
  areaId: string | null,
  category: HomeSnapshot['devices'][number]['category'],
  integration: HomeSnapshot['devices'][number]['integration'],
  manufacturer: string,
  model: string,
  protocol: HomeSnapshot['devices'][number]['protocol'],
  availability: HomeSnapshot['devices'][number]['availability'],
  lastSeen: number | null,
  staleAfterSec: number,
  issue?: string,
): HomeSnapshot['devices'][number] {
  return { id, name, areaId, category, integration, manufacturer, model, protocol, availability, lastSeen, staleAfterSec, issue };
}

function light(
  id: string,
  deviceId: string,
  name: string,
  areaId: string,
  on: boolean,
  brightness: number | null,
  colorTempK: number | null,
  caps: { b?: boolean; ct?: [number, number] },
  lastChanged: number,
): HomeSnapshot['lights'][number] {
  return {
    id,
    deviceId,
    name,
    areaId,
    on,
    brightness,
    colorTempK,
    capabilities: { brightness: !!caps.b, colorTemp: caps.ct ? { minK: caps.ct[0], maxK: caps.ct[1] } : null },
    lastChanged,
  };
}
