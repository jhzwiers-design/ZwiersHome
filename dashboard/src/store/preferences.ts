/**
 * Per-device display preferences (theme, units, layout).
 * Stored in this browser only. Never contains credentials.
 */
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { OverviewModule } from '@/config/schema';

export type ThemePref = 'system' | 'dark' | 'light';
export type RouteId = 'overview' | 'lighting' | 'climate' | 'pool' | 'security' | 'devices' | 'settings';

export interface Preferences {
  theme: ThemePref;
  tempUnit: 'F' | 'C';
  clock: '12h' | '24h';
  density: 'comfortable' | 'compact';
  startPage: RouteId;
  hiddenModules: OverviewModule[];
  wall: {
    dimAtNight: boolean;
    dimFrom: string; // "HH:MM"
    dimUntil: string;
    showControls: boolean;
  };
  prototype: { simulateFailures: boolean };
}

interface PreferencesStore extends Preferences {
  set: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  setWall: (patch: Partial<Preferences['wall']>) => void;
  toggleModule: (m: OverviewModule) => void;
  reset: () => void;
}

const defaults: Preferences = {
  theme: 'dark',
  tempUnit: 'F',
  clock: '12h',
  density: 'comfortable',
  startPage: 'overview',
  hiddenModules: [],
  wall: { dimAtNight: true, dimFrom: '22:00', dimUntil: '06:30', showControls: true },
  prototype: { simulateFailures: false },
};

/** localStorage can throw (private mode, blocked storage) — never let that break the app. */
const safeStorage: StateStorage = {
  getItem: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* preferences simply won't persist */
    }
  },
  removeItem: (k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
};

export const usePreferences = create<PreferencesStore>()(
  persist(
    (set) => ({
      ...defaults,
      set: (key, value) => set({ [key]: value } as Partial<Preferences>),
      setWall: (patch) => set((s) => ({ wall: { ...s.wall, ...patch } })),
      toggleModule: (m) =>
        set((s) => ({
          hiddenModules: s.hiddenModules.includes(m) ? s.hiddenModules.filter((x) => x !== m) : [...s.hiddenModules, m],
        })),
      reset: () => set({ ...defaults, prototype: { simulateFailures: false } }),
    }),
    {
      name: 'zwiers-home.preferences.v1',
      storage: createJSONStorage(() => safeStorage),
      // Prototype failure simulation always starts off.
      partialize: ({ prototype: _p, set: _s, setWall: _w, toggleModule: _t, reset: _r, ...rest }) => rest,
    },
  ),
);
