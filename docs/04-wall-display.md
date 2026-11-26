# Wall display: the kitchen iPad

Target device: **iPad Air 11"** (iPadOS 26.6), plugged in, mounted in landscape. Portrait also works.

> **Status:** designed and tested in a desktop browser emulating the iPad's screen sizes. **Not yet tested on the physical iPad.** Do that before relying on it.

## What it shows
The **Home display** (`#/wall`) answers "what's happening at home?" from across the room, without touching it:

- the time, the date and the outside temperature
- a one-line status ("All is well at home", or what needs attention)
- alerts, which are never hidden, dimmed or muted
- **Main Floor** and **East Wing** thermostats: the room temperature and what each is doing
- **Pool** and **Spa** water temperatures
- **Lights:** how many are on, and in which rooms
- **Front door:** the last doorbell press, the last motion, and whether the doorbell is online
- three scene buttons: Arriving Home, Evening, Goodnight

A dock at the bottom opens **Lights, Climate, Pool & Spa** and **Security**. **Home** always returns to the Home display. The gear icon, top right, opens Settings.

### It never scrolls
Every size follows the screen height, so the Home display fits without scrolling in all of these cases (verified by measuring the page):

| Viewport | Situation | Result |
|---|---|---|
| 1180 × 820 | Landscape, full screen (Home Screen app) | Fits, nothing clipped |
| 1180 × 740 | Landscape, Safari with its toolbar | Fits, nothing clipped |
| 820 × 1180 | Portrait | Fits, nothing clipped |

The other screens (Lights, Climate, and so on) do scroll, as normal pages.

## Wall mode
Opening `#/wall` on a device turns on **wall mode** for that device only. In wall mode:
- the app opens on the Home display
- the side and bottom menus are replaced by the dock

Settings is reached from the gear icon. Devices opens from the alert links. To turn wall mode off, go to **Settings → Wall display → Use this device as a wall display**.

| Setting | Default | What it does |
|---|---|---|
| Calm look | When idle | After 2 minutes untouched on the Home display, colours are muted. Alerts stay bright. The first touch only wakes the screen; it never presses a button. "Always" keeps it calm; "Off" disables it. |
| Return to Home display | **Never** | After 1, 2, 5 or 10 minutes untouched, go back to the Home display and close any open question. **It only changes the screen; it never turns anything on or off.** Leave it off until it has been tried on the iPad. |
| Dim at night | On, 22:00–06:30 | Lowers the brightness of everything except alerts. |
| Quick controls | On | Shows the scene buttons on the Home display. |

## Setting up the iPad (when ready)
These are iPad settings. The website cannot change them.

1. **Add to Home Screen.** In Safari, open the dashboard address, tap Share, then *Add to Home Screen*. It then opens full screen with no Safari toolbar, using the Gable icon.
2. **Keep the screen on.** Go to Settings → Display & Brightness → **Auto-Lock → Never**. A website cannot stop an iPad from sleeping, so this setting is what keeps it on. Night dimming only lowers the dashboard's own brightness.
3. **Optional: lock it to the dashboard.** Go to Settings → Accessibility → **Guided Access**, turn it on, then triple-click the top button while the dashboard is open. This stops anyone leaving the app. You'll need a passcode to exit.
4. **Optional: lower the screen brightness** and turn on True Tone for a softer look in the evening.
5. **Keep it charging.** An iPad that is always on and always charging should use iPadOS's *Optimized Battery Charging*. iPadOS manages this itself.

## Behaviour on the iPad
- **Safe areas:** the edges respect the iPad's rounded corners and the Home indicator (`env(safe-area-inset-*)`).
- **Rotation:** the layout switches between landscape and portrait automatically. The navigation pill re-measures itself after a rotation.
- **Network interruptions:** if Wi-Fi drops, the top chip changes to "Reconnecting · last known". Temperatures turn grey and read "Last known", and scene buttons pause. Nothing pretends to be live.
- **Touch:** every target is at least 44 × 44 px. There's no double-tap zoom delay and no grey tap flash.

## Still to do
- Test it on the real iPad: Safari and the Home Screen app, both orientations, overnight, Guided Access.
- Try *Return to Home display* on the iPad, then decide whether to turn it on.
- When Home Assistant is connected, the iPad will need its own sign-in. That is planned in [02-go-live-plan.md](02-go-live-plan.md).
