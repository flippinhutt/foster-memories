import { createInMemoryCollectionRepository } from '@/src/db/repositories/collectionRepository';
import { collectionFormSchema, createCollection, updateCollection } from '../collectionService';

describe('collectionFormSchema', () => {
  it('needs a name', () => {
    const result = collectionFormSchema.safeParse({ name: '  ', description: '' });
    expect(result.error?.issues.map((issue) => issue.message)).toEqual(['Name this collection.']);
  });
});

describe('createCollection and updateCollection', () => {
  it('appends trimmed collections and renames them', async () => {
    const repo = createInMemoryCollectionRepository();
    const now = new Date('2026-04-01T10:00:00.000Z');

    const first = await createCollection(repo, { name: ' First week ', description: '' }, now);
    const second = await createCollection(repo, { name: 'Farewell', description: ' Goodbye day ' }, now);

    expect(first).toMatchObject({ name: 'First week', description: null, sortOrder: 0, createdAt: now.toISOString() });
    expect(second).toMatchObject({ description: 'Goodbye day', sortOrder: 1 });

    const renamed = await updateCollection(repo, first, { name: 'First days', description: 'Settling in' });
    expect(renamed).toEqual({ ...first, name: 'First days', description: 'Settling in' });
    expect((await repo.list()).map((c) => c.name)).toEqual(['First days', 'Farewell']);
  });
});
