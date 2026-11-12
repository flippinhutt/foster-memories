/// <reference types="node" />
import { openNodeSqlite } from '@/test/nodeSqliteDatabase';
import { collectionFixture, memoryFixture, petFixture } from '@/test/fixtures';
import { migrate } from '../migrations';
import {
  createInMemoryCollectionRepository,
  createSqliteCollectionRepository,
  type CollectionRepository,
} from '../repositories/collectionRepository';
import { createSqliteMemoryRepository } from '../repositories/memoryRepository';
import { createSqlitePetRepository } from '../repositories/petRepository';

async function sqliteSetup() {
  const db = openNodeSqlite();
  await migrate(db);
  await createSqlitePetRepository(db).insert(petFixture());
  const memories = createSqliteMemoryRepository(db);
  await memories.insert(memoryFixture({ id: 'a' }));
  await memories.insert(memoryFixture({ id: 'b' }));
  return { memories, collections: createSqliteCollectionRepository(db) };
}

const variants: [string, () => Promise<{ collections: CollectionRepository }>][] = [
  ['SQLite', sqliteSetup],
  ['in-memory', async () => ({ collections: createInMemoryCollectionRepository() })],
];

describe.each(variants)('%s collection repository', (_name, setup) => {
  it('creates, renames, lists in order, and deletes', async () => {
    const { collections } = await setup();
    const second = collectionFixture({ id: 'c2', name: 'Farewell', sortOrder: 1 });
    const first = collectionFixture({ id: 'c1', name: 'First week', sortOrder: 0 });
    await collections.insert(second);
    await collections.insert(first);
    expect(await collections.list()).toEqual([first, second]);

    const renamed = { ...first, name: 'First days', description: 'Settling in' };
    await collections.update(renamed);
    expect(await collections.list()).toEqual([renamed, second]);

    await collections.delete('c1');
    expect(await collections.list()).toEqual([second]);
  });

  it('adds memories in order, ignores duplicates, and removes them', async () => {
    const { collections } = await setup();
    await collections.insert(collectionFixture());

    await collections.addMemory('collection-1', 'b');
    await collections.addMemory('collection-1', 'a');
    await collections.addMemory('collection-1', 'b');
    expect(await collections.listLinks()).toEqual([
      { collectionId: 'collection-1', memoryId: 'b', sortOrder: 0 },
      { collectionId: 'collection-1', memoryId: 'a', sortOrder: 1 },
    ]);

    await collections.removeMemory('collection-1', 'b');
    expect(await collections.listLinks()).toEqual([{ collectionId: 'collection-1', memoryId: 'a', sortOrder: 1 }]);

    await collections.delete('collection-1');
    expect(await collections.listLinks()).toEqual([]);
  });
});

it('drops links but keeps the collection when a memory is deleted in SQLite', async () => {
  const { memories, collections } = await sqliteSetup();
  await collections.insert(collectionFixture());
  await collections.addMemory('collection-1', 'a');

  await memories.delete('a');

  expect(await collections.listLinks()).toEqual([]);
  expect(await collections.list()).toEqual([collectionFixture()]);
});
