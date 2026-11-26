# Zwiers Home: Project Status

_Running log of completed work, open tasks, and known limitations. Updated each working session._

## Current phase
**Milestone 1 (design system + interactive prototype): redesign round 1 done (tiles, red accents, home map), awaiting your review.**
- Run the prototype: see [dashboard/README.md](dashboard/README.md) (`cd dashboard && npm run dev`, then open http://localhost:5173).
- Discovery report: [docs/01-discovery-report.md](docs/01-discovery-report.md) (revision 2.1)

## Decisions
| Date | Decision |
|---|---|
| 2026-11-25 | Architecture: Home Assistant → custom React/TypeScript dashboard. |
| 2026-11-25 | **v1 has no separate backend.** The dashboard uses Home Assistant's own login: a 30-min access token plus a refresh token that expires after 90 days unused and can be revoked. Session storage by default. |
| 2026-11-25 | The prototype comes first, on clearly labeled sample data. No hardware or subscriptions until after design review. |
| 2026-11-25 | Stack: React 19, TypeScript 5.9, Vite 8, Tailwind CSS 4 (token-driven), Radix primitives, Zustand, Zod, Lucide icons, Inter (bundled locally, no external font service). |

## Completed
- 2026-11-25: Environment check, passive network scan, integration research, discovery report (rev 1).
- 2026-11-25: Rev 2: migration assessment, $199 Green price, backend deferred, Carrier/Hayward detail.
- 2026-11-25: Rev 2.1:
  - Token lifecycle documented (§3.1a, verified in Home Assistant's source)
  - SmartThings fee confirmed to apply to API access only, not the app
  - **Two separate Thread networks found**: eero `eero-thread-e4bb` (4 eero units) and the SmartThings hub's own `ST-3021750241`
- 2026-11-25: **Milestone 1 prototype built and tested.**
  - **Design system:**
    - Tokens for dark and light themes, type scale, 4 px spacing, motion
    - Components: status indicator, metric, toggle, slider, stepper, segmented control, confirm dialog, toasts, skeletons, notes
  - **All seven sections plus a dedicated wall display.**
    - Overview: status sentence, key readings, climate, pool, lighting, security, alerts
    - Lighting: areas, scenes, on/off, brightness, colour temperature, filters
    - Climate: setpoints with combined sending, mode, fan, comfort presets, system info
    - Pool & Spa: pool and spa side by side; heaters, pumps with speed presets, lights and shows, valves, chlorinator, spa mode, read-only schedules
    - Security: camera placeholder with live-view request flow, device status, chime controls, filterable event history
    - Devices: Online/Off/Offline/Unavailable counts and filters, integration health, search, expandable details
    - Settings: theme, units, clock, start page, Overview sections, wall-display dimming, connection info (no credentials), prototype tools
  - **Interaction states:**
    - Initial loading skeleton
    - Per-control pending indicators
    - Success and error toasts
    - Confirmation dialogs for disruptive pool/spa operations
    - Validation before sending (safety ranges, availability)
    - Stale-data marking, connection-loss banner with dimmed last-known values
    - Live doorbell notification
  - **Architecture:**
    - The `DataSource` interface keeps sample data separate from the future Home Assistant source
    - Shared `validateCommand()`
    - Config-driven (`home.config.ts`, zod-validated)
    - No device IDs in screens
  - **Accessibility:** keyboard navigation, skip link, focus management, labelled controls, aria-live announcements, status not conveyed by colour alone, reduced motion.
  - **Tested in the browser at:**
    - Desktop 1440×900
    - Tablet landscape 1024×768
    - Tablet portrait 820×1180
    - Phone 390×844
    - Wall display 1280×800
    - Dark and light themes
  - Type-check and production build pass.

- 2026-11-25: **Design round 1, from your feedback and reference images:**
  - Rounded tiles throughout, pill buttons/chips/option selectors, round icon badges, floating pill navigation, top bar with a moon/sun theme switch.
  - Accent colour: electric red in dark mode, crimson in light mode. Problems moved to amber (with icons) so they can't be confused with "on".
  - Warmer dark and light palettes.
  - New round dial gauges for the thermostat and pool/spa water.
  - **Interactive home map** in Lighting (3D/2D): rooms glow when lit; click a room to control its lights. The room layout is traced approximately from the SmartThings map screenshots.
  - Sample rooms now mirror your home: Media Room, Patio, Living Room, Kitchen, Front Entry, Kids' Room, Primary Bedroom, Bedrooms 2–4, Garage, plus Backyard for pool equipment.
  - Re-tested at desktop, tablet, phone and wall sizes in both themes; build passes.

- 2026-11-25: **New brand palette** (navy, slate, peach, crimson, wine) applied to the dashboard and the brand canvas. Lit rooms on the map glow peach; dial gauges run crimson → peach.
- 2026-11-25: **Brand exploration**: a design canvas (private) with 8 ZH monogram directions, including 3 "Hand Drive" ideas, app-icon and small-size tests, and lockups. Recommended: A "Gable" mark with B "Bridge" below 24 px.
- 2026-11-25: Local git repository created; remote set to GitHub `jhzwiers-design/ZwiersHome`. **Not pushed yet.** Waiting for the repo to be made private.

## Next milestone
**M2: data-source layer + Home Assistant connection (code only).** Build `HomeAssistantSource` behind the existing interface: login flow, token storage per §3.1a, registry discovery by areas/labels, live state, command mapping, reconnects. It can be developed and unit-tested without a running Home Assistant. A real connection waits for M3, the optional Home Assistant trial on this Mac, **which needs your approval to install**.

## Waiting on you
- [ ] **Design review of round 1** (tiles, new palette, home map).
- [ ] **Pick a monogram direction** from the brand canvas.
- [ ] **Make the GitHub repo private**, then I push.
- [ ] **Floor plan scan.** It replaces the approximate room shapes on the home map.
- [ ] **Room names.** Some SmartThings labels were cut off in the screenshots (e.g. "Alli… Room", "…n's room"); they're placeholders "Bedroom 2–4" for now.
- [ ] SmartThings device list (decides the Zigbee/Z-Wave adapter vs. none)
- [ ] Carrier app name
- [ ] OmniLogic controller model, firmware/MSP version, connection type, equipment list (any dual-speed pumps?)
- [ ] Ring Protect plan
- [ ] Users / wall tablet model
- [ ] Later: hosting (Home Assistant Green $199 vs. other) and lighting path (SmartThings ~$4.99/mo vs. migration)
- [ ] Later: Dolphin model number

## Outstanding issues (prototype)
- **The sample data is invented.** Device names, equipment (e.g. the pool's variable-speed pump, gas heater, ColorLogic lights) and the number of zones are placeholders until your real equipment lists arrive.
- Sample state resets on page reload (by design). Preferences persist per browser.
- The camera shows a labelled placeholder; no video until the Ring integration is connected.
- Pool **schedules are read-only** and the light-show list is fixed sample content.
- The production Content-Security-Policy is applied only to builds (Vite's dev server needs inline scripts). The Home Assistant address will be added to it in M2.
- A single climate zone is assumed in the layout. Multi-zone Infinity systems will need a zone selector if yours has zones.
- Not yet tested on a physical tablet or phone. Use `npm run dev:lan` to try it on your own devices.
- The home map layout is approximate. Unlabelled spaces (baths, closets, halls) aren't clickable.
- On phones the home map scrolls sideways to keep room names readable.
- Dark-mode electric-red buttons with white text meet contrast guidelines for large/bold text only; if needed, the red can be deepened slightly.

## Known limitations (integrations)
- **SmartThings:** cloud only, with the paid Developer Plan from Dec 2026. The fee covers API access only; the SmartThings app is unaffected. Going local means re-pairing lights on a ZBT-2 (~$49) / ZWA-2 (~$69).
- **Carrier:** no official or Home Assistant built-in integration. The community `ha_carrier` uses the cloud and was tested on sister model SYSTXCCWIC01-B.
- **OmniLogic:** the built-in integration is cloud-only and limited. The community local integration lacks dual-speed pumps, ORP chlorination and schedule editing, and needs a fixed IP.
- **Ring:** no two-way audio; recordings need Ring Protect.
- **v1 security model:** any signed-in Home Assistant user can control everything. The dashboard's checks are a safety net, not a security boundary.
- **Thread:** two separate Thread networks (eero and SmartThings hub). Choosing one to standardise on is a later decision.
- **This Mac** is a laptop, so it's unsuitable as a permanent Home Assistant host.

## Changes made to home equipment
_None._ The prototype makes no connections to any device or service.
