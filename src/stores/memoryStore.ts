import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { getRepositories } from '@/src/db';
import {
  createMemory,
  deleteMemory,
  toggleFavorite,
  updateMemory,
  type MemoryFormValues,
} from '@/src/services/memoryService';
import type { Memory, MemoryDetail, MemorySummary } from '@/src/types/memory';
import { useCollectionStore } from './collectionStore';
import { useMilestoneStore } from './milestoneStore';

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface MemoryState {
  /** Every memory, newest first. A personal journal stays small enough to hold in memory. */
  memories: MemorySummary[];
  /** Tag names by memory id, for search and filters. */
  tagsByMemory: Record<string, string[]>;
  status: LoadStatus;
  error: string | null;
  load: () => Promise<void>;
  create: (values: MemoryFormValues) => Promise<Memory>;
  update: (existing: Memory, values: MemoryFormValues) => Promise<void>;
  toggleFavorite: (memory: Memory) => Promise<void>;
  remove: (memoryId: string) => Promise<void>;
}

const message = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong.';

export const useMemoryStore = create<MemoryState>((set, get) => ({
  memories: [],
  tagsByMemory: {},
  status: 'idle',
  error: null,

  async load() {
    if (get().status !== 'ready') set({ status: 'loading', error: null });
    try {
      const { memories } = await getRepositories();
      const [list, tagLinks] = await Promise.all([memories.list(), memories.listTagLinks()]);
      const tagsByMemory: Record<string, string[]> = {};
      for (const { memoryId, name } of tagLinks) (tagsByMemory[memoryId] ??= []).push(name);
      set({ memories: list, tagsByMemory, status: 'ready' });
    } catch (error) {
      set({ status: 'error', error: message(error) });
    }
  },

  async create(values) {
    const memory = await createMemory(await getRepositories(), values);
    await get().load();
    return memory;
  },

  async update(existing, values) {
    await updateMemory(await getRepositories(), existing, values);
    await get().load();
  },

  async toggleFavorite(memory) {
    const { memories } = await getRepositories();
    await toggleFavorite(memories, memory);
    await get().load();
  },

  async remove(memoryId) {
    await deleteMemory(await getRepositories(), memoryId);
    // Linked milestones lose their memoryId (ON DELETE SET NULL); collection links are removed.
    await Promise.all([get().load(), useMilestoneStore.getState().load(), useCollectionStore.getState().load()]);
  },
}));

async function loadMemoryDetail(id: string): Promise<MemoryDetail | null> {
  const { memories, media } = await getRepositories();
  const memory = await memories.getById(id);
  if (!memory) return null;
  const [photos, tags] = await Promise.all([media.listByMemory(id), memories.getTags(id)]);
  return { memory, photos, tags };
}

type DetailState =
  | { status: 'loading' }
  | { status: 'ready'; detail: MemoryDetail }
  | { status: 'missing' }
  | { status: 'error'; message: string };

/** Loads one memory with its photos and tags; reloads after any memory change. */
export function useMemoryDetail(id: string | undefined) {
  const memories = useMemoryStore((state) => state.memories);
  const [state, setState] = useState<DetailState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    loadMemoryDetail(id ?? '')
      .then((detail) => {
        if (active) setState(detail ? { status: 'ready', detail } : { status: 'missing' });
      })
      .catch((error: unknown) => {
        if (active) setState({ status: 'error', message: message(error) });
      });
    return () => {
      active = false;
    };
  }, [id, memories, attempt]);

  return { state, retry: () => setAttempt((n) => n + 1) };
}
