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

- 2026-11-25: **New brand palette** (navy, slate, crimson, wine) applied to the dashboard and the brand canvas; peach dropped at your request. Lit rooms glow crimson; dial gauges run crimson → bright crimson.
- 2026-11-25: **Brand exploration**: a design canvas (private) with 8 ZH monogram directions, including 3 "Hand Drive" ideas, app-icon and small-size tests, and lockups. Recommended: A "Gable" mark with B "Bridge" below 24 px.
- 2026-11-25: Local git repository created; remote set to GitHub `jhzwiers-design/ZwiersHome`. **Not pushed yet.** Waiting for the repo to be made private.

- 2026-11-25: **Unified palette** (Burnt Umber, Redwood, Macadamia, Cool Blue, Light Grayish) replaces the earlier navy/peach set.
- 2026-11-25: **Signature colours per system** (reference: tiles with coloured header bands): Lighting gold, Climate ember, Pool sky, Spa sage, Security violet, Devices steel. Navigation, tiles, switches, dials and the home map take each system's colour.
- 2026-11-25: **Accessibility pass.** Contrast audited by script for both themes; all text and signature pairs pass WCAG 2.2 AA. Added high-contrast control outlines, bright edges on red controls, and stronger hint text. Problems are rose red with an icon and words.
- 2026-11-25: **Micro-interactions**: staggered tile entrance, value tick, hover lift, button press, springy switches and selectors, gliding dials, sliding toasts, theme cross-fade, page fade. All respect "reduce motion".
- 2026-11-25: Brand canvas recoloured to the new palette, plus a "Colour and accessibility" board with measured ratios.

- 2026-11-25: **Phone polish**: compact sticky app bar, smaller titles, short status pill, swipeable rails for rooms and scenes, a solid camera button.
- 2026-11-25: **Tap feedback**: ripples from the finger on every button, link, chip and switch; navigation icons pop; values tick; light haptic tick on supported phones. Respects "reduce motion".
- 2026-11-25: **Go-live plan with one-time purchases only**: [docs/02-go-live-plan.md](docs/02-go-live-plan.md) (Home Assistant Green + adapters instead of the SmartThings plan; Tailscale for remote access; old iPad as a wall hub).
- 2026-11-25: Code pushed to the private GitHub repo `jhzwiers-design/ZwiersHome` (by you).

- 2026-11-25: **Gable chosen as the monogram.** It's now the dashboard logo, browser icon and home-screen app icon (Add to Home Screen opens it full-screen).
- 2026-11-25: **Sample home rebuilt from your real SmartThings device list**: 13 lights, 2 fans, 2 hubs and a TV across your SmartThings rooms (Living Room, Kitchen, Master Bedroom, Media Room, Kids Room, Lauren’s, Allie’s and Tim’s rooms, Front Porch, Outside). On/off states match the screenshots; the Media Room TV and second hub show as offline, as they do in SmartThings.
- 2026-11-25: Fixed the thermostat and pool dials on phones (the temperature now scales with the circle).

- 2026-11-25: **Fixed white screens**: an error screen if a page fails, a clear "browser too old" message (needs iOS 16.4+), safer code for older Safari, and the home-network link (port 5174) now serves the production build instead of the developer version. Start it with `npm run home`.
- 2026-11-25: Guide for **password-protected family sharing** at no cost: [docs/03-share-with-family.md](docs/03-share-with-family.md) (Cloudflare Pages + Zero Trust email codes). Not set up yet: it needs your Cloudflare account.

- 2026-11-25: **Live at https://home.johnzwiers.com** (public, Cloudflare Workers, free). It auto-updates on every push to GitHub. The public build shows generic bedroom names, a demo floor plan and no model numbers; the real details stay on your Mac. The login was removed at your request; the email codes never arrived, which is still to investigate. Your portfolio at johnzwiers.com is untouched.

## Next milestone
**M2: data-source layer + Home Assistant connection (code only).** Build `HomeAssistantSource` behind the existing interface: login flow, token storage per §3.1a, registry discovery by areas/labels, live state, command mapping, reconnects. It can be developed and unit-tested without a running Home Assistant. A real connection waits for M3, the optional Home Assistant trial on this Mac, **which needs your approval to install**.

## Waiting on you
- [ ] **Design review of round 1** (tiles, new palette, home map).
- [x] Monogram: **Gable**
- [ ] **Old iPad: model and iPadOS version** (decides whether it runs the dashboard as-is).
- [ ] **Floor plan scan.** It replaces the approximate room shapes on the home map.
- [ ] **Room names.** Some SmartThings labels were cut off in the screenshots (e.g. "Alli… Room", "…n's room"); they're placeholders "Bedroom 2–4" for now.
- [x] SmartThings device list received
- [x] Light protocol: **Living Room Lights is Z-Wave** (manufacturer code 0039 = Honeywell; 0039-4944-3038 appears to be their Z-Wave Plus in-wall dimmer). Adapter needed: **Connect ZWA-2 (~$69)**; Zigbee adapter likely unnecessary.
- [x] Confirmed: Master Bedroom fan is also **Honeywell Z-Wave** (0039-4944-3131). **Shopping list final: Home Assistant Green + Connect ZWA-2 ≈ $268 once.** No Zigbee adapter needed.
- [ ] Confirm map rooms: which of the two cut-off bedrooms is Lauren’s and which is Tim’s
- [ ] Carrier app name
- [ ] OmniLogic controller model, firmware/MSP version, connection type, equipment list (any dual-speed pumps?)
- [ ] Ring Protect plan
- [ ] Users / wall tablet model
- [x] Direction chosen: **one-time purchases, no subscriptions** (Home Assistant Green + Zigbee/Z-Wave adapters; see go-live plan)
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
