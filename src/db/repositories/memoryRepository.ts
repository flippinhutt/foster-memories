import { randomUUID } from 'expo-crypto';
import type { Memory, MemorySummary } from '@/src/types/memory';
import type { SqlDatabase } from '../types';
import type { MediaRepository } from './mediaRepository';

export interface MemoryRepository {
  /** All memories, newest first. */
  list(): Promise<MemorySummary[]>;
  getById(id: string): Promise<Memory | null>;
  insert(memory: Memory): Promise<void>;
  update(memory: Memory): Promise<void>;
  /** Also deletes its media rows, tag links, and collection links (ON DELETE CASCADE). */
  delete(id: string): Promise<void>;
  getTags(memoryId: string): Promise<string[]>;
  /** Replaces the memory's tags, reusing existing tags by name (case-insensitive). */
  setTags(memoryId: string, names: string[]): Promise<void>;
  /** Every memory's tag names, for search and filters. */
  listTagLinks(): Promise<{ memoryId: string; name: string }[]>;
}

const COLUMNS = [
  'id',
  'petId',
  'occurredAt',
  'title',
  'body',
  'location',
  'mood',
  'isFavorite',
  'createdAt',
  'updatedAt',
] as const satisfies readonly (keyof Memory)[];

// SQLite has no boolean; isFavorite is stored as 0/1.
type Row<T extends Memory> = Omit<T, 'isFavorite'> & { isFavorite: number };
const fromRow = <T extends Memory>(row: Row<T>): T => ({ ...row, isFavorite: row.isFavorite === 1 }) as T;
const toRow = (memory: Memory): Row<Memory> => ({ ...memory, isFavorite: Number(memory.isFavorite) });

const ORDER = 'ORDER BY m.occurredAt DESC, m.createdAt DESC';

export function createSqliteMemoryRepository(db: SqlDatabase): MemoryRepository {
  return {
    async list() {
      const rows = await db.getAllAsync<Row<MemorySummary>>(
        `SELECT m.*,
          (SELECT localUri FROM media WHERE memoryId = m.id ORDER BY rowid LIMIT 1) AS photoPath,
          (SELECT COUNT(*) FROM media WHERE memoryId = m.id) AS photoCount
        FROM memories m ${ORDER}`,
        [],
      );
      return rows.map(fromRow);
    },

    async getById(id) {
      const row = await db.getFirstAsync<Row<Memory>>('SELECT * FROM memories WHERE id = ?', [id]);
      return row ? fromRow(row) : null;
    },

    async insert(memory) {
      const row = toRow(memory);
      await db.runAsync(
        `INSERT INTO memories (${COLUMNS.join(', ')}) VALUES (${COLUMNS.map(() => '?').join(', ')})`,
        COLUMNS.map((column) => row[column]),
      );
    },

    async update(memory) {
      const editable = COLUMNS.filter((column) => column !== 'id' && column !== 'createdAt');
      const row = toRow(memory);
      await db.runAsync(
        `UPDATE memories SET ${editable.map((column) => `${column} = ?`).join(', ')} WHERE id = ?`,
        [...editable.map((column) => row[column]), memory.id],
      );
    },

    async delete(id) {
      await db.runAsync('DELETE FROM memories WHERE id = ?', [id]);
    },

    async getTags(memoryId) {
      const rows = await db.getAllAsync<{ name: string }>(
        `SELECT t.name FROM tags t JOIN memory_tags mt ON mt.tagId = t.id
        WHERE mt.memoryId = ? ORDER BY t.name COLLATE NOCASE`,
        [memoryId],
      );
      return rows.map((row) => row.name);
    },

    async setTags(memoryId, names) {
      await db.runAsync('DELETE FROM memory_tags WHERE memoryId = ?', [memoryId]);
      for (const name of names) {
        await db.runAsync('INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)', [randomUUID(), name]);
        await db.runAsync(
          'INSERT OR IGNORE INTO memory_tags (memoryId, tagId) SELECT ?, id FROM tags WHERE name = ?',
          [memoryId, name],
        );
      }
    },

    listTagLinks: () =>
      db.getAllAsync<{ memoryId: string; name: string }>(
        'SELECT mt.memoryId, t.name FROM memory_tags mt JOIN tags t ON t.id = mt.tagId ORDER BY t.name COLLATE NOCASE',
        [],
      ),
  };
}

/** Non-persistent repository: web stub until Phase 2. */
export function createInMemoryMemoryRepository(media: MediaRepository): MemoryRepository {
  const memories = new Map<string, Memory>();
  const tagsByMemory = new Map<string, string[]>();
  // Tag names keep the casing they were first created with, like the SQLite UNIQUE NOCASE column.
  const tagNames = new Map<string, string>();
  const byOrder = (a: Memory, b: Memory) =>
    b.occurredAt.localeCompare(a.occurredAt) || b.createdAt.localeCompare(a.createdAt);

  return {
    async list() {
      return Promise.all(
        [...memories.values()].sort(byOrder).map(async (memory) => {
          const photos = await media.listByMemory(memory.id);
          return { ...memory, photoPath: photos[0]?.localUri ?? null, photoCount: photos.length };
        }),
      );
    },
    getById: async (id) => memories.get(id) ?? null,
    insert: async (memory) => {
      memories.set(memory.id, memory);
    },
    update: async (memory) => {
      memories.set(memory.id, memory);
    },
    delete: async (id) => {
      memories.delete(id);
      tagsByMemory.delete(id);
    },
    getTags: async (memoryId) =>
      [...(tagsByMemory.get(memoryId) ?? [])].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })),
    setTags: async (memoryId, names) => {
      const resolved = names.map((name) => {
        const key = name.toLowerCase();
        if (!tagNames.has(key)) tagNames.set(key, name);
        return tagNames.get(key) ?? name;
      });
      tagsByMemory.set(memoryId, [...new Set(resolved)]);
    },
    listTagLinks: async () =>
      [...tagsByMemory].flatMap(([memoryId, names]) => names.map((name) => ({ memoryId, name }))),
  };
}
