import type { Media } from '@/src/types/media';
import type { SqlDatabase } from '../types';

export interface MediaRepository {
  getById(id: string): Promise<Media | null>;
  insert(media: Media): Promise<void>;
  delete(id: string): Promise<void>;
  listPathsByPet(petId: string): Promise<string[]>;
  /** Every stored file path, photos and thumbnails. */
  listAllPaths(): Promise<string[]>;
  /** A memory's photos in the order they were added. */
  listByMemory(memoryId: string): Promise<Media[]>;
  /** A pet's photos not in any memory (cover included), in the order they were added. */
  listLooseByPet(petId: string): Promise<Media[]>;
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

    async listAllPaths() {
      const rows = await db.getAllAsync<{ path: string }>(
        'SELECT localUri AS path FROM media UNION SELECT thumbnailUri FROM media WHERE thumbnailUri IS NOT NULL',
        [],
      );
      return rows.map((row) => row.path);
    },

    listByMemory: (memoryId) =>
      db.getAllAsync<Media>('SELECT * FROM media WHERE memoryId = ? ORDER BY rowid', [memoryId]),

    listLooseByPet: (petId) =>
      db.getAllAsync<Media>('SELECT * FROM media WHERE petId = ? AND memoryId IS NULL ORDER BY rowid', [petId]),
  };
}

/** Non-persistent repository, used as a test double. */
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
    listAllPaths: async () =>
      [...media.values()].flatMap((item) => (item.thumbnailUri ? [item.localUri, item.thumbnailUri] : [item.localUri])),
    listByMemory: async (memoryId) => [...media.values()].filter((item) => item.memoryId === memoryId),
    listLooseByPet: async (petId) =>
      [...media.values()].filter((item) => item.petId === petId && item.memoryId === null),
  };
}
