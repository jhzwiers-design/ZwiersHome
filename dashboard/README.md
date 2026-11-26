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
| `#/wall` | Home display for the wall iPad (turns on wall mode for that device) |

Other scripts:
- `npm run dev:lan` serves on your home network so you can try it on a tablet or phone. It binds to all interfaces, so use it only on your home network.
- `npm run build` runs the type-check and creates a production build in `dist/` (it includes a strict Content-Security-Policy).
- `npm run typecheck` runs the type-check only.
- `npm test` runs the unit tests (dial maths) with Node's built-in test runner.

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

Apple-inspired: calm surfaces, generous rounding, one accent colour that means "you can touch this".

| | |
|---|---|
| Tokens | `src/styles/tokens.css` (dark + light). Components never use raw colour values. |
| Accent | **Crimson `#A71930`** in light mode, **electric red `#FF303B`** in dark. Used only for interactive things: selected navigation, switches that are on, the thermostat dial and buttons, selected rooms, primary buttons. |
| Status colours | Amber = needs attention · green = good/confirmed · neutral grey = off/inactive · muted blue = information. Always paired with an icon and words, never colour alone. |
| Category colours | Lighting gold, Climate coral, Pool sky, Spa teal, Security violet. Identity only (icon chips, faint header tints, the glow of lit rooms), never for controls. `data-tone="<system>"` sets them. |
| Type | The Apple system font (SF Pro) on Apple devices, Inter elsewhere. Tabular figures for numbers. |
| Shape | 16–22 px radii: tiles 20 px, dialogs 22 px, scene buttons 18 px; pill buttons and chips. |
| Theme | Light and dark, remembered per device, with a short cross-fade when switching. |
| Contrast | Text pairs ≥ 4.5:1, icons and control outlines ≥ 3:1 (WCAG 2.2 AA). |

### Motion
All motion is 150–420 ms, uses `--ease-out` (deceleration) or `--ease-spring` (a small overshoot), and switches off under "reduce motion".
- **Navigation:** one shared selection pill slides between items (desktop/iPad side pill, phone bottom bar, wall dock). Icons grow slightly when selected.
- **Pages:** fade and rise 8 px over 240 ms.
- **Controls:** buttons press in (scale), switches spring, the dial handle grows while dragged, values tick when they change.
- **Dialogs:** scale + fade in and out over a soft blurred backdrop. **Toasts** slide in and out.
- **Feedback:** scenes show a spinner then a green tick; thermostat changes show Adjusting… → Sending… → Set ✓ (or a plain-language failure).

### Thermostat dial (`src/components/Dial.tsx`, maths in `src/lib/dial.ts`)
- Drag the handle with a finger, mouse or trackpad; tap anywhere on the ring to jump there. 1 °F steps.
- Grabbing the handle never makes it jump; the gap at the bottom of the ring pins to the nearest end instead of flipping min↔max.
- Keyboard: arrows ±1, Page Up/Down ±5, Home/End. Screen readers see a slider with "Heat to 71°".
- The target (red arc + big number) is separate from the room temperature (small tick on the ring + "now 69.6°").
- Sends 650 ms after you stop. While sending, you can keep adjusting; the newest value wins. If it fails, the target goes back and a message says so. While disconnected, the last known value is shown and controls pause.

Key components:
- **`Section` / `Tile` / `IconChip` / `Metric`**: the rounded tiles every screen is built from.
- **`Dial` / `ThermostatControl`**: the draggable thermostat (dial and compact variants).
- **`ArcGauge`**: read-only round gauge for pool/spa water.
- **`HomeMap`**: floor plan with a 3D/2D view; rooms glow when their lights are on, and clicking a room opens its lights.
- **`SceneButton`**: icon, name, description, pending and success states.
- **`StatusIndicator` / `StatusDot`**: On / Online / Off / Offline / Unavailable, by shape and wording as well as colour.
- **`Toggle`, `RangeSlider`, `Stepper`, `Segmented`**, **`ConfirmDialog` (`useConfirm`)**, **`Toaster`**, **`ThemeSwitch`**.
- **`WallDock`**: the wall display's five-item dock.

### Wall display
See [docs/04-wall-display.md](../docs/04-wall-display.md) for the iPad set-up.
- `#/wall` is the ambient **Home display**: time, date, both thermostats, pool, spa, lights, front door, alerts and three scene buttons. It never scrolls (landscape or portrait); sizes follow the screen height.
- Opening it turns on **wall mode** for that device: the full menu is replaced by a dock (Home, Lights, Climate, Pool & Spa, Security). Turn it off in Settings → Wall display.
- **Calm look** (off / when idle / always) mutes colour after 2 minutes untouched on the Home display; alerts stay bright. The first touch only wakes it.
- **Return to Home display** after 1–10 minutes untouched. **Off by default.** It only changes the screen and closes any open question; it never sends a command.
- Night dimming between set times.

### Floor plan
`src/config/floorplan.ts` holds the room outlines for the home map. Each room links to a Home Assistant Area by id, so lights appear in the right room automatically. The current shapes are **approximate**, traced from screenshots of the SmartThings 3D map; replace them with measurements from a scanned floor plan.

## Accessibility
- Every control is reachable by keyboard: Radix primitives for switches, sliders and dialogs, native radios for segmented controls, and a keyboard slider on the dial.
- Touch targets are at least 44 × 44 px (small visual buttons get an invisible larger hit area).
- There's a skip link, and focus moves to the page on navigation.
- Focus rings are visible.
- Every control has a descriptive label (for example "Kitchen recessed brightness").
- Status is never conveyed by colour alone.
- Reduced-motion preferences are respected.

## Offline and reliability
- The connection chip shows Live / Reconnecting / Disconnected. When the connection drops, a banner explains it, the page dims, every reading says "Last known", and controls pause rather than pretend.
- Each control shows its own state: idle, pending (spinner / "Sending…"), success (tick), failed (amber message, value restored), unavailable (dashed ring).
- Try it: Settings → Prototype tools → *Disconnect for 8 s*, or *Simulate failures*.

## Prototype-only behaviour
- A permanent "Prototype · sample data" banner, plus labels on toasts, dialogs and the camera.
- Sample data resets when the page reloads. Preferences persist in this browser.
- **Settings → Prototype tools** can simulate command failures, connection loss and a doorbell press, and can reset the sample data.
- The *Garage Workbench* light fails every other command on purpose, to show a weak-signal error.
