/// <reference types="node" />
import { openNodeSqlite } from '@/test/nodeSqliteDatabase';
import { mediaFixture, petFixture } from '@/test/fixtures';
import { migrate } from '@/src/db/migrations';
import { createSqliteMediaRepository } from '@/src/db/repositories/mediaRepository';
import { createSqlitePetRepository } from '@/src/db/repositories/petRepository';
import { sweepOrphanMedia } from '../mediaSweep';

async function setup() {
  const db = openNodeSqlite();
  await migrate(db);
  await createSqlitePetRepository(db).insert(petFixture());
  return createSqliteMediaRepository(db);
}

describe('sweepOrphanMedia', () => {
  it('deletes only stored files that no media row points at', async () => {
    const media = await setup();
    await media.insert(mediaFixture({ id: 'a', localUri: 'media/a.jpg', thumbnailUri: 'media/a-thumb.jpg' }));
    const remove = jest.fn();

    const removed = await sweepOrphanMedia(media, {
      list: async () => ['media/a.jpg', 'media/a-thumb.jpg', 'media/old.jpg', 'media/gone.mp4'],
      remove,
    });

    expect(removed).toEqual(['media/old.jpg', 'media/gone.mp4']);
    expect(remove.mock.calls.map(([path]) => path)).toEqual(['media/old.jpg', 'media/gone.mp4']);
  });

  it('deletes nothing when every file is in use', async () => {
    const media = await setup();
    await media.insert(mediaFixture({ id: 'a', localUri: 'media/a.jpg' }));
    const remove = jest.fn();

    expect(await sweepOrphanMedia(media, { list: async () => ['media/a.jpg'], remove })).toEqual([]);
    expect(remove).not.toHaveBeenCalled();
  });
});
