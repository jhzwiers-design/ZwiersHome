/**
 * Home configuration — the things Home Assistant can't express.
 *
 * Rooms come from Home Assistant Areas and devices are discovered from the
 * data source, so nothing here lists individual devices. This file only holds
 * presentation choices and safety limits.
 */
import { HomeConfigSchema, type HomeConfig } from './schema';

const raw = {
  home: { name: 'Zwiers Home', shortName: 'Zwiers' },
  areaOrder: ['living', 'kitchen', 'primary', 'media', 'kids', 'bedroom2', 'bedroom3', 'bedroom4', 'porch', 'outside', 'garage', 'backyard'],
  overview: {
    modules: ['security', 'climate', 'lighting', 'pool', 'alerts'],
    quickScenes: [],
  },
  safety: {
    thermostat: { minF: 55, maxF: 85, minGapF: 3 },
    pool: { setpointF: [65, 92] },
    spa: { setpointF: [80, 104] },
    pumpSpeed: { minPct: 18, maxPct: 100 },
    confirm: ['pool.setHeater', 'pool.setEquipment', 'pool.setSpaMode'],
  },
  prototype: { latencyMs: [450, 1100] },
} satisfies HomeConfig;

export type ConfigResult = { ok: true; config: HomeConfig } | { ok: false; error: string };

export function loadConfig(): ConfigResult {
  const parsed = HomeConfigSchema.safeParse(raw);
  if (parsed.success) return { ok: true, config: parsed.data };
  return {
    ok: false,
    error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n'),
  };
}
