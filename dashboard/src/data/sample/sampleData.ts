/**
 * SAMPLE DATA — fictional but realistic values for the Milestone 1 prototype.
 *
 * Nothing in this file comes from, or is sent to, a real device. Equipment
 * names mirror the systems in the discovery report so the layout can be judged
 * against realistic content; every value is invented.
 */
import type { HomeSnapshot } from '../types';

const MIN = 60_000;
const HOUR = 60 * MIN;

export function createSampleSnapshot(now = Date.now()): HomeSnapshot {
  const ago = (ms: number) => now - ms;

  return {
    source: { kind: 'sample', label: 'Sample data (prototype)' },
    connection: { status: 'connecting', since: now },

    // Rooms mirror the SmartThings home map (names to be confirmed).
    areas: [
      { id: 'entry', name: 'Front Entry' },
      { id: 'living', name: 'Living Room' },
      { id: 'kitchen', name: 'Kitchen' },
      { id: 'media', name: 'Media Room' },
      { id: 'patio', name: 'Patio' },
      { id: 'primary', name: 'Primary Bedroom' },
      { id: 'kids', name: "Kids' Room" },
      { id: 'bedroom2', name: 'Bedroom 2' },
      { id: 'bedroom3', name: 'Bedroom 3' },
      { id: 'bedroom4', name: 'Bedroom 4' },
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
        detail: '1 device offline, 1 unavailable',
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
      // Hub
      dev('hub', 'SmartThings Hub', null, 'hub', 'smartthings', 'Aeotec', 'IM6001-V3P01 (Hub v3)', 'Wi-Fi', 'online', ago(0.2 * MIN), 600),
      // Lights
      dev('d-entry-pendant', 'Entry Pendant', 'entry', 'light', 'smartthings', 'Sengled', 'E11-G13 Element Classic', 'Zigbee', 'online', ago(2 * MIN), 900),
      dev('d-living-lamps', 'Living Room Lamps', 'living', 'light', 'smartthings', 'Innr', 'RB 278 T', 'Zigbee', 'online', ago(1 * MIN), 900),
      dev('d-living-cans', 'Living Room Recessed', 'living', 'light', 'smartthings', 'Enbrighten', '46203 In-Wall Dimmer', 'Z-Wave', 'online', ago(1 * MIN), 900),
      dev('d-kitchen-pendants', 'Island Pendants', 'kitchen', 'light', 'smartthings', 'Enbrighten', '46203 In-Wall Dimmer', 'Z-Wave', 'online', ago(3 * MIN), 900),
      dev('d-kitchen-cans', 'Kitchen Recessed', 'kitchen', 'light', 'smartthings', 'Zooz', 'ZEN77 Dimmer', 'Z-Wave', 'online', ago(3 * MIN), 900),
      dev('d-kitchen-under', 'Under-Cabinet', 'kitchen', 'light', 'smartthings', 'Aeotec', 'LED Strip 6', 'Zigbee', 'online', ago(3 * MIN), 900),
      dev('d-dining-chandelier', 'Dining Chandelier', 'kitchen', 'light', 'smartthings', 'Zooz', 'ZEN77 Dimmer', 'Z-Wave', 'online', ago(6 * MIN), 900),
      dev('d-office-desk', 'Media Room Floor Lamp', 'media', 'light', 'smartthings', 'Sengled', 'E11-N1EA Multicolor', 'Zigbee', 'online', ago(9 * MIN), 900),
      dev('d-office-ceiling', 'Media Room Ceiling', 'media', 'light', 'smartthings', 'GE', '14291 Switch', 'Z-Wave', 'online', ago(9 * MIN), 900),
      dev('d-kids-ceiling', "Kids' Room Ceiling", 'kids', 'light', 'smartthings', 'Zooz', 'ZEN77 Dimmer', 'Z-Wave', 'online', ago(20 * MIN), 900),
      dev('d-bed2-lamp', 'Bedroom 2 Lamp', 'bedroom2', 'light', 'smartthings', 'Sengled', 'E11-G13 Element Classic', 'Zigbee', 'online', ago(30 * MIN), 900),
      dev('d-bed3-ceiling', 'Bedroom 3 Ceiling', 'bedroom3', 'light', 'smartthings', 'Zooz', 'ZEN77 Dimmer', 'Z-Wave', 'online', ago(40 * MIN), 900),
      dev('d-bed4-lamp', 'Bedroom 4 Lamp', 'bedroom4', 'light', 'smartthings', 'Innr', 'RB 278 T', 'Zigbee', 'online', ago(15 * MIN), 900),
      dev('d-primary-lamps', 'Bedside Lamps', 'primary', 'light', 'smartthings', 'Innr', 'RB 278 T', 'Zigbee', 'online', ago(14 * MIN), 900),
      dev('d-primary-ceiling', 'Primary Ceiling', 'primary', 'light', 'smartthings', 'Zooz', 'ZEN77 Dimmer', 'Z-Wave', 'online', ago(14 * MIN), 900),
      dev('d-garage-work', 'Garage Workbench', 'garage', 'light', 'smartthings', 'GE', '14291 Switch', 'Z-Wave', 'online', ago(4 * MIN), 900, 'Weak Z-Wave signal; commands sometimes time out'),
      dev('d-garage-ceiling', 'Garage Ceiling', 'garage', 'light', 'smartthings', 'GE', '14291 Switch', 'Z-Wave', 'unavailable', ago(26 * HOUR), 900, 'SmartThings reports no state since the Wi-Fi change'),
      dev('d-porch-lantern', 'Porch Lanterns', 'entry', 'light', 'smartthings', 'Sengled', 'E11-G13 Element Classic', 'Zigbee', 'offline', ago(3.5 * HOUR), 900, 'Not responding to the hub (switched off at the wall?)'),
      dev('d-backyard-string', 'Patio String Lights', 'patio', 'light', 'smartthings', 'Zooz', 'ZEN15 Power Switch', 'Z-Wave', 'online', ago(5 * MIN), 900),
      dev('d-backyard-flood', 'Patio Floodlights', 'patio', 'light', 'smartthings', 'Enbrighten', '46201 In-Wall Switch', 'Z-Wave', 'online', ago(5 * MIN), 900),
      // Climate
      dev('d-thermostat', 'Infinity Touch Control', 'entry', 'climate', 'carrier', 'Carrier', 'SYSTXCCITC01-B · fw 4.31', 'Cloud', 'online', ago(0.5 * MIN), 600),
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
      dev('d-doorbell', 'Front Door', 'entry', 'security', 'ring', 'Ring', 'Wired Doorbell Plus (2nd Gen)', 'Wi-Fi', 'online', ago(0.3 * MIN), 600),
      dev('d-chime', 'Chime', 'entry', 'security', 'ring', 'Ring', 'Chime', 'Wi-Fi', 'online', ago(1 * MIN), 600),
      // Cleaner
      dev('d-dolphin', 'Pool Cleaner', 'backyard', 'cleaner', 'dolphin', 'Maytronics', 'Dolphin Nautilus (model to confirm)', 'Cloud', 'unavailable', null, 3600, 'Integration not configured yet'),
    ],

    lights: [
      light('l-entry-pendant', 'd-entry-pendant', 'Entry Pendant', 'entry', true, 70, null, { b: true }, ago(48 * MIN)),
      light('l-living-lamps', 'd-living-lamps', 'Floor & Table Lamps', 'living', true, 55, 2700, { b: true, ct: [2200, 6500] }, ago(52 * MIN)),
      light('l-living-cans', 'd-living-cans', 'Recessed', 'living', false, 80, null, { b: true }, ago(5 * HOUR)),
      light('l-kitchen-pendants', 'd-kitchen-pendants', 'Island Pendants', 'kitchen', true, 85, null, { b: true }, ago(70 * MIN)),
      light('l-kitchen-cans', 'd-kitchen-cans', 'Recessed', 'kitchen', true, 60, null, { b: true }, ago(70 * MIN)),
      light('l-kitchen-under', 'd-kitchen-under', 'Under-Cabinet', 'kitchen', true, 40, 3000, { b: true, ct: [2700, 6500] }, ago(70 * MIN)),
      light('l-dining-chandelier', 'd-dining-chandelier', 'Dining Chandelier', 'kitchen', false, 65, null, { b: true }, ago(22 * HOUR)),
      light('l-office-desk', 'd-office-desk', 'Floor Lamp', 'media', false, 100, 4000, { b: true, ct: [2000, 6500] }, ago(3 * HOUR)),
      light('l-office-ceiling', 'd-office-ceiling', 'Ceiling', 'media', false, null, null, {}, ago(3 * HOUR)),
      light('l-kids-ceiling', 'd-kids-ceiling', 'Ceiling', 'kids', false, 60, null, { b: true }, ago(6 * HOUR)),
      light('l-bed2-lamp', 'd-bed2-lamp', 'Lamp', 'bedroom2', true, 45, null, { b: true }, ago(30 * MIN)),
      light('l-bed3-ceiling', 'd-bed3-ceiling', 'Ceiling', 'bedroom3', false, 80, null, { b: true }, ago(9 * HOUR)),
      light('l-bed4-lamp', 'd-bed4-lamp', 'Lamp', 'bedroom4', true, 30, 2700, { b: true, ct: [2200, 6500] }, ago(15 * MIN)),
      light('l-primary-lamps', 'd-primary-lamps', 'Bedside Lamps', 'primary', false, 35, 2400, { b: true, ct: [2200, 6500] }, ago(14 * HOUR)),
      light('l-primary-ceiling', 'd-primary-ceiling', 'Ceiling', 'primary', false, 70, null, { b: true }, ago(14 * HOUR)),
      light('l-garage-work', 'd-garage-work', 'Workbench', 'garage', false, null, null, {}, ago(2 * HOUR)),
      light('l-garage-ceiling', 'd-garage-ceiling', 'Ceiling', 'garage', false, null, null, {}, ago(26 * HOUR)),
      light('l-porch-lantern', 'd-porch-lantern', 'Porch Lanterns', 'entry', false, 100, null, { b: true }, ago(3.5 * HOUR)),
      light('l-backyard-string', 'd-backyard-string', 'String Lights', 'patio', true, null, null, {}, ago(40 * MIN)),
      light('l-backyard-flood', 'd-backyard-flood', 'Floodlights', 'patio', false, null, null, {}, ago(9 * HOUR)),
    ],

    scenes: [
      {
        id: 'scene-evening',
        name: 'Evening',
        description: 'Living, kitchen and patio at a warm, low level',
        targets: {
          'l-living-lamps': { on: true, brightness: 55, colorTempK: 2700 },
          'l-living-cans': { on: false },
          'l-kitchen-pendants': { on: true, brightness: 60 },
          'l-kitchen-under': { on: true, brightness: 40, colorTempK: 2700 },
          'l-entry-pendant': { on: true, brightness: 50 },
          'l-backyard-string': { on: true },
        },
      },
      {
        id: 'scene-dinner',
        name: 'Dinner',
        description: 'Chandelier focus, kitchen dimmed',
        targets: {
          'l-dining-chandelier': { on: true, brightness: 70 },
          'l-kitchen-pendants': { on: true, brightness: 35 },
          'l-kitchen-cans': { on: false },
          'l-kitchen-under': { on: true, brightness: 25, colorTempK: 2700 },
          'l-living-lamps': { on: true, brightness: 40, colorTempK: 2400 },
        },
      },
      {
        id: 'scene-bright',
        name: 'Bright',
        description: 'Main rooms at full, neutral white',
        targets: {
          'l-living-lamps': { on: true, brightness: 100, colorTempK: 4000 },
          'l-living-cans': { on: true, brightness: 100 },
          'l-kitchen-pendants': { on: true, brightness: 100 },
          'l-kitchen-cans': { on: true, brightness: 100 },
          'l-kitchen-under': { on: true, brightness: 100, colorTempK: 4000 },
        },
      },
      {
        id: 'scene-goodnight',
        name: 'Goodnight',
        description: 'Everything off except bedside lamps at 15 %',
        targets: {
          'l-entry-pendant': { on: false },
          'l-living-lamps': { on: false },
          'l-living-cans': { on: false },
          'l-kitchen-pendants': { on: false },
          'l-kitchen-cans': { on: false },
          'l-kitchen-under': { on: false },
          'l-dining-chandelier': { on: false },
          'l-office-desk': { on: false },
          'l-office-ceiling': { on: false },
          'l-backyard-string': { on: false },
          'l-backyard-flood': { on: false },
          'l-primary-lamps': { on: true, brightness: 15, colorTempK: 2200 },
        },
      },
    ],

    climate: [
      {
        id: 'hvac-main',
        deviceId: 'd-thermostat',
        name: 'Infinity System',
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
            name: 'Main Floor',
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
