import { openDatabaseAsync } from 'expo-sqlite';
import { migrate } from './migrations';
import { createSqliteMediaRepository, type MediaRepository } from './repositories/mediaRepository';
import { createSqliteMemoryRepository, type MemoryRepository } from './repositories/memoryRepository';
import { createSqliteMilestoneRepository, type MilestoneRepository } from './repositories/milestoneRepository';
import { createSqlitePetRepository, type PetRepository } from './repositories/petRepository';

export interface Repositories {
  pets: PetRepository;
  media: MediaRepository;
  memories: MemoryRepository;
  milestones: MilestoneRepository;
  /** False when data lives only in memory (web stub). */
  persistent: boolean;
}

let opening: Promise<Repositories> | null = null;

async function open(): Promise<Repositories> {
  const db = await openDatabaseAsync('foster-memories.db');
  await migrate(db);
  return {
    pets: createSqlitePetRepository(db),
    media: createSqliteMediaRepository(db),
    memories: createSqliteMemoryRepository(db),
    milestones: createSqliteMilestoneRepository(db),
    persistent: true,
  };
}

/** Opens the database and runs migrations once; retries after a failure. */
export function getRepositories(): Promise<Repositories> {
  opening ??= open().catch((error: unknown) => {
    opening = null;
    throw error;
  });
  return opening;
}
