# Zwiers Home Dashboard

Custom smart-home dashboard. **Current state: Milestone 1 prototype, which runs on sample data only and makes no network connections to devices.**

## Run it

```bash
cd dashboard
npm install        # first time only
npm run dev        # http://localhost:5173
```

| Address | What it shows |
|---|---|
| `http://localhost:5173/#/overview` | Overview (default) |
| `#/lighting` `#/climate` `#/pool` `#/security` `#/devices` `#/settings` | Individual sections |
| `#/wall` | Dedicated wall-display layout (designed for a landscape tablet) |

Other scripts:
- `npm run dev:lan` serves on your home network so you can try it on a tablet or phone. It binds to all interfaces, so use it only on your home network.
- `npm run build` runs the type-check and creates a production build in `dist/` (it includes a strict Content-Security-Policy).
- `npm run typecheck` runs the type-check only.

## Architecture

```
src/
  config/        home.config.ts holds presentation and safety limits, validated by schema.ts (zod)
  data/
    types.ts     the domain model screens understand (HomeSnapshot, Light, ClimateZone…)
    commands.ts  every action as plain data + validateCommand() safety checks
    source.ts    DataSource interface, the boundary to the outside world
    sample/      SampleDataSource + sampleData.ts (Milestone 1, in memory)
    homeassistant/  Milestone 2 plan (not implemented)
  store/
    home.ts        snapshot, run(command) → validate → pending → result toast
    preferences.ts per-device display preferences (theme, units, wall display…)
  lib/           formatting and derived views (alerts, status sentence, counts)
  styles/        tokens.css (all colours/type/motion) + Tailwind mapping
  components/    design-system components (see below)
  layout/        AppShell: side rail / compact rail / bottom tabs, banners
  screens/       Overview, Lighting, Climate, PoolSpa, Security, Devices, Settings, Wall
```

**Data flow:** `DataSource` → `useHome` store → screens. Screens call `run(command, labels)`. The store validates the command against `home.config.ts` limits and the device's availability, shows a pending state on that control, then reports success or failure. When the Home Assistant source replaces the sample source in Milestone 2, no screen changes.

**No hard-coded devices.** Screens group by areas and categories the data source reports, and render only the controls a device says it supports. `home.config.ts` holds area order, overview modules, safety limits and which commands need confirmation.

## Design system

| | |
|---|---|
| Tokens | `src/styles/tokens.css` (dark + light). Components never use raw colour values. |
| Palette | Burnt Umber `#6D120B` · Redwood `#B02A29` · Macadamia `#FBF0D8` · Cool Blue `#113047` · Light Grayish `#739AB9`. |
| Brand accent | Redwood fills; accent text uses `--accent-ink` (lighter Redwood on navy, Redwood on cream). Redwood controls on navy carry a bright edge so they pass the 3:1 outline rule. |
| Signature colours | One per system: Lighting gold, Climate ember, Pool sky, Spa sage, Security violet, Devices steel. Put `data-tone="<system>"` on any element and every accent control inside takes that colour (see `src/lib/tones.ts`). Dark mode: pastel fills with navy text. Light mode: deep fills with cream text, pastel tints for header bands. |
| Problems | Rose red with a warning icon and words, never colour alone. |
| Accessibility | Every text/background pair is at least 4.5:1, and large text, icons and control outlines at least 3:1 (WCAG 2.2 AA), checked by script. `--faint` is decorative only. |
| Surfaces | Cool Blue navy tiles with cream text (dark); Macadamia cream with navy text (light). |
| Shape | Rounded tiles (20 px), pill buttons, chips and option selectors, round icon badges. |
| Type | Inter Variable (bundled locally), tabular figures for numbers. |
| Motion | Tiles rise in with a stagger, values tick when they change, cards lift on hover, buttons press, switches spring, dials glide, toasts slide in, the theme cross-fades. All 120–520 ms and switched off under "reduce motion". |

Key components:
- **`Section` / `Tile` / `IconChip`**: the rounded tile with an icon-and-title header that every screen is built from.
- **`Metric`**: a reading tile (caption, icon, big number, supporting line, stale state).
- **`ArcGauge`**: round dial for the thermostat setpoint and pool/spa water temperature.
- **`HomeMap`**: interactive floor plan with a 3D/2D view; rooms glow when their lights are on, and clicking a room opens its lights. The shapes are in `src/config/floorplan.ts`.
- **`StatusIndicator` / `StatusDot`**: On / Online / Off / Offline / Unavailable, conveyed by shape and wording as well as colour.
- **`Toggle`, `RangeSlider`, `Stepper`, `Segmented`**: controls with pending/disabled states.
- **`ConfirmDialog` (`useConfirm`)**, **`Toaster`**.
- **`ThemeSwitch`**: the moon/sun switch in the top bar.

### Floor plan
`src/config/floorplan.ts` holds the room outlines for the home map. Each room links to a Home Assistant Area by id, so lights appear in the right room automatically. The current shapes are **approximate**, traced from screenshots of the SmartThings 3D map; replace them with measurements from a scanned floor plan.

## Accessibility
- Every control is reachable by keyboard: Radix primitives for switches, sliders and dialogs, and native radios for segmented controls.
- There's a skip link, and focus moves to the page on navigation.
- Focus rings are visible (brass).
- Every control has a descriptive label (for example "Kitchen recessed brightness").
- Status is never conveyed by colour alone.
- Reduced-motion preferences are respected.

## Prototype-only behaviour
- A permanent "Prototype · sample data" banner, plus labels on toasts, dialogs and the camera.
- Sample data resets when the page reloads. Preferences persist in this browser.
- **Settings → Prototype tools** can simulate command failures, connection loss and a doorbell press, and can reset the sample data.
- The *Garage Workbench* light fails every other command on purpose, to show a weak-signal error.
