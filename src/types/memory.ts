import type { Media } from './media';

export const MEMORY_MOODS = ['happy', 'funny', 'sweet', 'proud', 'challenging', 'sad', 'neutral'] as const;
export type MemoryMood = (typeof MEMORY_MOODS)[number];

export interface Memory {
  id: string;
  petId: string;
  /** ISO date, YYYY-MM-DD */
  occurredAt: string;
  title: string | null;
  body: string | null;
  location: string | null;
  mood: MemoryMood | null;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

/** A memory as shown in a timeline: its first photo and photo count. */
export interface MemorySummary extends Memory {
  photoPath: string | null;
  photoCount: number;
}

export interface MemoryDetail {
  memory: Memory;
  photos: Media[];
  tags: string[];
}
