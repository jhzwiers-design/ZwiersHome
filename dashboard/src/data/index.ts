/**
 * Chooses the data source for this build.
 *
 * Milestone 1 ships only the sample source. Milestone 2 adds
 * HomeAssistantSource here, selected by configuration; screens don't change.
 */
import type { HomeConfig } from '@/config/schema';
import { SampleDataSource } from './sample/SampleDataSource';
import type { DataSource } from './source';

export function createDataSource(config: HomeConfig): DataSource {
  return new SampleDataSource(config.prototype.latencyMs);
}

export type { DataSource } from './source';
export * from './types';
export * from './commands';
