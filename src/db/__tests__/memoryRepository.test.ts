/// <reference types="node" />
import { openNodeSqlite } from '@/test/nodeSqliteDatabase';
import { mediaFixture, memoryFixture, petFixture } from '@/test/fixtures';
import { migrate } from '../migrations';
import {
  createMemoryMediaRepository,
  createSqliteMediaRepository,
  type MediaRepository,
} from '../repositories/mediaRepository';
import {
  createInMemoryMemoryRepository,
  createSqliteMemoryRepository,
  type MemoryRepository,
} from '../repositories/memoryRepository';
import { createSqlitePetRepository } from '../repositories/petRepository';

async function sqliteSetup() {
  const db = openNodeSqlite();
  await migrate(db);
  await createSqlitePetRepository(db).insert(petFixture());
  return { db, memories: createSqliteMemoryRepository(db), media: createSqliteMediaRepository(db) };
}

const variants: [string, () => Promise<{ memories: MemoryRepository; media: MediaRepository }>][] = [
  ['SQLite', sqliteSetup],
  [
    'in-memory',
    async () => {
      const media = createMemoryMediaRepository();
      return { memories: createInMemoryMemoryRepository(media), media };
    },
  ],
];

describe.each(variants)('%s memory repository', (_name, setup) => {
  it('inserts, reads, and updates a memory, keeping isFavorite a boolean', async () => {
    const { memories } = await setup();
    const memory = memoryFixture({ isFavorite: true });

    await memories.insert(memory);
    expect(await memories.getById(memory.id)).toEqual(memory);

    const edited = { ...memory, title: 'Zoomies', isFavorite: false, mood: 'funny' as const };
    await memories.update(edited);
    expect(await memories.getById(memory.id)).toEqual(edited);
    expect(await memories.getById('missing')).toBeNull();
  });

  it('lists newest first with the first photo and photo count', async () => {
    const { memories, media } = await setup();
    await memories.insert(memoryFixture({ id: 'old', occurredAt: '2026-03-15' }));
    await memories.insert(memoryFixture({ id: 'new', occurredAt: '2026-03-20' }));
    await media.insert(mediaFixture({ id: 'p1', memoryId: 'new', localUri: 'media/p1.jpg' }));
    await media.insert(mediaFixture({ id: 'p2', memoryId: 'new', localUri: 'media/p2.jpg' }));

    const list = await memories.list();

    expect(list.map((m) => m.id)).toEqual(['new', 'old']);
    expect(list[0]).toMatchObject({ photoPath: 'media/p1.jpg', photoCount: 2 });
    expect(list[1]).toMatchObject({ photoPath: null, photoCount: 0 });
    expect(await media.listByMemory('new')).toEqual([
      expect.objectContaining({ id: 'p1' }),
      expect.objectContaining({ id: 'p2' }),
    ]);
  });

  it('replaces tags and reuses existing tag names case-insensitively', async () => {
    const { memories } = await setup();
    await memories.insert(memoryFixture({ id: 'a' }));
    await memories.insert(memoryFixture({ id: 'b' }));

    await memories.setTags('a', ['First week', 'Silly']);
    await memories.setTags('b', ['silly']);
    expect(await memories.getTags('a')).toEqual(['First week', 'Silly']);
    expect(await memories.getTags('b')).toEqual(['Silly']);

    await memories.setTags('a', ['Vet']);
    expect(await memories.getTags('a')).toEqual(['Vet']);
    expect(await memories.listTagLinks()).toEqual(
      expect.arrayContaining([
        { memoryId: 'a', name: 'Vet' },
        { memoryId: 'b', name: 'Silly' },
      ]),
    );
    expect(await memories.listTagLinks()).toHaveLength(2);
  });

  it('deletes a memory and its tag links', async () => {
    const { memories } = await setup();
    await memories.insert(memoryFixture());
    await memories.setTags('memory-1', ['Silly']);

    await memories.delete('memory-1');

    expect(await memories.getById('memory-1')).toBeNull();
    expect(await memories.getTags('memory-1')).toEqual([]);
    expect(await memories.list()).toEqual([]);
  });
});

it('cascades memory deletion to media rows in SQLite', async () => {
  const { db, memories, media } = await sqliteSetup();
  await memories.insert(memoryFixture());
  await media.insert(mediaFixture({ memoryId: 'memory-1' }));

  await memories.delete('memory-1');

  expect(await db.getFirstAsync('SELECT COUNT(*) AS n FROM media', [])).toEqual({ n: 0 });
});
