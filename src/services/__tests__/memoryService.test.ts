/// <reference types="node" />
import { openNodeSqlite } from '@/test/nodeSqliteDatabase';
import { petFixture } from '@/test/fixtures';
import { migrate } from '@/src/db/migrations';
import { createSqliteMediaRepository } from '@/src/db/repositories/mediaRepository';
import { createSqliteMemoryRepository } from '@/src/db/repositories/memoryRepository';
import { createSqlitePetRepository } from '@/src/db/repositories/petRepository';
import { deleteMediaFile, importMediaFile } from '../mediaFiles';
import {
  createMemory,
  deleteMemory,
  emptyMemoryForm,
  memoryFormSchema,
  parseTags,
  toggleFavorite,
  toMemoryFormValues,
  updateMemory,
  type MemoryFormValues,
} from '../memoryService';
import type { PickedPhoto } from '../photoPicker';

jest.mock('../mediaFiles', () => ({
  importMediaFile: jest.fn(async (_uri: string, id: string) => `media/${id}.jpg`),
  deleteMediaFile: jest.fn(),
  mediaUri: (path: string) => path,
}));

const photo = (n: number): PickedPhoto => ({
  uri: `content://picker/${n}`,
  mimeType: 'image/jpeg',
  width: 800,
  height: 600,
});
const now = new Date('2026-04-01T10:00:00.000Z');
const form = (overrides: Partial<MemoryFormValues> = {}): MemoryFormValues => ({
  ...emptyMemoryForm,
  petId: 'pet-1',
  occurredAt: '03-20-2026',
  ...overrides,
});

async function setup() {
  const db = openNodeSqlite();
  await migrate(db);
  await createSqlitePetRepository(db).insert(petFixture());
  return { db, repos: { memories: createSqliteMemoryRepository(db), media: createSqliteMediaRepository(db) } };
}

beforeEach(() => jest.clearAllMocks());

describe('memoryFormSchema', () => {
  it('needs a photo or a note', () => {
    const result = memoryFormSchema.safeParse(form());
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({ message: 'Add a photo or a note.', path: ['body'] });

    expect(memoryFormSchema.safeParse(form({ body: 'Ate dinner' })).success).toBe(true);
    expect(memoryFormSchema.safeParse(form({ title: 'Dinner' })).success).toBe(true);
    expect(memoryFormSchema.safeParse(form({ photos: [{ kind: 'new', photo: photo(1) }] })).success).toBe(true);
  });

  it('needs a pet and a valid date', () => {
    const result = memoryFormSchema.safeParse(form({ petId: '', occurredAt: '2026-03-20', body: 'x' }));
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      'Choose a pet.',
      'Use a date like 03-14-2026.',
    ]);
  });
});

describe('parseTags', () => {
  it('splits on commas, trims, and drops blanks and case-insensitive repeats', () => {
    expect(parseTags(' First week, silly,,Silly , vet ')).toEqual(['First week', 'silly', 'vet']);
    expect(parseTags('')).toEqual([]);
  });
});

describe('createMemory', () => {
  it('saves a text-only memory with tags', async () => {
    const { repos } = await setup();

    const memory = await createMemory(
      repos,
      form({ title: ' Zoomies ', body: 'Ran laps', mood: 'funny', tags: 'silly, night', isFavorite: true }),
      now,
    );

    expect(await repos.memories.getById(memory.id)).toEqual({
      id: memory.id,
      petId: 'pet-1',
      occurredAt: '2026-03-20',
      title: 'Zoomies',
      body: 'Ran laps',
      location: null,
      mood: 'funny',
      isFavorite: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
    expect(await repos.memories.getTags(memory.id)).toEqual(['night', 'silly']);
    expect(importMediaFile).not.toHaveBeenCalled();
  });

  it('copies each photo into app storage and links it to the memory', async () => {
    const { repos } = await setup();

    const memory = await createMemory(
      repos,
      form({ photos: [{ kind: 'new', photo: photo(1) }, { kind: 'new', photo: photo(2) }] }),
      now,
    );

    const photos = await repos.media.listByMemory(memory.id);
    expect(photos).toHaveLength(2);
    expect(photos[0]).toMatchObject({ petId: 'pet-1', memoryId: memory.id, localUri: `media/${photos[0].id}.jpg` });
    expect(importMediaFile).toHaveBeenNthCalledWith(1, 'content://picker/1', photos[0].id, 'image/jpeg');
    expect(importMediaFile).toHaveBeenNthCalledWith(2, 'content://picker/2', photos[1].id, 'image/jpeg');
  });

  it('removes the memory and copied files if a photo fails to copy', async () => {
    const { repos } = await setup();
    jest.mocked(importMediaFile)
      .mockImplementationOnce(async (_uri, id) => `media/${id}.jpg`)
      .mockRejectedValueOnce(new Error('disk full'));

    await expect(
      createMemory(repos, form({ photos: [{ kind: 'new', photo: photo(1) }, { kind: 'new', photo: photo(2) }] }), now),
    ).rejects.toThrow('disk full');

    expect(await repos.memories.list()).toEqual([]);
    expect(await repos.media.listPathsByPet('pet-1')).toEqual([]);
    expect(deleteMediaFile).toHaveBeenCalledTimes(1);
  });
});

describe('updateMemory', () => {
  it('keeps, adds, and removes photos and replaces tags', async () => {
    const { repos } = await setup();
    const memory = await createMemory(
      repos,
      form({ tags: 'old', photos: [{ kind: 'new', photo: photo(1) }, { kind: 'new', photo: photo(2) }] }),
      now,
    );
    const [kept, removed] = await repos.media.listByMemory(memory.id);
    const values = toMemoryFormValues(memory, [kept, removed], ['old']);
    expect(values.tags).toBe('old');
    jest.clearAllMocks();

    const later = new Date('2026-04-02T10:00:00.000Z');
    const updated = await updateMemory(
      repos,
      memory,
      { ...values, title: 'Edited', tags: 'new', photos: [values.photos[0], { kind: 'new', photo: photo(3) }] },
      later,
    );

    expect(updated).toMatchObject({ title: 'Edited', updatedAt: later.toISOString(), createdAt: now.toISOString() });
    const photos = await repos.media.listByMemory(memory.id);
    expect(photos.map((p) => p.id)).toEqual([kept.id, expect.any(String)]);
    expect(photos[1].id).not.toBe(removed.id);
    expect(deleteMediaFile).toHaveBeenCalledTimes(1);
    expect(deleteMediaFile).toHaveBeenCalledWith(removed.localUri);
    expect(await repos.memories.getTags(memory.id)).toEqual(['new']);
  });
});

describe('toggleFavorite and deleteMemory', () => {
  it('flips the favorite flag', async () => {
    const { repos } = await setup();
    const memory = await createMemory(repos, form({ body: 'x' }), now);

    await toggleFavorite(repos.memories, memory, now);

    expect((await repos.memories.getById(memory.id))?.isFavorite).toBe(true);
  });

  it('removes the memory, its photo rows, and its app photo copies only', async () => {
    const { repos } = await setup();
    const keep = await createMemory(repos, form({ photos: [{ kind: 'new', photo: photo(1) }] }), now);
    const gone = await createMemory(repos, form({ tags: 'x', photos: [{ kind: 'new', photo: photo(2) }] }), now);
    const [gonePhoto] = await repos.media.listByMemory(gone.id);
    jest.clearAllMocks();

    await deleteMemory(repos, gone.id);

    expect(await repos.memories.getById(gone.id)).toBeNull();
    expect(await repos.media.listByMemory(gone.id)).toEqual([]);
    expect(await repos.memories.getTags(gone.id)).toEqual([]);
    expect(deleteMediaFile).toHaveBeenCalledTimes(1);
    expect(deleteMediaFile).toHaveBeenCalledWith(gonePhoto.localUri);
    expect(await repos.media.listByMemory(keep.id)).toHaveLength(1);
  });
});
