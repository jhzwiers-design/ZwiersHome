# Home Assistant data source (Milestone 2, not yet implemented)

This folder will contain `HomeAssistantSource`, a second implementation of the
`DataSource` interface in `../source.ts`. **It isn't built yet.** Milestone 1 uses
sample data only and makes no network connections.

## Plan
- **Connection:** `home-assistant-js-websocket` (official), Home Assistant login
  flow with short-lived access tokens and a refresh token. Session storage by
  default; local storage only for devices marked "keep signed in". See
  discovery report §3.1a.
- **Discovery:** areas, devices and entities from the Home Assistant registries
  (`config/area_registry/list`, `config/device_registry/list`,
  `config/entity_registry/list`). Sections are chosen by Home Assistant labels
  and domains, never by hard-coded entity IDs.
- **Live state:** `subscribe_entities`, translated into `HomeSnapshot` by small
  per-domain mappers (`light`, `climate`, `water_heater`/`switch`/`sensor` for
  OmniLogic, `camera`/`event`/`binary_sensor` for Ring).
- **Commands:** each `Command` maps to one Home Assistant service call
  (`light.turn_on`, `climate.set_temperature`, …). They are validated by the
  shared `validateCommand()` before sending, exactly as in the prototype.
- **Availability:** a Home Assistant state of `unavailable` maps to `unavailable`;
  a device the integration reports as disconnected maps to `offline`.
