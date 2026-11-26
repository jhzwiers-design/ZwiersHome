# Zwiers Home: Go-live plan (one-time purchases, no subscriptions)

_Prepared 25 Nov 2026. A plan only: nothing has been bought, installed, or changed._

## Your requirement
Pay once. No monthly fees.

## The no-subscription setup

| Piece | What it does | One-time cost | Subscription? |
|---|---|---|---|
| **Home Assistant Green** | The always-on "brain": runs Home Assistant and serves this dashboard to every phone, tablet and the iPad | **$199** | None. Home Assistant is free and open source |
| **Zigbee adapter (Connect ZBT-2)** | Lets Home Assistant control Zigbee lights directly, **replacing the SmartThings $4.99/month API plan** | ~$49 | None |
| **Z-Wave adapter (Connect ZWA-2)** | Same, for Z-Wave switches and dimmers | ~$69 | None |
| USB extension cable | Keeps the adapters away from interference | ~$8 | None |
| **Your old iPad + wall mount** | Always-on wall hub (see below) | ~$20–40 for a mount | None |
| **Remote access: Tailscale** (or WireGuard) | Use the dashboard away from home, privately | $0 | Free personal plan. Pick it over Home Assistant Cloud, which is a subscription. |
| Carrier thermostat (`ha_carrier`) | Thermostat control through your existing Carrier account | $0 | None |
| Hayward OmniLogic (local integration) | Pool and spa control over your home network | $0 | None |
| Ring (official integration) | Doorbell events, live view, chime | $0 | Live view is free. **Only recorded clips** need Ring Protect, which is optional. |

**Typical total: about $250–350 once.** Update 25 Nov 2026: Living Room Lights reports **Z-Wave** (Honeywell in-wall dimmer), so the likely list is **Home Assistant Green ($199) + Connect ZWA-2 (~$69) ≈ $268**, pending a check of one or two more devices.

### The trade-off you're choosing
Avoiding the SmartThings fee means **re-pairing each light** onto Home Assistant's own adapter, roughly 5–10 minutes per light, and rebuilding any SmartThings automations in Home Assistant. In return, the lights become local: faster, and they keep working when the internet is down. Lights that are Wi‑Fi, Matter or Philips Hue (with a Hue Bridge) don't need an adapter at all.

### Remote access without a subscription
- **Tailscale (recommended):** a free app on each family phone that creates a private connection home. Nothing on your network is exposed to the internet. Confirm the free plan's current user limits when you sign up.
- **WireGuard add-on (fully self-hosted, also free):** runs on the Home Assistant Green. It needs one port opened on the eero, which is a router change I'd only make with your approval.
- **Avoid:** opening the dashboard itself to the internet, or Home Assistant Cloud if you want to stay subscription-free.

## The old iPad as an always-on home hub

The iPad is the **screen**, not the server. The Home Assistant Green does the work; the iPad shows the dashboard's dedicated **wall display** (`#/wall`).

**Setup (when we get there):**
1. Open the dashboard in Safari, then Share → **Add to Home Screen**, so it opens full-screen like an app.
2. Settings → Display & Brightness → **Auto-Lock: Never**.
3. Settings → Accessibility → **Guided Access** on: it locks the iPad to the dashboard app.
4. Sign in with a dedicated Home Assistant user for the iPad, with "keep this device signed in" (see discovery report §3.1a), and revoke it any time.
5. Mount it near a power outlet. The wall display already dims at night (Settings → Wall display).

**Battery care:** an iPad on charge 24/7 can wear its battery. iPadOS's "Optimized Battery Charging" helps; a later option is a smart plug that Home Assistant switches on and off to keep the battery between about 40 and 80%.

**Compatibility check needed:** the dashboard uses modern Safari features that need **iOS/iPadOS 16.4 or newer**. iPads that can't update that far (for example the iPad Air 2 and the 5th-generation iPad, which stop at iPadOS 15 or 16) would need a compatibility build. **Please send the iPad's model and iPadOS version** (Settings → General → About).

## Order of steps (each needs your approval when we reach it)
1. Choose the monogram and finish the design review (no purchases).
2. Send the SmartThings device list, which decides the Zigbee adapter, Z-Wave adapter, both, or neither.
3. Buy the Home Assistant Green (+ adapters).
4. Install Home Assistant, connect Carrier, OmniLogic and Ring, then move lights one by one.
5. Point the dashboard at Home Assistant (Milestone 2 code) and switch off sample data.
6. Set up Tailscale for family phones and the iPad wall hub.
