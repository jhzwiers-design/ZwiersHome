/**
 * DataSource — the boundary between screens and the outside world.
 *
 * Implementations:
 *   - SampleDataSource   (src/data/sample)         Milestone 1, in-memory only.
 *   - HomeAssistantSource (src/data/homeassistant) Milestone 2, live WebSocket.
 *   - GatewaySource       (future, optional)       if a backend is ever added.
 *
 * Screens never import an implementation directly; they use the store
 * (src/store/home.ts), which talks to whichever source createDataSource() returns.
 */
import type { Command } from './commands';
import type { HomeSnapshot } from './types';

export interface CommandResult {
  note?: string;
}

export interface DataSource {
  readonly kind: HomeSnapshot['source']['kind'];
  /** Start receiving state. Resolves when the first snapshot has been emitted. */
  connect(): Promise<void>;
  /** Called with a fresh, immutable snapshot every time anything changes. */
  subscribe(listener: (snapshot: HomeSnapshot) => void): () => void;
  /**
   * Execute a (pre-validated) command. Resolves once the system has
   * acknowledged it; rejects with CommandError on failure. `note` reports
   * partial results (e.g. a scene that skipped an offline light).
   */
  execute(cmd: Command): Promise<CommandResult>;
  disconnect(): void;
}

/** Hooks only the sample source implements — used by Settings → Prototype tools. */
export interface PrototypeControls {
  setSimulatedFailures(on: boolean): void;
  simulateConnectionLoss(seconds: number): void;
  simulateDoorbellPress(): void;
  reset(): void;
}

export function isPrototypeSource(s: DataSource): s is DataSource & PrototypeControls {
  return s.kind === 'sample';
}
