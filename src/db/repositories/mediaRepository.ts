import type { Media } from '@/src/types/media';
import type { SqlDatabase } from '../types';

export interface MediaRepository {
  getById(id: string): Promise<Media | null>;
  insert(media: Media): Promise<void>;
  delete(id: string): Promise<void>;
  listPathsByPet(petId: string): Promise<string[]>;
  /** A memory's photos in the order they were added. */
  listByMemory(memoryId: string): Promise<Media[]>;
}

const COLUMNS = [
  'id',
  'memoryId',
  'petId',
  'localUri',
  'thumbnailUri',
  'mimeType',
  'width',
  'height',
  'durationSeconds',
  'caption',
  'takenAt',
  'createdAt',
] as const satisfies readonly (keyof Media)[];

export function createSqliteMediaRepository(db: SqlDatabase): MediaRepository {
  return {
    getById: (id) => db.getFirstAsync<Media>('SELECT * FROM media WHERE id = ?', [id]),

    async insert(media) {
      await db.runAsync(
        `INSERT INTO media (${COLUMNS.join(', ')}) VALUES (${COLUMNS.map(() => '?').join(', ')})`,
        COLUMNS.map((column) => media[column]),
      );
    },

    async delete(id) {
      await db.runAsync('DELETE FROM media WHERE id = ?', [id]);
    },

    async listPathsByPet(petId) {
      const rows = await db.getAllAsync<{ localUri: string; thumbnailUri: string | null }>(
        'SELECT localUri, thumbnailUri FROM media WHERE petId = ?',
        [petId],
      );
      return rows.flatMap((row) => (row.thumbnailUri ? [row.localUri, row.thumbnailUri] : [row.localUri]));
    },

    listByMemory: (memoryId) =>
      db.getAllAsync<Media>('SELECT * FROM media WHERE memoryId = ? ORDER BY rowid', [memoryId]),
  };
}

/** Non-persistent repository: web stub until Phase 2. */
export function createMemoryMediaRepository(): MediaRepository {
  const media = new Map<string, Media>();
  return {
    getById: async (id) => media.get(id) ?? null,
    insert: async (item) => {
      media.set(item.id, item);
    },
    delete: async (id) => {
      media.delete(id);
    },
    listPathsByPet: async (petId) =>
      [...media.values()].filter((item) => item.petId === petId).map((item) => item.localUri),
    listByMemory: async (memoryId) => [...media.values()].filter((item) => item.memoryId === memoryId),
  };
}
