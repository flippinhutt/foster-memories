/// <reference types="node" />
import { openNodeSqlite } from '@/test/nodeSqliteDatabase';
import { memoryFixture, milestoneFixture, petFixture } from '@/test/fixtures';
import { migrate } from '../migrations';
import { createSqliteMemoryRepository } from '../repositories/memoryRepository';
import {
  createInMemoryMilestoneRepository,
  createSqliteMilestoneRepository,
  type MilestoneRepository,
} from '../repositories/milestoneRepository';
import { createSqlitePetRepository } from '../repositories/petRepository';

async function sqliteSetup() {
  const db = openNodeSqlite();
  await migrate(db);
  await createSqlitePetRepository(db).insert(petFixture());
  return { db, milestones: createSqliteMilestoneRepository(db) };
}

const variants: [string, () => Promise<{ milestones: MilestoneRepository }>][] = [
  ['SQLite', sqliteSetup],
  ['in-memory', async () => ({ milestones: createInMemoryMilestoneRepository() })],
];

describe.each(variants)('%s milestone repository', (_name, setup) => {
  it('lists newest first and deletes', async () => {
    const { milestones } = await setup();
    const old = milestoneFixture({ id: 'old', occurredAt: '2026-03-15' });
    const recent = milestoneFixture({ id: 'new', occurredAt: '2026-03-20', notes: 'Loud one' });
    await milestones.insert(old);
    await milestones.insert(recent);

    expect(await milestones.list()).toEqual([recent, old]);

    await milestones.delete('new');
    expect(await milestones.list()).toEqual([old]);
  });
});

it('unlinks a milestone when its memory is deleted in SQLite', async () => {
  const { db, milestones } = await sqliteSetup();
  const memories = createSqliteMemoryRepository(db);
  await memories.insert(memoryFixture());
  await milestones.insert(milestoneFixture({ memoryId: 'memory-1' }));

  await memories.delete('memory-1');

  expect(await milestones.list()).toEqual([milestoneFixture({ memoryId: null })]);
});
