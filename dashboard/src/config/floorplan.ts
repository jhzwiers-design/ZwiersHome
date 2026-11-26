/**
 * Floor plan — room shapes for the interactive home map (Lights & fans screen).
 *
 * Traced from the architect's first-floor plan (Design Studio, "Zwiers
 * Residence", sheet 4) on 26 Nov 2026, so proportions follow the real walls.
 * Coordinates are written in pixels of that drawing and scaled by `P()`.
 *
 * Room links: each interactive room links to a Home Assistant Area by
 * `areaId`, so lights and fans appear in the right room automatically.
 *  - Rec Room → "Media Room" area; Back Porch → "Outside" area.
 *  - Plan Bedroom 2 → Lauren's (bedroom2), Bedroom 3 → Allie's (bedroom3),
 *    Bedroom 4 → John's (bedroom1), Bedroom 5 → Tim's (bedroom4).
 *  - Upstairs (fan + lights) is drawn as a separate dashed tile.
 *  - Man Door: the exterior door off the garage, drawn just outside its wall.
 * `spaces` are non-interactive rooms (baths, closets, office…) drawn for context.
 *
 * Public builds use DEMO_PLAN instead, so the real layout never goes online.
 */

export type Pt = [number, number];

export interface PlanRoom {
  areaId: string;
  /** Polygon points [x, y][] in plan units. */
  points: Pt[];
  /** Optional label position override. Defaults to the polygon's centre. */
  label?: Pt;
  /** Drawn apart from the house (dashed), e.g. an upstairs room. */
  detached?: boolean;
  /** Small caption above the name, e.g. "Upstairs". */
  caption?: string;
}

export interface PlanSpace {
  points: Pt[];
  label?: string;
}

export interface FloorPlan {
  name: string;
  /** Shown under the map, e.g. "Traced from the architect's plan". */
  note: string;
  width: number;
  height: number;
  /** House outline. */
  outline: Pt[];
  rooms: PlanRoom[];
  spaces: PlanSpace[];
}

const rect = (x: number, y: number, w: number, h: number): Pt[] => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
];

/** Real layout (architect's plan). A function so public builds drop it entirely. */
function tracedPlan(): FloorPlan {
  // Drawing pixels → plan units.
  const S = 0.76;
  const P = ([x, y]: Pt): Pt => [Math.round((x - 95) * S), Math.round((y - 40) * S)];
  const poly = (pts: Pt[]) => pts.map(P);
  const box = (x: number, y: number, w: number, h: number) => poly(rect(x, y, w, h));
  return {
    name: 'First floor',
    note: "Traced from the architect's plan",
    width: Math.round(1050 * S),
    height: Math.round(905 * S),
    outline: poly([
      [660, 52], [1020, 52], [1020, 490], [1055, 490], [1055, 842], [985, 842], [985, 870], [790, 870], [790, 800],
      [570, 800], [570, 937], [430, 937], [430, 842], [215, 842], [215, 800], [108, 800], [108, 660], [105, 660],
      [105, 320], [290, 320], [290, 488], [660, 488],
    ]),
    rooms: [
      { areaId: 'media', points: box(105, 320, 185, 228) }, // Rec Room
      { areaId: 'outside', points: box(290, 330, 370, 158) }, // Back Porch
      { areaId: 'living', points: box(290, 488, 205, 234) },
      { areaId: 'kitchen', points: box(495, 600, 165, 190) },
      { areaId: 'primary', points: box(660, 265, 180, 143) },
      { areaId: 'bedroom3', points: poly([[840, 52], [958, 52], [958, 122], [1020, 122], [1020, 180], [840, 180]]) },
      { areaId: 'bedroom2', points: box(875, 295, 145, 113) },
      { areaId: 'bedroom1', points: box(255, 722, 105, 120) }, // plan Bedroom 4
      { areaId: 'bedroom4', points: box(105, 548, 133, 112) }, // plan Bedroom 5
      { areaId: 'porch', points: box(215, 845, 215, 65) },
      { areaId: 'garage', points: poly([[830, 490], [1055, 490], [1055, 842], [790, 842], [790, 620], [830, 620]]) },
      // Drawn after the garage so its label sits on top.
      { areaId: 'mandoor', points: box(1058, 495, 82, 100) },
      { areaId: 'upstairs', points: box(125, 95, 150, 115), detached: true },
    ],
    spaces: [
      { points: box(660, 52, 180, 123), label: 'Master bath' },
      { points: box(660, 175, 180, 90), label: 'Closets' },
      { points: box(840, 180, 35, 310) },
      { points: box(875, 180, 145, 65), label: 'Bath 2' },
      { points: box(875, 245, 145, 50) },
      { points: box(958, 52, 62, 70) },
      { points: box(905, 408, 115, 82), label: 'Storage' },
      { points: box(790, 440, 40, 180), label: 'Stairs' },
      { points: box(660, 408, 130, 107), label: 'Office' },
      { points: box(660, 515, 65, 105), label: 'Powder' },
      { points: box(725, 515, 65, 105), label: 'Mud room' },
      { points: box(660, 620, 130, 80), label: 'Pantry' },
      { points: box(660, 700, 130, 100), label: 'Laundry' },
      { points: box(495, 488, 165, 112), label: 'Keeping' },
      { points: box(238, 548, 52, 174) },
      { points: box(108, 660, 147, 140), label: 'Bath 3' },
      { points: box(360, 722, 70, 120), label: 'Foyer' },
      { points: box(430, 722, 65, 68), label: "Butler's" },
      { points: box(495, 790, 75, 10) },
      { points: box(430, 790, 140, 147), label: 'Dining' },
    ],
  };
}

/** A made-up layout for the public demo. Not the real house. */
const DEMO_PLAN: FloorPlan = {
  name: 'Demo home',
  note: 'Example layout',
  width: 640,
  height: 420,
  outline: [[10, 10], [630, 10], [630, 410], [10, 410]],
  rooms: [
    { areaId: 'living', points: rect(10, 10, 200, 160) },
    { areaId: 'kitchen', points: rect(210, 10, 170, 160) },
    { areaId: 'media', points: rect(380, 10, 130, 160) },
    { areaId: 'outside', points: rect(510, 10, 120, 290) },
    { areaId: 'mandoor', points: rect(510, 300, 120, 110) },
    { areaId: 'primary', points: rect(10, 170, 150, 130) },
    { areaId: 'upstairs', points: rect(160, 170, 120, 130) },
    { areaId: 'bedroom2', points: rect(280, 170, 115, 130) },
    { areaId: 'bedroom3', points: rect(395, 170, 115, 130) },
    { areaId: 'bedroom1', points: rect(10, 300, 75, 110) },
    { areaId: 'bedroom4', points: rect(85, 300, 75, 110) },
    { areaId: 'porch', points: rect(160, 300, 120, 110) },
    { areaId: 'garage', points: rect(280, 300, 230, 110) },
  ],
  spaces: [],
};

export const floorPlan: FloorPlan = __PUBLIC__ ? DEMO_PLAN : tracedPlan();
