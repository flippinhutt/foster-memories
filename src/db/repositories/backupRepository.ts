import type { SqlDatabase, SqlValue } from '../types';

/** Every table and column, in insert order (parents before children). Also the whitelist for restore. */
export const BACKUP_TABLES = {
  pets: ['id', 'name', 'species', 'breed', 'sex', 'approximateAge', 'arrivalDate', 'departureDate', 'status', 'backstory', 'personality', 'notes', 'coverPhotoId', 'createdAt', 'updatedAt'],
  memories: ['id', 'petId', 'occurredAt', 'title', 'body', 'location', 'mood', 'isFavorite', 'createdAt', 'updatedAt'],
  media: ['id', 'memoryId', 'petId', 'localUri', 'thumbnailUri', 'mimeType', 'width', 'height', 'durationSeconds', 'caption', 'takenAt', 'createdAt'],
  milestones: ['id', 'petId', 'memoryId', 'label', 'occurredAt', 'category', 'notes', 'createdAt'],
  tags: ['id', 'name', 'color'],
  memory_tags: ['memoryId', 'tagId'],
  collections: ['id', 'name', 'description', 'sortOrder', 'createdAt'],
  collection_memories: ['collectionId', 'memoryId', 'sortOrder'],
} as const;

export type BackupTable = keyof typeof BACKUP_TABLES;
export type BackupRow = Record<string, SqlValue>;
export type BackupData = Record<BackupTable, BackupRow[]>;

export interface RestoreResult {
  pets: number;
  memories: number;
}

export interface BackupRepository {
  dump(): Promise<BackupData>;
  /** Adds rows that aren't here yet; existing rows are never changed or deleted. */
  restore(data: BackupData): Promise<RestoreResult>;
}

const TABLES = Object.keys(BACKUP_TABLES) as BackupTable[];

export function createSqliteBackupRepository(db: SqlDatabase): BackupRepository {
  const count = async (table: 'pets' | 'memories') =>
    (await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`, []))?.n ?? 0;

  return {
    async dump() {
      const data = {} as BackupData;
      for (const table of TABLES) {
        data[table] = await db.getAllAsync<BackupRow>(`SELECT ${BACKUP_TABLES[table].join(', ')} FROM ${table}`, []);
      }
      return data;
    },

    async restore(data) {
      const before = { pets: await count('pets'), memories: await count('memories') };
      // A tag name may already exist here under another id; links follow the id this device uses.
      const tagIds = new Map<SqlValue, SqlValue>();
      await db.execAsync('BEGIN;');
      try {
        for (const table of TABLES) {
          const columns = BACKUP_TABLES[table];
          const sql = `INSERT OR IGNORE INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`;
          for (const row of data[table]) {
            const values = columns.map((column) =>
              table === 'memory_tags' && column === 'tagId' ? (tagIds.get(row.tagId) ?? row.tagId) : (row[column] ?? null),
            );
            await db.runAsync(sql, values);
            if (table === 'tags') {
              const tag = await db.getFirstAsync<{ id: string }>('SELECT id FROM tags WHERE name = ? COLLATE NOCASE', [row.name ?? null]);
              if (tag) tagIds.set(row.id, tag.id);
            }
          }
        }
        await db.execAsync('COMMIT;');
      } catch (error) {
        await db.execAsync('ROLLBACK;').catch(() => undefined);
        throw error;
      }
      return { pets: (await count('pets')) - before.pets, memories: (await count('memories')) - before.memories };
    },
  };
}
