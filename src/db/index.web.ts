import { createUnavailableBackupRepository } from './repositories/backupRepository';
import { createInMemoryCollectionRepository } from './repositories/collectionRepository';
import { createMemoryMediaRepository } from './repositories/mediaRepository';
import { createInMemoryMemoryRepository } from './repositories/memoryRepository';
import { createInMemoryMilestoneRepository } from './repositories/milestoneRepository';
import { createMemoryPetRepository } from './repositories/petRepository';
import type { Repositories } from './index';

export type { Repositories } from './index';

// shortcut: web keeps data in memory only; replace with IndexedDB/OPFS adapter in Phase 2.
const media = createMemoryMediaRepository();
const repositories: Repositories = {
  pets: createMemoryPetRepository(),
  media,
  memories: createInMemoryMemoryRepository(media),
  milestones: createInMemoryMilestoneRepository(),
  collections: createInMemoryCollectionRepository(),
  backup: createUnavailableBackupRepository(),
  persistent: false,
};

export function getRepositories(): Promise<Repositories> {
  return Promise.resolve(repositories);
}
