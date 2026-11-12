import { openNodeSqlite } from '@/test/nodeSqliteDatabase';
import { petFixture } from '@/test/fixtures';
import { MIGRATIONS, migrate } from '../migrations';

const latest = MIGRATIONS[MIGRATIONS.length - 1].version;

describe('migrate', () => {
  it('creates every core table and sets user_version', async () => {
    const db = openNodeSqlite();
    expect(await migrate(db)).toBe(latest);

    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
      [],
    );
    expect(tables.map((t) => t.name)).toEqual([
      'collection_memories',
      'collections',
      'media',
      'memories',
      'memory_tags',
      'milestones',
      'pets',
      'tags',
    ]);
    expect(await db.getFirstAsync('PRAGMA user_version', [])).toEqual({ user_version: latest });
  });

  it('is idempotent', async () => {
    const db = openNodeSqlite();
    await migrate(db);
    await expect(migrate(db)).resolves.toBe(latest);
  });

  it('cascades pet deletion to memories, media, and milestones', async () => {
    const db = openNodeSqlite();
    await migrate(db);
    const now = '2026-03-14T12:00:00.000Z';
    await db.runAsync(
      'INSERT INTO pets (id, name, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
      ['pet-1', 'Luna', 'active', now, now],
    );
    await db.runAsync(
      'INSERT INTO memories (id, petId, occurredAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
      ['mem-1', 'pet-1', now, now, now],
    );
    await db.runAsync(
      'INSERT INTO media (id, memoryId, petId, localUri, createdAt) VALUES (?, ?, ?, ?, ?)',
      ['media-1', 'mem-1', 'pet-1', 'file:///photo.jpg', now],
    );
    await db.runAsync(
      'INSERT INTO milestones (id, petId, memoryId, label, occurredAt, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      ['ms-1', 'pet-1', 'mem-1', 'First purr', now, now],
    );

    await db.runAsync('DELETE FROM pets WHERE id = ?', [petFixture().id]);

    for (const table of ['memories', 'media', 'milestones']) {
      expect(await db.getFirstAsync(`SELECT COUNT(*) AS n FROM ${table}`, [])).toEqual({ n: 0 });
    }
  });

  it('rolls back a failed migration so it can be retried', async () => {
    const db = openNodeSqlite();
    const execAsync = db.execAsync;
    db.execAsync = async (source) => {
      if (source.startsWith('BEGIN')) {
        await execAsync('BEGIN; CREATE TABLE pets (id TEXT);');
        throw new Error('disk full');
      }
      return execAsync(source);
    };
    await expect(migrate(db)).rejects.toThrow('disk full');

    db.execAsync = execAsync;
    await expect(migrate(db)).resolves.toBe(latest);
  });
});
