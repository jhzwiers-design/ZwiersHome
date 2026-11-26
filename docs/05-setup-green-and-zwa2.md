# Setting up Home Assistant Green + Connect ZWA-2

_Purchased 26 Nov 2026. Use this when the boxes arrive. Each part says who does it. Nothing here happens automatically._

**The short version:**
1. Plug the Green into the eero.
2. Create your account.
3. Plug the ZWA-2 into the Green.
4. Start a new Z-Wave network and back up its keys.
5. Move the two Honeywell Z-Wave controls over, one at a time.

Everything else keeps working in SmartThings until we choose to move it.

Sources:
- [Green product page](https://www.home-assistant.io/green)
- [ZWA-2 product page](https://www.home-assistant.io/connect/zwa-2/)

Nabu Casa's detailed support articles couldn't be fetched when this was written. Steps marked *(check on screen)* are the standard Home Assistant flow and may be worded slightly differently.

---

## What's in the boxes
| Home Assistant Green | Connect ZWA-2 |
|---|---|
| Green hub | Antenna and base (one unit) |
| Ethernet cable | 1.5 m USB cable (USB-A to USB-C) |
| 12 V power supply (US plug adapter included) | Quick-start guide |
| Quick-start guide | |

**You don't need to buy anything else.** The Green has a slot for an optional CR2032 coin battery, which keeps the clock running if the power goes out. It's not needed.

## Before you start (5 minutes)
- [ ] Pick a spot for the Green: indoors, dry, near an eero unit with a **free Ethernet port**. The Green connects by cable, and the product page says an internet connection is required for setup.
- [ ] Pick a spot for the ZWA-2 within its cable length of the Green (1.5 m).
  - It must stand **upright**, not lying on its side or mounted sideways. Its light blinks fast if the angle is wrong.
  - Keep it out of direct sun, away from heat, and not behind metal or inside a cabinet.
  - A central spot in the house is best, because the Master Bedroom and Living Room switches need to reach it.
- [ ] Have your password manager ready. You'll create the Home Assistant owner password yourself. Don't send it to me or put it in the project.
- [ ] Keep the SmartThings app installed. It keeps running everything until each device is moved.

## Step 1: The Green (you, about 15–30 min, mostly waiting)
1. Connect the Ethernet cable from the Green to the eero.
2. Plug in the power. It starts by itself.
3. On your phone or the Mac, install the **Home Assistant** app or open **http://homeassistant.local:8123** in a browser *(check on screen)*. It may take several minutes after the first power-on before this page loads.
4. Follow the onboarding:
   - **Create the owner account.** Use your own name and a strong password from your password manager.
   - **Set the home location.** This matters for Z-Wave: Home Assistant picks the Z-Wave radio region from your location. It has to be the US, or the US Honeywell switches won't be found.
   - **Units and time zone:** °F and your local time zone.
   - **Analytics:** your choice. Off is fine.
5. If it offers updates, install them and let it restart.
6. Home Assistant may list devices it found on the network, such as the Ring doorbell or the Samsung TV. **Ignore these for now.** We'll add integrations one at a time later.

**Done when:** you can sign in to Home Assistant and see the Overview page.

## Step 2: The ZWA-2 (you, 10 min)
1. Connect the ZWA-2 to one of the Green's two USB ports with the included cable, and stand it upright in the spot you picked.
2. Home Assistant should show **"New device discovered: Z-Wave"** under Settings → Devices & services. Click **Configure** or **Add**.
3. The wizard asks whether to **create a new network** or **migrate**. Choose **Create a new network**. Migrating only works from another Z-Wave USB stick, and your switches are on the SmartThings hub, not a stick.
4. If it offers a firmware update for the ZWA-2, accept it.
5. **Back up the Z-Wave network keys.** In the Z-Wave integration's settings there's an option to show or download the security keys *(check on screen)*. Save them in your password manager. Without these keys, a reinstall would mean re-pairing every Z-Wave device.

**Done when:** Settings → Devices & services shows **Z-Wave** with one device, the controller itself.

## Step 3: Move the two Honeywell Z-Wave controls (together, one at a time)
These are the only two devices confirmed as Z-Wave so far (from their SmartThings device info):

| Device | SmartThings name | Confirmed type |
|---|---|---|
| Living Room light | Living Room Light | Honeywell Z-Wave in-wall dimmer |
| Master Bedroom fan | Master Bedroom | Honeywell Z-Wave fan control |

A Z-Wave device can only belong to one controller. So for each device it has to be **removed (excluded) from SmartThings first, then added (included) to Home Assistant**. This changes real equipment, so **we do it together and only when you say go**. Start with the Living Room light. If anything goes wrong, it can be re-added to SmartThings the same way.

For each device:
1. **Note its routines.** In SmartThings, write down any routines or automations that use it. They stop working once it's removed.
2. **Exclude it.**
   - In SmartThings, open the device, then ⋮ → **Delete** *(check on screen)*. When asked, press the switch's paddle or button once to confirm.
   - If SmartThings can't reach it, use Home Assistant instead: Z-Wave → **Remove device**, then press the switch.
3. **Include it in Home Assistant.**
   - Go to Z-Wave → **Add device**.
   - Scan the switch's **QR code or type its 5-digit PIN (the S2 "DSK")**. It's on a sticker on the switch behind the wall plate, or on its box. Taking a photo of it before you start saves time.
   - Choose **S2 security** if asked.
   - Press the switch's paddle once.
4. **Name and place it.** Give it the dashboard's name (for example "Living Room Light") and assign it to the **Living Room** area. The dashboard finds devices by area, so this is what puts it in the right room.
5. **Test it** from Home Assistant, then rebuild any routines from step 1 in Home Assistant.

## Step 4: Everything else (later, one at a time, with your approval)
Each of these is a separate step. None of them is needed on day one.

- **The other SmartThings lights and the Upstairs Fan.** Their protocol is still unknown. Check each one's device info in SmartThings. Z-Wave ones move the same way as step 3. Until then, Home Assistant can control them through the SmartThings integration, which uses SmartThings' cloud.
- **Carrier thermostats:** the community `ha_carrier` integration (cloud).
- **Hayward OmniLogic:** the local or cloud integration (see the discovery report).
- **Ring:** the built-in integration.
- **The dashboard:** connecting it to Home Assistant is Milestone 2. It uses Home Assistant's own sign-in, so no password or token is stored in the dashboard's code.

## Things I will not do without asking you first
- Remove, exclude or re-pair any device.
- Change eero or other network settings.
- Change SmartThings routines, Carrier, Hayward or Ring settings.
- Install add-ons, or open Home Assistant to the internet.
