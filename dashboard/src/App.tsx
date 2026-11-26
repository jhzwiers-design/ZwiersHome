/**
 * App — routes to a screen and handles the global states every screen shares:
 * configuration errors, the initial connection (loading), and dialogs/toasts.
 */
import { useEffect } from 'react';
import { cancelConfirm, ConfirmHost } from '@/components/ConfirmDialog';
import { Toaster } from '@/components/Toaster';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Skeleton } from '@/components/primitives';
import { inTimeWindow, useApplyTheme, useIdle, useNow, useRoute, type Route } from '@/hooks';
import { usePreferences } from '@/store/preferences';
import { AppShell } from '@/layout/AppShell';
import { useHome } from '@/store/home';
import type { HomeSnapshot } from '@/data/types';
import { Overview } from '@/screens/Overview';
import { Lighting } from '@/screens/Lighting';
import { Climate } from '@/screens/Climate';
import { PoolSpa } from '@/screens/PoolSpa';
import { Security } from '@/screens/Security';
import { Devices } from '@/screens/Devices';
import { Settings } from '@/screens/Settings';
import { useWallCalm, Wall } from '@/screens/Wall';

const SCREENS: Record<Exclude<Route, 'wall'>, (p: { s: HomeSnapshot }) => React.ReactNode> = {
  overview: Overview,
  lighting: Lighting,
  climate: Climate,
  pool: PoolSpa,
  security: Security,
  devices: Devices,
  settings: Settings,
};

const TITLES: Record<Route, string> = {
  overview: 'Overview',
  lighting: 'Lighting',
  climate: 'Climate',
  pool: 'Pool & Spa',
  security: 'Security',
  devices: 'Devices',
  settings: 'Settings',
  wall: 'Wall display',
};

export function App() {
  const route = useRoute();
  const wallMode = usePreferences((p) => p.wallMode);
  const wallPrefs = usePreferences((p) => p.wall);
  const now = useNow(30_000);
  // Wall display at night: dark theme (then dimmed on the Home display).
  useApplyTheme(wallMode && wallPrefs.dimAtNight && inTimeWindow(now, wallPrefs.dimFrom, wallPrefs.dimUntil));
  const snapshot = useHome((s) => s.snapshot);
  const configError = useHome((s) => s.configError);
  const config = useHome((s) => s.config);
  const ready = !!config && snapshot && snapshot.connection.status !== 'connecting';
  const setPref = usePreferences((p) => p.set);
  const ambient = usePreferences((p) => p.wall.ambient);
  const idleMinutes = usePreferences((p) => p.wall.idleMinutes);
  const setCalm = useWallCalm((w) => w.setCalm);

  // Opening the Home display makes this device a wall display (until turned off).
  useEffect(() => {
    if (route === 'wall' && !wallMode) setPref('wallMode', true);
  }, [route, wallMode, setPref]);

  // Optional: return to the Home display after inactivity. Only navigates and
  // closes open questions — it never sends a command.
  useIdle(wallMode ? idleMinutes : 0, () => {
    cancelConfirm();
    if (location.hash !== '#/wall') location.hash = '#/wall';
  });
  // Calm presentation after 2 minutes untouched on the Home display.
  useIdle(wallMode && route === 'wall' && ambient === 'idle' ? 2 : 0, () => setCalm(true));

  useEffect(() => {
    document.title = `${TITLES[route]} · Zwiers Home`;
    window.scrollTo(0, 0);
    // Move focus to the new page for keyboard and screen-reader users.
    if (route !== 'wall') document.getElementById('main')?.focus({ preventScroll: true });
  }, [route]);

  if (configError) return <ConfigError message={configError} />;

  if (route === 'wall') {
    return (
      <>
        <ErrorBoundary resetKey={route}>{ready ? <Wall s={snapshot} /> : <LoadingScreen />}</ErrorBoundary>
        <ConfirmHost />
        <Toaster placement="top" />
      </>
    );
  }

  const Screen = SCREENS[route];
  return (
    <>
      <AppShell route={route} wall={wallMode}>
        {ready ? (
          <div key={route} className="animate-zh-page">
            <ErrorBoundary resetKey={route}>
              <Screen s={snapshot} />
            </ErrorBoundary>
          </div>
        ) : (
          <LoadingScreen />
        )}
      </AppShell>
      <ConfirmHost />
      <Toaster />
    </>
  );
}

/** Initial connection: skeleton in the shape of the page, plus a spoken status. */
function LoadingScreen() {
  return (
    <div aria-busy="true">
      <p role="status" className="sr-only">
        Connecting…
      </p>
      <Skeleton className="h-10 w-72" />
      <Skeleton className="mt-4 h-5 w-56" />
      <div className="mt-10 grid grid-cols-2 gap-8 border-t border-rule pt-6 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-4 h-14 w-28" />
            <Skeleton className="mt-3 h-4 w-32" />
          </div>
        ))}
      </div>
      <div className="mt-10 grid grid-cols-1 gap-12 border-t border-rule pt-6 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfigError({ message }: { message: string }) {
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <p className="caps text-danger">Configuration error</p>
      <h1 className="mt-3 text-h2 text-fg">home.config.ts has a problem</h1>
      <pre className="mt-6 overflow-auto rounded-sm border border-rule bg-surface p-4 text-label whitespace-pre-wrap text-fg-2">{message}</pre>
    </main>
  );
}
