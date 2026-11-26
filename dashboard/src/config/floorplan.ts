/**
 * Floor plan — room shapes for the interactive home map (Lighting screen).
 *
 * APPROXIMATE: traced by eye from screenshots of the SmartThings 3D home map
 * on 25 Nov 2026. Replace with measurements from the scanned floor plan.
 * Room links follow the SmartThings labels (Outside, Front Porch, Kids Room,
 * Master Bedroom, Bedroom 3). Bedrooms 2 and 4 are a best guess from
 * cut-off labels; swap their areaId if they're the other way round.
 *
 * Public builds use DEMO_PLAN instead, so the real layout never goes online.
 *
 * Units are arbitrary "plan units" (roughly 1 unit ≈ 2 in). Origin top-left.
 * Each interactive room links to a Home Assistant Area by `areaId`, so lights
 * appear in the right room automatically — no device IDs here.
 * `spaces` are non-interactive rooms (baths, closets, halls) drawn for context.
 */

export interface PlanRoom {
  areaId: string;
  /** Polygon points [x, y][] in plan units. */
  points: [number, number][];
  /** Optional label position override. Defaults to the polygon's centre. */
  label?: [number, number];
}

export interface FloorPlan {
  name: string;
  approximate: boolean;
  width: number;
  height: number;
  /** House outline. */
  outline: [number, number][];
  rooms: PlanRoom[];
  spaces: [number, number][][];
}

const rect = (x: number, y: number, w: number, h: number): [number, number][] => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
];

/** Real (traced) layout. A function so public builds drop it entirely. */
function tracedPlan(): FloorPlan {
  return {
  name: 'Main floor',
  approximate: true,
  width: 720,
  height: 680,
  outline: [
    [8, 210], [423, 210], [423, 8], [690, 8], [690, 328], [712, 328], [712, 595], [610, 595], [610, 615],
    [518, 615], [518, 562], [352, 562], [352, 667], [252, 667], [252, 600], [88, 600], [88, 565], [8, 565],
  ],
  rooms: [
    { areaId: 'media', points: rect(8, 210, 132, 165) },
    { areaId: 'outside', points: rect(140, 210, 283, 118) },
    { areaId: 'living', points: rect(140, 328, 160, 177) },
    { areaId: 'kitchen', points: rect(300, 328, 123, 234) },
    { areaId: 'bedroom4', points: rect(14, 378, 93, 84) },
    { areaId: 'kids', points: rect(100, 505, 100, 92), label: [150, 548] },
    { areaId: 'porch', points: rect(200, 505, 52, 60) },
    { areaId: 'primary', points: rect(425, 168, 123, 100) },
    { areaId: 'bedroom2', points: rect(555, 15, 87, 110) },
    { areaId: 'bedroom3', points: rect(582, 185, 100, 83) },
    {
      areaId: 'garage',
      points: [[520, 315], [706, 315], [706, 595], [520, 595]],
    },
  ],
  spaces: [
    rect(425, 15, 125, 148), // baths / closets, north wing
    rect(648, 15, 40, 165), // closets, east
    rect(555, 130, 87, 50), // hall bath
    rect(425, 272, 90, 285), // hall + laundry
    rect(107, 378, 33, 84), // closet
    rect(8, 465, 87, 95), // bath
    rect(252, 545, 100, 118), // porch / storage
    rect(582, 272, 100, 40), // closet
  ],
};
}

/** A made-up layout for the public demo. Not the real house. */
const DEMO_PLAN: FloorPlan = {
  name: 'Demo home',
  approximate: false,
  width: 640,
  height: 420,
  outline: [[10, 10], [630, 10], [630, 410], [10, 410]],
  rooms: [
    { areaId: 'living', points: rect(10, 10, 200, 160) },
    { areaId: 'kitchen', points: rect(210, 10, 170, 160) },
    { areaId: 'media', points: rect(380, 10, 130, 160) },
    { areaId: 'outside', points: rect(510, 10, 120, 400) },
    { areaId: 'primary', points: rect(10, 170, 150, 130) },
    { areaId: 'kids', points: rect(160, 170, 120, 130) },
    { areaId: 'bedroom2', points: rect(280, 170, 115, 130) },
    { areaId: 'bedroom3', points: rect(395, 170, 115, 130) },
    { areaId: 'bedroom4', points: rect(10, 300, 150, 110) },
    { areaId: 'porch', points: rect(160, 300, 120, 110) },
    { areaId: 'garage', points: rect(280, 300, 230, 110) },
  ],
  spaces: [],
};

export const floorPlan: FloorPlan = __PUBLIC__ ? DEMO_PLAN : tracedPlan();
