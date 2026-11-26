/**
 * Signature colours. Each system has its own tone (see styles/tokens.css);
 * setting data-tone="<tone>" on an element re-colours every accent control
 * inside it. 'brand' is the Zwiers Home Redwood.
 */
export type Tone = 'brand' | 'lighting' | 'climate' | 'pool' | 'spa' | 'security' | 'devices';

/** Which tone each navigation section uses. */
export const ROUTE_TONE: Record<string, Tone> = {
  overview: 'brand',
  lighting: 'lighting',
  climate: 'climate',
  pool: 'pool',
  security: 'security',
  devices: 'devices',
  settings: 'brand',
};
