/// <reference types="node" />
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openNodeSqlite } from '@/test/nodeSqliteDatabase';
import { petFixture } from '@/test/fixtures';
import { migrate } from '../migrations';
import { createMemoryPetRepository, createSqlitePetRepository } from '../repositories/petRepository';

describe('SQLite pet repository', () => {
  it('inserts, reads, and updates a pet', async () => {
    const db = openNodeSqlite();
    await migrate(db);
    const repo = createSqlitePetRepository(db);
    const pet = petFixture();

    await repo.insert(pet);
    expect(await repo.getById(pet.id)).toEqual(pet);

    const edited = { ...pet, name: 'Luna Belle', status: 'adopted' as const, departureDate: '2026-05-01' };
    await repo.update(edited);
    expect(await repo.getById(pet.id)).toEqual(edited);
    expect(await repo.getById('missing')).toBeNull();
  });

  it('lists active pets first, then newest arrival', async () => {
    const db = openNodeSqlite();
    await migrate(db);
    const repo = createSqlitePetRepository(db);
    await repo.insert(petFixture({ id: 'a', name: 'Old adopted', status: 'adopted', arrivalDate: '2026-06-01' }));
    await repo.insert(petFixture({ id: 'b', name: 'Older active', arrivalDate: '2026-01-01' }));
    await repo.insert(petFixture({ id: 'c', name: 'Newer active', arrivalDate: '2026-02-01' }));

    expect((await repo.list()).map((p) => p.id)).toEqual(['c', 'b', 'a']);
  });

  it('keeps pets after the database is closed and reopened', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'foster-memories-'));
    const path = join(dir, 'test.db');
    try {
      const first = openNodeSqlite(path);
      await migrate(first);
      await createSqlitePetRepository(first).insert(petFixture());
      first.close();

      const reopened = openNodeSqlite(path);
      await migrate(reopened);
      expect(await createSqlitePetRepository(reopened).list()).toEqual([petFixture()]);
      reopened.close();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('memory pet repository', () => {
  it('uses the same ordering as SQLite', async () => {
    const repo = createMemoryPetRepository([
      petFixture({ id: 'a', status: 'adopted', arrivalDate: '2026-06-01' }),
      petFixture({ id: 'b', arrivalDate: '2026-01-01' }),
      petFixture({ id: 'c', arrivalDate: '2026-02-01' }),
    ]);
    expect((await repo.list()).map((p) => p.id)).toEqual(['c', 'b', 'a']);
  });
});
