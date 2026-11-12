import type { MemorySummary } from '@/src/types/memory';
import type { Milestone } from '@/src/types/milestone';
import type { Pet } from '@/src/types/pet';

export interface SearchData {
  pets: Pet[];
  memories: MemorySummary[];
  milestones: Milestone[];
  /** Tag names by memory id. */
  tagsByMemory: Record<string, string[]>;
}

export interface SearchFilters {
  query: string;
  /** '' means any tag. */
  tag: string;
  favoritesOnly: boolean;
}

export interface SearchResults {
  pets: Pet[];
  memories: MemorySummary[];
  milestones: Milestone[];
  tags: string[];
}

const sameText = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' }) === 0;

/** Every tag name once, A to Z, keeping the first casing seen. */
export function allTags(tagsByMemory: Record<string, string[]>): string[] {
  const byKey = new Map<string, string>();
  for (const name of Object.values(tagsByMemory).flat()) {
    if (!byKey.has(name.toLowerCase())) byKey.set(name.toLowerCase(), name);
  }
  return [...byKey.values()].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

/**
 * Case-insensitive search across pets, memories (title, note, location, tags), milestones, and tags.
 * Tag and favorite filters narrow memories. With no query and no filter, nothing is returned.
 */
export function search(data: SearchData, filters: SearchFilters): SearchResults {
  const query = filters.query.trim().toLowerCase();
  const matches = (...fields: (string | null)[]) => fields.some((field) => field?.toLowerCase().includes(query));
  const hasFilter = filters.tag !== '' || filters.favoritesOnly;
  if (query === '' && !hasFilter) return { pets: [], memories: [], milestones: [], tags: [] };

  const memories = data.memories.filter((memory) => {
    const tags = data.tagsByMemory[memory.id] ?? [];
    if (filters.favoritesOnly && !memory.isFavorite) return false;
    if (filters.tag !== '' && !tags.some((tag) => sameText(tag, filters.tag))) return false;
    return query === '' || matches(memory.title, memory.body, memory.location, ...tags);
  });
  if (query === '') return { pets: [], memories, milestones: [], tags: [] };

  return {
    pets: data.pets.filter((pet) => matches(pet.name, pet.species, pet.breed)),
    memories,
    milestones: data.milestones.filter((milestone) => matches(milestone.label, milestone.notes)),
    tags: allTags(data.tagsByMemory).filter((tag) => matches(tag)),
  };
}
