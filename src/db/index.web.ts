import { createMemoryMediaRepository } from './repositories/mediaRepository';
import { createMemoryPetRepository } from './repositories/petRepository';
import type { Repositories } from './index';

export type { Repositories } from './index';

// shortcut: web keeps data in memory only; replace with IndexedDB/OPFS adapter in Phase 2.
const repositories: Repositories = {
  pets: createMemoryPetRepository(),
  media: createMemoryMediaRepository(),
  persistent: false,
};

export function getRepositories(): Promise<Repositories> {
  return Promise.resolve(repositories);
}
