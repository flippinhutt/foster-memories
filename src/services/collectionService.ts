import { randomUUID } from 'expo-crypto';
import { z } from 'zod';
import type { CollectionRepository } from '@/src/db/repositories/collectionRepository';
import type { Collection } from '@/src/types/collection';

export const collectionFormSchema = z.object({
  name: z.string().trim().min(1, 'Name this collection.').max(80, 'Keep this under 80 characters.'),
  description: z.string().trim().max(500, 'Keep this under 500 characters.'),
});

export type CollectionFormValues = z.input<typeof collectionFormSchema>;

export const emptyCollectionForm: CollectionFormValues = { name: '', description: '' };

const toFields = (values: CollectionFormValues) => {
  const parsed = collectionFormSchema.parse(values);
  return { name: parsed.name, description: parsed.description === '' ? null : parsed.description };
};

/** New collections go to the end of the list. */
export async function createCollection(
  repo: CollectionRepository,
  values: CollectionFormValues,
  now: Date = new Date(),
): Promise<Collection> {
  const existing = await repo.list();
  const collection: Collection = {
    id: randomUUID(),
    ...toFields(values),
    sortOrder: Math.max(-1, ...existing.map((c) => c.sortOrder)) + 1,
    createdAt: now.toISOString(),
  };
  await repo.insert(collection);
  return collection;
}

export async function updateCollection(
  repo: CollectionRepository,
  existing: Collection,
  values: CollectionFormValues,
): Promise<Collection> {
  const collection: Collection = { ...existing, ...toFields(values) };
  await repo.update(collection);
  return collection;
}
