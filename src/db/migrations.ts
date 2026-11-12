import type { SqlDatabase } from './types';

interface Migration {
  version: number;
  sql: string;
}

// Append new migrations; never edit a shipped one.
export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS pets (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        species TEXT,
        breed TEXT,
        sex TEXT,
        approximateAge TEXT,
        arrivalDate TEXT,
        departureDate TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        backstory TEXT,
        personality TEXT,
        notes TEXT,
        coverPhotoId TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY NOT NULL,
        petId TEXT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
        occurredAt TEXT NOT NULL,
        title TEXT,
        body TEXT,
        location TEXT,
        mood TEXT,
        isFavorite INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_memories_pet ON memories(petId, occurredAt);

      CREATE TABLE IF NOT EXISTS media (
        id TEXT PRIMARY KEY NOT NULL,
        memoryId TEXT REFERENCES memories(id) ON DELETE CASCADE,
        petId TEXT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
        localUri TEXT NOT NULL,
        thumbnailUri TEXT,
        mimeType TEXT,
        width INTEGER,
        height INTEGER,
        durationSeconds REAL,
        caption TEXT,
        takenAt TEXT,
        createdAt TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_media_memory ON media(memoryId);
      CREATE INDEX IF NOT EXISTS idx_media_pet ON media(petId);

      CREATE TABLE IF NOT EXISTS milestones (
        id TEXT PRIMARY KEY NOT NULL,
        petId TEXT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
        memoryId TEXT REFERENCES memories(id) ON DELETE SET NULL,
        label TEXT NOT NULL,
        occurredAt TEXT NOT NULL,
        category TEXT,
        notes TEXT,
        createdAt TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_milestones_pet ON milestones(petId, occurredAt);

      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL UNIQUE COLLATE NOCASE,
        color TEXT
      );

      CREATE TABLE IF NOT EXISTS memory_tags (
        memoryId TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
        tagId TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (memoryId, tagId)
      );

      CREATE TABLE IF NOT EXISTS collections (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        sortOrder INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS collection_memories (
        collectionId TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
        memoryId TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
        sortOrder INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (collectionId, memoryId)
      );
    `,
  },
];

/** Runs pending migrations. Safe to call on every launch. */
export async function migrate(db: SqlDatabase): Promise<number> {
  await db.execAsync('PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version', []);
  let current = row?.user_version ?? 0;

  for (const migration of MIGRATIONS) {
    if (migration.version <= current) continue;
    try {
      await db.execAsync(
        `BEGIN;\n${migration.sql}\nPRAGMA user_version = ${migration.version};\nCOMMIT;`,
      );
    } catch (error) {
      await db.execAsync('ROLLBACK;').catch(() => undefined);
      throw error;
    }
    current = migration.version;
  }
  return current;
}
