/**
 * Derived views of a HomeSnapshot. Pure functions — no device names or IDs
 * are hard-coded; everything is computed from whatever the data source reports.
 */
import type { Area, Availability, Device, HomeSnapshot, Light } from '@/data/types';

/** Display status used across the app. "off" = reachable but switched off. */
export type DisplayStatus = 'on' | 'off' | 'online' | 'offline' | 'unavailable';

export function deviceById(s: HomeSnapshot, id: string): Device | undefined {
  return s.devices.find((d) => d.id === id);
}

export function availabilityOf(s: HomeSnapshot, deviceId: string): Availability {
  return deviceById(s, deviceId)?.availability ?? 'unavailable';
}

export function lightStatus(s: HomeSnapshot, l: Light): DisplayStatus {
  const a = availabilityOf(s, l.deviceId);
  if (a !== 'online') return a;
  return l.on ? 'on' : 'off';
}

/** Is this data older than its expected update interval (or is the connection down)? */
export function isStale(lastUpdated: number | null, staleAfterSec: number, now: number, connected: boolean): boolean {
  if (!connected) return true;
  if (lastUpdated === null) return true;
  return now - lastUpdated > staleAfterSec * 1000;
}

export function sortAreas(areas: Area[], order: string[]): Area[] {
  return [...areas].sort((a, b) => {
    const ia = order.indexOf(a.id);
    const ib = order.indexOf(b.id);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    return a.name.localeCompare(b.name);
  });
}

export function lightsByArea(s: HomeSnapshot, order: string[]): { area: Area; lights: Light[] }[] {
  return sortAreas(s.areas, order)
    .map((area) => ({ area, lights: s.lights.filter((l) => l.areaId === area.id) }))
    .filter((g) => g.lights.length > 0);
}

export function lightingSummary(s: HomeSnapshot) {
  const total = s.lights.length;
  const on = s.lights.filter((l) => l.on && availabilityOf(s, l.deviceId) === 'online').length;
  const unreachable = s.lights.filter((l) => availabilityOf(s, l.deviceId) !== 'online').length;
  return { total, on, unreachable };
}

export interface Alert {
  id: string;
  severity: 'error' | 'notice';
  title: string;
  detail: string;
  since: number | null;
  route: string;
}

/** Things that need attention. Only real problems are 'error' (brick red). */
export function deriveAlerts(s: HomeSnapshot): Alert[] {
  const alerts: Alert[] = [];
  for (const d of s.devices) {
    if (d.availability === 'offline') {
      alerts.push({ id: `off-${d.id}`, severity: 'error', title: `${d.name} is offline`, detail: d.issue ?? 'Not responding', since: d.lastSeen, route: '#/devices' });
    }
  }
  for (const d of s.devices) {
    if (d.availability === 'unavailable' && s.integrations.find((i) => i.id === d.integration)?.status !== 'not_configured') {
      alerts.push({ id: `un-${d.id}`, severity: 'error', title: `${d.name} is unavailable`, detail: d.issue ?? 'No state reported', since: d.lastSeen, route: '#/devices' });
    }
  }
  for (const i of s.integrations) {
    if (i.status === 'disconnected') {
      alerts.push({ id: `int-${i.id}`, severity: 'error', title: `${i.name} disconnected`, detail: i.detail ?? 'Integration not reporting', since: i.lastUpdated, route: '#/devices' });
    }
  }
  for (const sys of s.climate) {
    if (sys.filterLifePct !== null && sys.filterLifePct <= 15) {
      alerts.push({ id: `filter-${sys.id}`, severity: 'notice', title: 'Replace HVAC filter', detail: `${sys.filterLifePct}% filter life left`, since: null, route: '#/climate' });
    }
  }
  if (s.pool?.serviceMode) {
    alerts.push({ id: 'pool-service', severity: 'notice', title: 'Pool controller in service mode', detail: 'Controls are locked at the panel', since: null, route: '#/pool' });
  }
  return alerts;
}

export function deviceCounts(s: HomeSnapshot) {
  const counts = { online: 0, offline: 0, unavailable: 0, off: 0 };
  for (const d of s.devices) {
    if (d.availability !== 'online') counts[d.availability] += 1;
    else if (isDeviceOff(s, d)) counts.off += 1;
    else counts.online += 1;
  }
  return counts;
}

/** A reachable device that is switched off (lights and pool equipment). */
export function isDeviceOff(s: HomeSnapshot, d: Device): boolean {
  if (d.availability !== 'online') return false;
  const light = s.lights.find((l) => l.deviceId === d.id);
  if (light) return !light.on;
  const eq = s.pool?.equipment.find((e) => e.deviceId === d.id);
  if (eq) return !eq.on;
  const heated = s.pool?.bodies.filter((b) => b.heater.deviceId === d.id) ?? [];
  if (heated.length) return heated.every((b) => !b.heater.enabled);
  return false;
}

export function deviceDisplayStatus(s: HomeSnapshot, d: Device): DisplayStatus {
  if (d.availability !== 'online') return d.availability;
  return isDeviceOff(s, d) ? 'off' : 'online';
}

/** One-sentence home status for the top of the Overview. */
export function statusSentence(s: HomeSnapshot): { tone: 'ok' | 'attention'; text: string; short: string } {
  const alerts = deriveAlerts(s).filter((a) => a.severity === 'error');
  if (s.connection.status !== 'connected') return { tone: 'attention', text: 'Not connected. Showing last known values.', short: 'Not connected' };
  if (alerts.length === 0) return { tone: 'ok', text: 'All systems normal', short: 'All systems normal' };
  const offline = s.devices.filter((d) => d.availability === 'offline').length;
  const unavailable = alerts.length - offline;
  const parts: string[] = [];
  if (offline) parts.push(`${offline} device${offline > 1 ? 's' : ''} offline`);
  if (unavailable > 0) parts.push(`${unavailable} unavailable`);
  return { tone: 'attention', text: `Home online · ${parts.join(', ')}`, short: `${alerts.length} need${alerts.length === 1 ? 's' : ''} attention` };
}

export interface ClimateArea {
  system: HomeSnapshot['climate'][number];
  zone: HomeSnapshot['climate'][number]['zones'][number];
  /** Plain-language area name, e.g. "Main Floor" or "East Wing". */
  label: string;
  /** Which thermostat controls it, e.g. "Main thermostat". */
  sublabel: string;
}

/**
 * The home's thermostat areas: the first zone of each thermostat. Extra zones
 * a thermostat reports are shown inside its area, never invented here.
 */
export function climateAreas(s: HomeSnapshot): ClimateArea[] {
  return s.climate
    .filter((sys) => sys.zones.length > 0)
    .map((sys) => {
      const zone = sys.zones[0]!;
      return { system: sys, zone, label: zone.name, sublabel: sys.name === zone.name ? 'Thermostat' : sys.name };
    });
}

/** Outside temperature from whichever thermostat reports one. */
export function outdoorTemp(s: HomeSnapshot): number | null {
  for (const sys of s.climate) if (sys.outdoorTemp !== null) return sys.outdoorTemp;
  return s.pool?.airTemp ?? null;
}
