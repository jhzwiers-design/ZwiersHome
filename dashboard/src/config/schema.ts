/**
 * Schema for home.config.ts — validated at startup with zod so a typo shows a
 * clear error screen instead of a half-broken dashboard.
 */
import { z } from 'zod';

const range = z.tuple([z.number(), z.number()]).refine(([a, b]) => a < b, 'min must be below max');

export const OverviewModule = z.enum(['climate', 'pool', 'lighting', 'security', 'alerts']);
export type OverviewModule = z.infer<typeof OverviewModule>;

export const HomeConfigSchema = z.object({
  home: z.object({
    name: z.string().min(1),
    /** Short brand mark used in navigation. */
    shortName: z.string().min(1).max(12),
  }),
  /** Display order for areas. Areas not listed appear afterwards, alphabetically. */
  areaOrder: z.array(z.string()),
  overview: z.object({
    /** Modules shown on the Overview, in order (users can hide them in Settings). */
    modules: z.array(OverviewModule).min(1),
    /** Which scenes appear as quick actions (by scene id). Empty = all. */
    quickScenes: z.array(z.string()),
  }),
  safety: z.object({
    thermostat: z.object({ minF: z.number(), maxF: z.number(), minGapF: z.number().min(0) }),
    pool: z.object({ setpointF: range }),
    spa: z.object({ setpointF: range }),
    pumpSpeed: z.object({ minPct: z.number().min(0), maxPct: z.number().max(100) }),
    /** Command types that need an explicit confirmation before sending. */
    confirm: z.array(z.string()),
  }),
  /** How long (ms) the prototype waits before applying a sample command. */
  prototype: z.object({ latencyMs: range }),
});

export type HomeConfig = z.infer<typeof HomeConfigSchema>;
