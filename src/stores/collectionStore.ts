import { create } from 'zustand';
import { getRepositories } from '@/src/db';
import { createCollection, updateCollection, type CollectionFormValues } from '@/src/services/collectionService';
import type { Collection, CollectionLink } from '@/src/types/collection';

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface CollectionState {
  collections: Collection[];
  links: CollectionLink[];
  status: LoadStatus;
  error: string | null;
  load: () => Promise<void>;
  create: (values: CollectionFormValues) => Promise<Collection>;
  update: (existing: Collection, values: CollectionFormValues) => Promise<void>;
  remove: (collectionId: string) => Promise<void>;
  addMemory: (collectionId: string, memoryId: string) => Promise<void>;
  removeMemory: (collectionId: string, memoryId: string) => Promise<void>;
}

const message = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong.';

export const useCollectionStore = create<CollectionState>((set, get) => ({
  collections: [],
  links: [],
  status: 'idle',
  error: null,

  async load() {
    if (get().status !== 'ready') set({ status: 'loading', error: null });
    try {
      const { collections } = await getRepositories();
      const [list, links] = await Promise.all([collections.list(), collections.listLinks()]);
      set({ collections: list, links, status: 'ready' });
    } catch (error) {
      set({ status: 'error', error: message(error) });
    }
  },

  async create(values) {
    const { collections } = await getRepositories();
    const collection = await createCollection(collections, values);
    await get().load();
    return collection;
  },

  async update(existing, values) {
    const { collections } = await getRepositories();
    await updateCollection(collections, existing, values);
    await get().load();
  },

  async remove(collectionId) {
    const { collections } = await getRepositories();
    await collections.delete(collectionId);
    await get().load();
  },

  async addMemory(collectionId, memoryId) {
    const { collections } = await getRepositories();
    await collections.addMemory(collectionId, memoryId);
    await get().load();
  },

  async removeMemory(collectionId, memoryId) {
    const { collections } = await getRepositories();
    await collections.removeMemory(collectionId, memoryId);
    await get().load();
  },
}));

export const selectCollectionById = (id: string | undefined) => (state: CollectionState) =>
  state.collections.find((collection) => collection.id === id);
