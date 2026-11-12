import type { Collection, CollectionLink } from '@/src/types/collection';
import type { SqlDatabase } from '../types';

export interface CollectionRepository {
  /** All collections in display order. */
  list(): Promise<Collection[]>;
  insert(collection: Collection): Promise<void>;
  update(collection: Collection): Promise<void>;
  /** Also removes its memory links (ON DELETE CASCADE); the memories are kept. */
  delete(id: string): Promise<void>;
  /** Every collection-memory link, in the order memories were added. */
  listLinks(): Promise<CollectionLink[]>;
  /** Appends the memory to the collection; does nothing if it is already there. */
  addMemory(collectionId: string, memoryId: string): Promise<void>;
  removeMemory(collectionId: string, memoryId: string): Promise<void>;
}

const COLUMNS = ['id', 'name', 'description', 'sortOrder', 'createdAt'] as const satisfies readonly (keyof Collection)[];

const byOrder = (a: Collection, b: Collection) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt);

export function createSqliteCollectionRepository(db: SqlDatabase): CollectionRepository {
  return {
    list: () =>
      db.getAllAsync<Collection>(
        `SELECT ${COLUMNS.join(', ')} FROM collections ORDER BY sortOrder, createdAt`,
        [],
      ),

    async insert(collection) {
      await db.runAsync(
        `INSERT INTO collections (${COLUMNS.join(', ')}) VALUES (${COLUMNS.map(() => '?').join(', ')})`,
        COLUMNS.map((column) => collection[column]),
      );
    },

    async update(collection) {
      await db.runAsync('UPDATE collections SET name = ?, description = ?, sortOrder = ? WHERE id = ?', [
        collection.name,
        collection.description,
        collection.sortOrder,
        collection.id,
      ]);
    },

    async delete(id) {
      await db.runAsync('DELETE FROM collections WHERE id = ?', [id]);
    },

    listLinks: () =>
      db.getAllAsync<CollectionLink>(
        'SELECT collectionId, memoryId, sortOrder FROM collection_memories ORDER BY collectionId, sortOrder',
        [],
      ),

    async addMemory(collectionId, memoryId) {
      await db.runAsync(
        `INSERT OR IGNORE INTO collection_memories (collectionId, memoryId, sortOrder)
        SELECT ?, ?, COALESCE(MAX(sortOrder) + 1, 0) FROM collection_memories WHERE collectionId = ?`,
        [collectionId, memoryId, collectionId],
      );
    },

    async removeMemory(collectionId, memoryId) {
      await db.runAsync('DELETE FROM collection_memories WHERE collectionId = ? AND memoryId = ?', [
        collectionId,
        memoryId,
      ]);
    },
  };
}

/** Non-persistent repository: web stub until Phase 2. */
export function createInMemoryCollectionRepository(): CollectionRepository {
  const collections = new Map<string, Collection>();
  let links: CollectionLink[] = [];
  return {
    list: async () => [...collections.values()].sort(byOrder),
    insert: async (collection) => {
      collections.set(collection.id, collection);
    },
    update: async (collection) => {
      collections.set(collection.id, collection);
    },
    delete: async (id) => {
      collections.delete(id);
      links = links.filter((link) => link.collectionId !== id);
    },
    listLinks: async () =>
      [...links].sort((a, b) => a.collectionId.localeCompare(b.collectionId) || a.sortOrder - b.sortOrder),
    addMemory: async (collectionId, memoryId) => {
      const inCollection = links.filter((link) => link.collectionId === collectionId);
      if (inCollection.some((link) => link.memoryId === memoryId)) return;
      const sortOrder = Math.max(-1, ...inCollection.map((link) => link.sortOrder)) + 1;
      links.push({ collectionId, memoryId, sortOrder });
    },
    removeMemory: async (collectionId, memoryId) => {
      links = links.filter((link) => !(link.collectionId === collectionId && link.memoryId === memoryId));
    },
  };
}
