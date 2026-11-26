# Zwiers Home: Phase 1 Discovery Report

_Revision 2, 25 Nov 2026. Status: **architecture direction approved; hardware and subscriptions on hold until you've reviewed the prototype.**
Nothing has been installed, purchased, or subscribed to, and no device, hub, router, or account has been changed._

**Clarifications added 25 Nov 2026 (revision 2.1):**
- How browser sign-in tokens are stored, protected, and revoked (§3.1a).
- The SmartThings fee applies only to API access, not the app (§2A).
- The Thread scan shows **two separate Thread networks**, one from the eero and one from the SmartThings hub, with evidence (§1.1).

**Changes in revision 2:** Added a SmartThings → Zigbee/Z-Wave migration assessment (§2A). Corrected the Home Assistant Green price to $199 and added a Mac vs. dedicated-hardware comparison (§2F). The separate backend service is now **deferred** and not part of version 1 (§3). The Carrier and Hayward assessments are expanded and split into official vs. community options (§2C, §2D). The roadmap now puts the prototype first (§5).

---

## 0. Summary

| Question | Answer |
|---|---|
| Is Home Assistant installed? | **No**, neither on this Mac nor anywhere on your network. |
| Is the SmartThings hub online? | **Yes.** It's on the network as `hubv3-03021750241.local`. |
| Network | An eero mesh on subnet 192.168.4.x. There are **two separate Thread networks**: the eero's (4 eero units) and the SmartThings hub's own (§1.1). |
| Architecture (v1) | Home Assistant → custom **React + TypeScript** dashboard, signing in with Home Assistant's own login. **No separate backend in v1.** One can be added later without rewriting the interface (§3). |
| Avoiding the SmartThings fee | **Possible, but it means re-pairing every light.** The Aeotec hub **can't** be reused as Home Assistant's radio. You'd need a ~$49 Zigbee and/or ~$69 Z-Wave adapter (§2A). |
| Carrier | **No official support** from Carrier or Home Assistant. The best option is a well-maintained community integration that uses Carrier's cloud (§2C). |
| Hayward | **Home Assistant has a built-in (cloud) integration, but it's limited.** A community integration that talks to the controller directly on your network is much more complete (§2D). |
| Next step | **Build the visual prototype on sample data.** It doesn't need any hardware or subscriptions. |

---

## 1. Environment assessment

**This Mac:** a **MacBook Pro (M3 Pro, 36 GB RAM)** running macOS 27 on battery power, with Node 26 and git installed. Docker and Homebrew aren't installed, and Python is the old system 3.9. It's well suited to **developing** the dashboard. Because it's a laptop, it isn't suited to being the always-on home server (§2F).

**Network scan (read-only; I only listened for devices announcing themselves):**

| Found | Meaning |
|---|---|
| `_smartthings._tcp` at `hubv3-03021750241.local:8081` | The SmartThings Hub v3 is online. |
| Thread border agents (`_meshcop._udp`) | **Two separate Thread networks.** See §1.1. |
| `_eero._tcp` ×3 | eero mesh units. |
| `_matter._tcp` (1 device) | One Matter device; not yet identified. |
| No `_home-assistant._tcp` | Home Assistant isn't running anywhere. |

The scan didn't detect the thermostat, the pool controller, the doorbell, or the cleaner. That's expected: these devices don't announce themselves this way, so their absence doesn't mean they're offline.

### 1.1 Who owns the Thread network? Both the eero and the hub, separately

Every Thread border agent announces a `_meshcop._udp` service that includes its vendor, model, network name (`nn`), and extended network ID (`xp`). I read those announcements (read-only, nothing sent to the devices):

| Announced by | Host | Vendor / model | Thread network name | Extended network ID |
|---|---|---|---|---|
| eero ×4 | `eero-0811`, `eero-09hm`, `eero-05t9`, `eero-003w` | `vn=eero`, `mn=thread` | `eero-thread-e4bb` | identical on all four |
| SmartThings hub | `hubv3-03021750241` | `vn=SmartThings`, `mn=Hub` | `ST-3021750241` | **different** from the eero's |

**What this shows:**
- **There are two independent Thread networks.** The eero runs one, with four eero units as border agents. The SmartThings hub runs its own. They have different names and IDs, so a Thread device joined to one isn't on the other.
- **The hub is acting as a Thread border agent for its own network.** It also announces an off-mesh routable prefix (`omr`), which is what a border router publishes. So the evidence does show the hub doing border-router work, but **only for its own network, not the eero's**. My revision-1 wording ("the hub's Thread radio is active") was correct but incomplete.
- **What this doesn't show:** whether any devices are actually joined to either network, or which network the one Matter device uses. That needs the eero and SmartThings apps or, later, Home Assistant.
- **Why it matters later:** If we ever add Thread or Matter devices to Home Assistant, we'll choose one Thread network to standardize on. That's a later decision with no action now.

---

## 2. Integration research

**Terms used below**
- **Manufacturer-official:** built or supported by the device maker.
- **Home Assistant built-in:** ships with Home Assistant and is reviewed by the Home Assistant project, but is usually written by volunteers rather than the manufacturer.
- **Community (HACS):** a third-party add-in installed through the Home Assistant Community Store. It can be excellent, but it's unreviewed and depends on one maintainer.

Each integration must pass its own hands-on test before the dashboard shows it as working.

### A. SmartThings lighting: pay the fee, or move the lights

**What the fee covers (confirmed):** The Developer Plan is a charge for **access to the SmartThings cloud API**, which third-party apps, dashboards, and integrations like Home Assistant's use. **It doesn't apply to using the SmartThings app itself.** Your hub, devices, the SmartThings app, and SmartThings' own automations keep working without it. You'd only pay if you want Home Assistant (and therefore this dashboard) to talk to SmartThings. Reports also say the plan is only offered in certain countries (the US is included). Sources: SmartThings' announcement plus independent coverage (Android Authority, Gadget Hacks, Digital Citizen); see §7.

#### Option 1: Keep the lights on SmartThings (cloud)
- Home Assistant's built-in SmartThings integration goes through Samsung's cloud. From **2 Dec 2026** it runs on Samsung's paid **Developer Plan (~$4.99/month, ~$60/year)**, and the old free route reportedly stops after **15 Dec 2026**.
- The hub, its pairings, and its automations stay exactly as they are. Setup only needs an approval screen on your Samsung account.

#### Option 2: Move the lights onto Home Assistant's own radio (local, no subscription)

**Can the Aeotec hub be reused as Home Assistant's radio? No.** The Hub v3's Zigbee, Z-Wave, and Thread radios are only usable by SmartThings' own software. There's no supported way for Home Assistant to drive them. (Flashing the hub with other software isn't supported, would void its setup, and conflicts with your "don't reset the hub" rule.) The hub can keep running beside Home Assistant during and after a migration, though.

**Hardware needed** (only for the protocols your lights actually use):

| Your lights are… | Adapter for Home Assistant | Approx. price | Notes |
|---|---|---|---|
| **Zigbee** (most bulbs: Sengled, IKEA, Innr, Aeotec, older Hue without the Hue Bridge, many SmartThings-branded devices) | **Home Assistant Connect ZBT-2** (official) | **~$49** | Also handles Thread/Matter. Use a ~1 m USB extension cable (~$8) to keep it away from interference. |
| **Z-Wave** (most in-wall switches and dimmers: GE/Jasco/Enbrighten, Zooz, Inovelli) | **Home Assistant Connect ZWA-2** (official) | **~$69** | Supports Z-Wave Long Range. |
| **Wi-Fi** (LIFX, Kasa, Govee, Wiz…) | None | $0 | These connect to Home Assistant directly. The SmartThings fee may not matter for them at all. |
| **Philips Hue with a Hue Bridge** | None | $0 | Home Assistant's built-in Hue integration is local and excellent. Leave them on the Hue Bridge. |
| **Matter** | Possibly none | $0 | Matter devices can be shared with Home Assistant without leaving SmartThings, though some require Thread. |

**What migrating involves, light by light** (every step needs your approval when we get there):
1. Remove the light from SmartThings (Z-Wave: "exclude"; Zigbee: remove plus a factory reset of the bulb, often by flicking the power several times).
2. Pair it with Home Assistant.
3. Recreate any SmartThings automations or scenes that used it, in Home Assistant.

During the move, the hub can grab a freshly reset device before Home Assistant does. The usual fix is to keep Home Assistant in pairing mode right next to the device. Some people briefly power the hub off, but we won't do that without asking.

**Trade-offs**

| | Pay SmartThings (~$60/yr) | Migrate (~$49–118 once) |
|---|---|---|
| Effort | Low: one sign-in | Medium: roughly 5–10 min per light, plus rebuilding automations |
| Speed and reliability | Cloud round-trip; affected by Samsung outages | **Local**: faster, works without internet |
| Future cost risk | Samsung can change pricing again | None |
| Changes to your equipment | None | Lights leave SmartThings, and the SmartThings app no longer controls them |
| Needs dedicated hardware? | No (works with Home Assistant on the Mac) | **Effectively yes.** The adapter must stay plugged into a machine that's always on. |
| Payback | — | About 1–2 years |

**Recommendation:** Hold off on either decision until you've reviewed the prototype. **Neither option blocks design work.** When you're ready, **migrating is the better long-term choice** if your lights are Zigbee/Z-Wave and number in the dozens or fewer. A **hybrid** approach also works: move the lights to Home Assistant, and keep the hub for anything that's hard to move.

**What I need:** A screenshot of the SmartThings device list (or the brand and model of a few lights). That alone tells us which adapter, if any, is needed.

### B. Ring Wired Doorbell Plus (2nd Gen) + Chime: well supported (Home Assistant built-in)

_Unchanged from revision 1._ Home Assistant's built-in Ring integration goes through Ring's cloud. It provides doorbell press and motion events, online status, a WebRTC live view (to be tested on your unit; no two-way audio), and Chime volume and test sounds. Viewing past recordings requires **Ring Protect**. The community **ring-mqtt** add-on is the fallback for live video. Two-factor sign-in is entered by you.

### C. Carrier Infinity Touch Control (SYSTXCCITC01-B, firmware 4.31): detailed assessment

**Identifying it:** "ITC" means Infinity **Touch** Control; "-B" means the Series B hardware. Carrier's 4.31 release notes cover the **Series B Infinity System Controls** as a family, so your control runs the same firmware line as the models community tools are tested on. That's encouraging, but it isn't proof.

| Category | Option | Status for your model |
|---|---|---|
| **Manufacturer-official** | Carrier offers no Home Assistant integration and no published local API. | ❌ None |
| **Home Assistant built-in** | There's no Carrier/Infinity integration in Home Assistant. | ❌ None |
| **Community, cloud** | **`ha_carrier`** (HACS, default store) | ✅ **Best candidate.** See below. |
| **Community, local proxy** | **Infinitude**, plus the Home Assistant component `homeassistant-infinitude` (legacy) or its successor "infinitude-beyond" | ⚠️ Possible, invasive |
| **Community, wired** | InfinitESP / RS-485 bus tap | ⛔ Not recommended: requires wiring into the HVAC control bus |

**`ha_carrier` in detail**
- **How it works:** It signs in with **the same Carrier cloud account your Carrier app uses** ("Carrier Infinity / Côr" account). It gets near-real-time updates via Carrier's push channel ("most state changes arrive within a few seconds") with background polling as a fallback.
- **Tested on:** SYSTXCCWIC01-B on firmware 4.31, a sister Series B control. Other Infinity controls that work in the Carrier app are "expected to work". **Your exact model isn't named.** The project specifically warns that the older **A**-model (SYSTXCCITC01-**A**) is obsolete and may not get live updates. Yours is the **B** model, so that warning doesn't apply.
- **What it would provide:** Per-zone current temperature and humidity; heat / cool / auto / fan-only / off modes; single or high/low setpoints; fan auto/low/med/high; comfort presets (Home, Away, Sleep, Wake, Manual) and resuming the schedule; outdoor temperature; filter life; airflow, blower speed, and static pressure; heating/cooling activity; equipment lockout alerts; daily energy use; online/offline status.
- **Limitations:** It depends on Carrier's cloud, which has had outages in the past. Carrier rate-limits commands, so they're sent one at a time. A changed setting can briefly "bounce back" for up to ~5 minutes. Energy data isn't real time.
- **Risk to your equipment:** **None.** It reads and writes the same settings the app does, and removing it leaves no trace.

**Infinitude in detail**
- It's a small program on your network that the thermostat is told to use as its "proxy", which means a **settings change on the thermostat**. Infinitude then sees everything the thermostat sends to Carrier and can control it locally.
- **Risks:** The thermostat depends on Infinitude staying up. Users have reported the thermostat reverting the proxy setting. There's no confirmation for firmware 4.31 on your exact model.
- **Verdict:** Keep it only as a fallback if `ha_carrier` proves unreliable, and only with your explicit approval.

**What I need:** The name of the app you sign into (a screenshot of its home screen). `ha_carrier` needs the **Carrier Infinity / Carrier Home** account. If "Carrier SmartHome" is a different app, its account may not work.

### D. Hayward OmniLogic (pool + spa): detailed assessment

| Category | Option | Status |
|---|---|---|
| **Manufacturer-official** | Hayward's own OmniLogic app and cloud (plus Hayward's voice-assistant skills). Hayward publishes no Home Assistant integration and no official local API. | ❌ None for Home Assistant |
| **Home Assistant built-in** | **"Hayward OmniLogic"** (cloud polling, community-maintained, ~257 installs) | ⚠️ Works, but limited |
| **Community, local** | **`haomnilogic-local`** (HACS custom repository) and the `python-omnilogic-local` library behind it | ✅ **Best candidate** |

**Home Assistant built-in (cloud)**
- **Provides:** Sensors for air and water temperature, variable pump speed, chlorinator setting, salt, pH, and ORP. Switches for relays, pumps (single, dual, and variable speed), and relay-based lights.
- **Missing:** Heater control and ColorLogic light control (colors and shows). The docs say these are planned for the future.
- **Known problem (2026):** When Hayward rejects its login token, it stops updating and stays stuck until it's reloaded by hand (core issue #184314).

**`haomnilogic-local` (community, local)**
- **How it works:** It talks to the controller directly over your home network using the controller's built-in local protocol, the same one the app uses on your Wi-Fi. No cloud is needed, and updates are as fast as every 5 seconds.
- **Supported controllers:** "OmniLogic/OmniHub".
- **Pool and spa as separate devices:** ✅ That's exactly what the dashboard needs.
- **Supported controls:**

| Equipment | Support |
|---|---|
| Variable-speed pumps / filter | ✅ On/off, low/med/high presets, custom % |
| Single-speed pumps | ✅ On/off |
| **Dual-speed pumps** | ❌ Not supported |
| Heaters (gas, heat pump, solar, hybrid) | ✅ On/off, current and target temperature. Some advanced heater configurations are only partly supported. |
| ColorLogic lights (2.5, 4.0, UCL, SAM) | ✅ On/off, brightness, light shows |
| Relays / valve actuators (e.g. spillover, water features) | ✅ On/off |
| Chlorinator | ✅ Timed percent, enable/disable. ❌ ORP-controlled mode not supported. |
| Sensors | ✅ Temperature, flow, pump power, service mode (library also reads pH, ORP, salt) |
| Schedules | ⚠️ Read/limited. You can't create or edit schedules or light themes. Keep using the Hayward app for those. |

- **Requirements:** The controller needs a **fixed IP address**. That's set as a reservation in the eero app, without touching the pool equipment, and only with your approval. One controller per Home Assistant.
- **Maturity:** The author calls it "not complete". It has an active issue tracker, and several community forks exist. One user reported a data-parsing problem on controller firmware R0502000 with an older library version. **The firmware version matters, so we'll check yours before relying on it.**
- **Risk to your equipment:** Low. It doesn't change controller configuration, schedules, or pairings, and removing it leaves no trace.

**Pool-control safety:** Even with a working integration, the dashboard will put **heater, pump, and spa-mode changes behind a confirmation**. It will never show a control that the controller doesn't report.

**What I need:** The controller model (OmniLogic or OmniHub, from the label inside the panel door or the app's Settings → System), the **firmware/MSP version**, how it connects (Ethernet or Wi-Fi), and a screenshot of the equipment list. In particular, tell me if any pump is **dual-speed**.

### E. Maytronics Dolphin Nautilus: deferred

_Unchanged._ This would use the community `dolphin-robot` integration (cloud, MyDolphin Plus "Always Connected" models only). Its compatibility with your Nautilus model is unconfirmed. Waiting on the model number.

### F. Hosting: running on this Mac first vs. buying dedicated hardware

**Price correction:** Home Assistant Green's recommended retail price is **$199 USD** (raised in January 2026 due to component costs). Some resellers charge more.

| | **Temporary: Home Assistant in a virtual machine on this MacBook Pro** | **Home Assistant Green ($199)** | Mini PC / Raspberry Pi 5 |
|---|---|---|---|
| Cost | $0 (free UTM virtual-machine app) | $199 | ~$120–200 + setup |
| Setup | ~30 min | ~15 min, plug in | 30–60 min |
| Always on? | ❌ **No.** It stops whenever the laptop sleeps, closes, or leaves home. | ✅ Yes, ~3 W | ✅ Yes |
| Good for | **Trying cloud integrations (Ring, Carrier) and live-testing the dashboard** | Daily use | Daily use, more power |
| Zigbee/Z-Wave adapter | ⚠️ Possible but fiddly (USB pass-through to the virtual machine), and lights stop responding when the laptop sleeps | ✅ Plug in | ✅ Plug in |
| Pool controller (local) | ✅ Works with bridged networking, but only while the Mac is home and awake | ✅ | ✅ |
| Moving later | ✅ A full Home Assistant backup restores onto a Green; nothing is lost | — | — |

**Recommendation:**
1. **Now:** Nothing. The prototype runs on sample data and needs no Home Assistant at all.
2. **After you approve the design:** Optionally run Home Assistant **temporarily on this Mac** to test the real integrations at no cost. That's a software install, so I'll ask first.
3. **For daily use or a wall tablet:** Buy dedicated hardware, since a laptop can't be the house's always-on brain. Moving from the Mac is a backup-and-restore.

---

## 3. Architecture (revised): no separate backend in version 1

### 3.1 Is the backend service necessary for v1? No.

Home Assistant already has a secure, built-in way for web apps to connect. The dashboard sends you to **Home Assistant's own login page**, and Home Assistant gives the browser a **short-lived access token (about 30 minutes)**, renewed automatically. The official Home Assistant web interface works exactly this way.

| Security requirement | How v1 meets it without a backend |
|---|---|
| No tokens in source code | ✅ No token is ever in the code or the built files. Each browser gets its own token only after signing in. |
| Never commit credentials | ✅ There are no credentials to commit. Only the Home Assistant address is configured, and that isn't secret. |
| Per-person / per-device access | ✅ Each person or wall tablet signs in with its own Home Assistant user, and access can be revoked individually from Home Assistant. |
| Not exposed to the internet | ✅ Everything stays on your home network. |
| Validate commands | ⚠️ **In the app, not enforced by a server.** The dashboard checks ranges and asks for confirmation, but Home Assistant can't limit a signed-in user to specific devices. |
| Handle disconnects | ✅ The official connection library reconnects automatically, and the dashboard shows live/stale status. |

#### 3.1a Token lifecycle: access token, refresh token, storage, revocation

Signing in to Home Assistant gives the browser **two** tokens (verified against Home Assistant's source code, `homeassistant/auth`):

| Token | Lifetime | Purpose |
|---|---|---|
| **Access token** | **30 minutes** | Sent with every request. When it expires, the dashboard silently gets a new one. |
| **Refresh token** | **90 days, extended each time it's used.** A device that's used regularly stays signed in; one left unused for 90 days is signed out automatically. | Used only to get new access tokens. **This is the sensitive one**, because it's what keeps a device signed in. |

We won't use Home Assistant's "long-lived access tokens", which last 10 years and are meant for scripts, not browsers.

**Where they're stored.** The official connection library lets the app decide where tokens are saved. The plan:
- **Personal devices (phone, laptop):** "Session" storage by default. Tokens are erased when the browser tab is closed, and you'll sign in again next time.
- **"Keep this device signed in"** (opt-in, intended for the wall tablet): tokens are kept in the browser's local storage for that dashboard's address only. No other website can read them.
- Tokens are never in the source code or the built files, never written to logs, and never put in a web address.

**How they're protected.**
- **The main risk is malicious script running inside the dashboard page**, which could read a stored token. To prevent that:
  - The dashboard loads **no third-party scripts, fonts, or analytics**. Everything, including the Inter font, is bundled and served from your own network.
  - A strict **Content-Security-Policy** allows only the dashboard's own code and the connection to Home Assistant.
  - Every displayed value is treated as text, never as code.
- **Home network only:** neither the dashboard nor Home Assistant is reachable from the internet.
- **One Home Assistant user per person or tablet:** use non-administrator users for everyone except you, and a dedicated user for the wall tablet.

**How they're revoked.**
- **Sign out** in the dashboard's Settings calls Home Assistant's `/auth/revoke`. That deletes the refresh token on the Home Assistant side, and clears it from the browser.
- **From Home Assistant**, under *Profile → Security → Refresh tokens*, every signed-in device is listed by name, and you can delete any one of them, for example a lost tablet. Its access ends within 30 minutes at most, when its current access token expires.
- **Deactivating or deleting a Home Assistant user** ends all of that user's access.
- **Automatic:** any refresh token unused for 90 days expires on its own.

**The honest trade-off:** Without a backend, **anyone who can sign in to Home Assistant can control every device**, whether they use the dashboard or not. That's equally true of Home Assistant's own app. For a household where every user is trusted, that's acceptable.

**Add the backend later if any of these become true:**
- A shared or guest tablet should only control *some* things (for example, lights but not the pool heater).
- You want remote access beyond a private VPN.
- You want our own event history or notification logic beyond what Home Assistant keeps.
- Ring camera streaming needs a server-side relay.

**Built so that's easy:** All the screens read from one **data-source layer** with three versions:
1. **Sample data** for the prototype, clearly labeled.
2. **Direct Home Assistant connection** for v1.
3. **Gateway**, a possible future version.

Switching between them doesn't change any screen.

### 3.2 How the pieces communicate (v1)

```
 Lights ─ SmartThings Hub ─ Samsung cloud ─┐     (or a Zigbee/Z-Wave adapter, if migrated)
 Ring doorbell / Chime ─── Ring cloud ─────┤
 Carrier thermostat ────── Carrier cloud ──┼──►  HOME ASSISTANT   (home network only)
 OmniLogic controller ──── local network ──┤       integrations · device states · history · users
 Dolphin cleaner ───────── Maytronics cloud┘
                                                     │  WebSocket (live updates)
                                                     │  sign-in with Home Assistant users, short-lived tokens
                                                     ▼
                                           ZWIERS HOME DASHBOARD  (React + TypeScript, static files)
                                             data-source layer → screens
                                             served from Home Assistant itself or any device at home
```

### 3.3 Configuration-driven

- Rooms come from Home Assistant **Areas**, and sections come from Home Assistant **Labels** (`pool`, `spa`, `security`…).
- One validated `home.config` file holds display names, ordering, what appears on the Overview, safe ranges, and which actions need confirmation.
- Controls are generated from what each device **reports it supports**. Nothing is tied to a hard-coded device ID.

### 3.4 Technology choices

| Layer | Choice | Why |
|---|---|---|
| Language | **TypeScript** | Catches whole classes of bugs before they reach the screen. |
| Framework | **React + Vite** | Industry standard, fast, well supported. |
| Styling | **Tailwind CSS v4 driven by our own design tokens** | Every color and spacing value comes from one token file. |
| UI primitives | **Radix UI** (unstyled) | Accessible sliders and dialogs with no imposed look. |
| Home Assistant connection | **home-assistant-js-websocket** (official) | Login, live updates, and reconnects, the same library Home Assistant's own UI uses. |
| State | **Zustand** | Small and simple; handles "pending" states for instant feedback. |
| Config validation | **Zod** | A bad config shows a clear error instead of a broken screen. |
| Hosting (later) | Static files served by Home Assistant (`/local` or a sidebar panel) | Nothing extra to run. |

---

## 4. Visual direction

_Unchanged from revision 1._ The concept is an **architectural status board**: hairline rules instead of cards, typography doing the work, and a charcoal / warm-white palette with a single muted-brass accent. Brick red appears only for real problems. The typeface is Inter with tabular figures, on a 4 px spacing grid with 2–4 px corner radius. The overview leads with a one-sentence status line, then the four key numbers (Indoor, Pool, Spa, Outside), then summaries, then exceptions. Every value shows its freshness, and **Unavailable** always looks different from **Off**. Sample data carries a visible "SAMPLE DATA" tag.

---

## 5. Implementation roadmap (revised: prototype first)

| # | Milestone | Done when | Needs hardware or subscription? |
|---|---|---|---|
| **M1** | **Design system + interactive prototype** | Tokens, components, all 7 screens, responsive phone/tablet/desktop/wall layouts, running on clearly labeled sample data. You review it in the browser. | **No** |
| **M2** | **Data-source layer + Home Assistant connection** | The direct Home Assistant source is built and tested; connection status and stale-data handling work | No (tested against sample data first) |
| **M3** | **Home Assistant trial on this Mac** _(optional, with your approval)_ | Home Assistant runs in a virtual machine; the prototype switches to live data for cloud integrations | No purchase |
| **M4** | **Hardware + lighting decision** | You choose: Green or another box, and SmartThings plan vs. migration | **Yes**, your decision |
| **M5** | **Integrations, one at a time** | Lighting → Carrier → OmniLogic → Ring, each verified against the real device | Depends on M4 |
| **M6** | **Full live dashboard** | Every control has pending/success/failure feedback; alerts and the Devices troubleshooting view work | — |
| **M7** | **Refine + deploy** | Wall-tablet mode, accessibility, performance, served on the home network | Tablet, if wanted |
| M8 | Dolphin (optional) | After the model is confirmed | — |

---

## 6. What I need from you

**Not needed to start the prototype.** These can arrive whenever convenient:
1. **SmartThings device list** (screenshot). This decides Zigbee vs. Z-Wave vs. "no adapter needed".
2. **Carrier app name** (screenshot of its home screen).
3. **OmniLogic:** Controller model, firmware/MSP version, connection type, and equipment list (especially any dual-speed pumps).
4. **Ring Protect:** Do you have it, and which plan?
5. **Users:** Who will use the dashboard, and will there be a wall tablet?
6. _(Later)_ Dolphin model number.

---

## 7. Sources

- **SmartThings fee:** [SmartThings announcement](https://community.smartthings.com/t/a-new-enhanced-smartthings-api-experience/309947), [Changes to the HA integration](https://community.smartthings.com/t/changes-to-the-smartthings-integration-for-home-assistant-what-s-happening-and-what-you-need-to-do/311942), [Digital Citizen](https://www.digitalcitizen.life/smartthings-home-assistant-integration-paid-developer-plan-december-15/), [Local Smart Home Guide](https://localsmarthomeguide.com/articles/smartthings-api-developer-plan-home-assistant-integration-paywall/)
- **Fee scope (API only, not the app):** [SmartThings blog: A New Enhanced SmartThings API Experience](https://blog.smartthings.com/smartthings-updates/a-new-enhanced-smartthings-api-experience/), [Android Authority](https://androidauthority.com/smarthings-api-paid-tiers-3681929), [Gadget Hacks: who the fees affect](https://samsung.gadgethacks.com/news/samsung-smartthings-api-pricing-new-fees-and-who-they-affect/)
- **Home Assistant auth tokens:** Home Assistant core source [`auth/const.py`](https://github.com/home-assistant/core/blob/dev/homeassistant/auth/const.py) (30-minute access, 90-day refresh), [`auth/auth_store.py`](https://github.com/home-assistant/core/blob/dev/homeassistant/auth/auth_store.py) (expiry extended on use), [home-assistant-js-websocket `auth.ts`](https://github.com/home-assistant/home-assistant-js-websocket/blob/master/lib/auth.ts) (saveTokens/loadTokens, `/auth/revoke`)
- **Thread:** read from local `_meshcop._udp` announcements on your network, 25 Nov 2026
- **Migration:** [HA Community: migrating Z-Wave/Zigbee from SmartThings](https://community.home-assistant.io/t/migration-of-zwave-zigbee-from-smartthings/516536), [Local Smart Home Guide: moving before Dec 15](https://localsmarthomeguide.com/articles/move-from-smartthings-to-home-assistant/), [Leios migration guide](https://www.leios.consulting/guides/smartthings-migration-home-assistant/), [Migration experience write-up (2026)](https://mustafa.net/2026/07/05/migrating-from-smartthings-to-home-assistant-what-i-lost-and-gained/)
- **Adapters:** [Connect ZBT-2](https://www.home-assistant.io/connect/zbt-2), [ZBT-2 launch post](https://www.home-assistant.io/blog/2025/11/19/home-assistant-connect-zbt-2), [Android Authority: ZBT-2 $49](https://www.androidauthority.com/home-assistant-connect-zbt-2-3617640), [CNX: ZWA-2](https://www.cnx-software.com/2025/08/14/home-assistant-connect-zwa-2-z-wave-usb-adapter/), [Hackster: ZWA-2 $69](https://www.hackster.io/news/home-assistant-goes-z-wave-happy-with-the-connect-zwa-2-boasts-standard-and-long-range-support-8e2ef7601a2b)
- **Home Assistant Green price:** [Nabu Casa pricing change (Jan 2026)](https://www.nabucasa.com/news/2026-01-08-green-pricing-change/), [Matter Alpha](https://www.matteralpha.com/news/home-assistant-green-price-hiked-here-s-why), [home-assistant.io/green](https://home-assistant.io/green)
- **Ring:** [HA Ring integration](https://home-assistant.io/integrations/ring), [ring-mqtt](https://github.com/tsightler/ring-mqtt/wiki)
- **Carrier:** [dahlb/ha_carrier](https://github.com/dahlb/ha_carrier), [Infinitude wiki: Infinity Touch](https://github.com/nebulous/infinitude/wiki/Infinity-touch), [Infinitude HA component thread](https://community.home-assistant.io/t/custom-component-carrier-infinity-touch-control-via-infinitude/104633?page=9), [HA community: SYSTXCCITC01-B](https://community.home-assistant.io/t/carrier-infinity-systxccitc01-b-integration/99853), [Carrier Series B 4.31 release notes](https://cpdcetraining.com/wp-content/uploads/2023/01/UI-4.31-Software.pdf)
- **Hayward:** [HA built-in OmniLogic docs](https://www.home-assistant.io/integrations/omnilogic/), [core token issue #184314](https://github.com/home-assistant/core/issues/184314), [cryptk/haomnilogic-local](https://github.com/cryptk/haomnilogic-local), [cryptk/python-omnilogic-local](https://github.com/cryptk/python-omnilogic-local), [HA community announcement](https://community.home-assistant.io/t/hayward-pools-local-integration-announcement/584634), [firmware R0502000 thread](https://community.home-assistant.io/t/hayward-omnilogic/122522?page=9)
- **Dolphin:** [sh00t2kill/dolphin-robot](https://github.com/sh00t2kill/dolphin-robot)
