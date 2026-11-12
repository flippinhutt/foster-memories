/// <reference types="node" />
import { openNodeSqlite } from '@/test/nodeSqliteDatabase';
import { collectionFixture, mediaFixture, memoryFixture, milestoneFixture, petFixture } from '@/test/fixtures';
import { migrate } from '../migrations';
import { createSqliteBackupRepository } from '../repositories/backupRepository';
import { createSqliteCollectionRepository } from '../repositories/collectionRepository';
import { createSqliteMediaRepository } from '../repositories/mediaRepository';
import { createSqliteMemoryRepository } from '../repositories/memoryRepository';
import { createSqliteMilestoneRepository } from '../repositories/milestoneRepository';
import { createSqlitePetRepository } from '../repositories/petRepository';

async function setup() {
  const db = openNodeSqlite();
  await migrate(db);
  return {
    backup: createSqliteBackupRepository(db),
    pets: createSqlitePetRepository(db),
    memories: createSqliteMemoryRepository(db),
    media: createSqliteMediaRepository(db),
    milestones: createSqliteMilestoneRepository(db),
    collections: createSqliteCollectionRepository(db),
  };
}

async function filled() {
  const repos = await setup();
  await repos.pets.insert(petFixture());
  await repos.memories.insert(memoryFixture());
  await repos.media.insert(mediaFixture({ memoryId: 'memory-1' }));
  await repos.memories.setTags('memory-1', ['Cuddles']);
  await repos.milestones.insert(milestoneFixture({ memoryId: 'memory-1' }));
  await repos.collections.insert(collectionFixture());
  await repos.collections.addMemory('collection-1', 'memory-1');
  return repos;
}

describe('SQLite backup repository', () => {
  it('restores everything into an empty database', async () => {
    const source = await filled();
    const target = await setup();

    expect(await target.backup.restore(await source.backup.dump())).toEqual({ pets: 1, memories: 1 });
    expect(await target.backup.dump()).toEqual(await source.backup.dump());
  });

  it('keeps existing rows and adds only missing ones', async () => {
    const source = await filled();
    await source.pets.insert(petFixture({ id: 'pet-2', name: 'Milo' }));
    const target = await setup();
    const edited = petFixture({ name: 'Luna (renamed here)' });
    await target.pets.insert(edited);

    expect(await target.backup.restore(await source.backup.dump())).toEqual({ pets: 1, memories: 1 });
    expect((await target.pets.getById('pet-1'))?.name).toBe('Luna (renamed here)');
    expect((await target.pets.list()).map((pet) => pet.id).sort()).toEqual(['pet-1', 'pet-2']);

    expect(await target.backup.restore(await source.backup.dump())).toEqual({ pets: 0, memories: 0 });
  });

  it('links restored tags to a same-named tag that already exists', async () => {
    const source = await filled();
    const target = await setup();
    await target.pets.insert(petFixture());
    await target.memories.insert(memoryFixture({ id: 'memory-here' }));
    await target.memories.setTags('memory-here', ['cuddles']);

    await target.backup.restore(await source.backup.dump());
    expect(await target.memories.getTags('memory-1')).toEqual(['cuddles']);
    expect((await target.backup.dump()).tags).toHaveLength(1);
  });

  it('rolls back everything when a row is invalid', async () => {
    const source = await filled();
    const data = await source.backup.dump();
    data.memories.push({ ...data.memories[0], id: 'orphan', petId: 'no-such-pet' });
    const target = await setup();

    await expect(target.backup.restore(data)).rejects.toThrow();
    expect(await target.pets.list()).toEqual([]);
  });
});
