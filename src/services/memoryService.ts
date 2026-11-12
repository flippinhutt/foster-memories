import { randomUUID } from 'expo-crypto';
import { z } from 'zod';
import type { MediaRepository } from '@/src/db/repositories/mediaRepository';
import type { MemoryRepository } from '@/src/db/repositories/memoryRepository';
import type { Media } from '@/src/types/media';
import { MEMORY_MOODS, type Memory } from '@/src/types/memory';
import { displayToIsoDate, formatDate, parseDisplayDate } from '@/src/utils/dates';
import { deleteMediaFile, importMediaFile } from './mediaFiles';
import type { PickedPhoto } from './photoPicker';

/** A photo in the memory form: already saved, or just picked and not yet copied. */
export type DraftPhoto = { kind: 'saved'; media: Media } | { kind: 'new'; photo: PickedPhoto };

const text = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters.`);

/** Form values: dates are MM-DD-YYYY, tags are comma-separated. */
export const memoryFormSchema = z
  .object({
    petId: z.string().min(1, 'Choose a pet.'),
    occurredAt: z
      .string()
      .trim()
      .refine((value) => parseDisplayDate(value) !== null, 'Use a date like 03-14-2026.'),
    title: text(120),
    body: text(5000),
    location: text(200),
    mood: z.enum([...MEMORY_MOODS, '']),
    tags: text(500),
    isFavorite: z.boolean(),
    photos: z.array(z.custom<DraftPhoto>()),
  })
  .refine((memory) => memory.photos.length > 0 || memory.title !== '' || memory.body !== '', {
    message: 'Add a photo or a note.',
    path: ['body'],
  });

export type MemoryFormValues = z.input<typeof memoryFormSchema>;

export const emptyMemoryForm: MemoryFormValues = {
  petId: '',
  occurredAt: '',
  title: '',
  body: '',
  location: '',
  mood: '',
  tags: '',
  isFavorite: false,
  photos: [],
};

/** "First week, silly,,Silly" -> ["First week", "silly"]. */
export function parseTags(input: string): string[] {
  const seen = new Set<string>();
  return input
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => {
      const key = tag.toLowerCase();
      if (tag === '' || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

const blankToNull = (value: string) => (value === '' ? null : value);

function toFields(values: MemoryFormValues) {
  const parsed = memoryFormSchema.parse(values);
  return {
    parsed,
    fields: {
      petId: parsed.petId,
      occurredAt: displayToIsoDate(parsed.occurredAt),
      title: blankToNull(parsed.title),
      body: blankToNull(parsed.body),
      location: blankToNull(parsed.location),
      mood: parsed.mood === '' ? null : parsed.mood,
      isFavorite: parsed.isFavorite,
    },
  };
}

export function toMemoryFormValues(memory: Memory, photos: Media[], tags: string[]): MemoryFormValues {
  return {
    petId: memory.petId,
    occurredAt: formatDate(memory.occurredAt),
    title: memory.title ?? '',
    body: memory.body ?? '',
    location: memory.location ?? '',
    mood: memory.mood ?? '',
    tags: tags.join(', '),
    isFavorite: memory.isFavorite,
    photos: photos.map((media) => ({ kind: 'saved', media })),
  };
}

interface MemoryRepos {
  memories: MemoryRepository;
  media: MediaRepository;
}

const newPhotos = (photos: DraftPhoto[]) =>
  photos.flatMap((draft) => (draft.kind === 'new' ? [draft.photo] : []));

/** Copies picked photos into app storage and links them to the memory. All or nothing. */
async function addPhotos(repos: MemoryRepos, memory: Memory, photos: PickedPhoto[], timestamp: string) {
  const added: Media[] = [];
  try {
    for (const photo of photos) {
      const id = randomUUID();
      const localUri = await importMediaFile(photo.uri, id, photo.mimeType);
      const media: Media = {
        id,
        memoryId: memory.id,
        petId: memory.petId,
        localUri,
        thumbnailUri: null,
        mimeType: photo.mimeType,
        width: photo.width,
        height: photo.height,
        durationSeconds: null,
        caption: null,
        takenAt: null,
        createdAt: timestamp,
      };
      added.push(media);
      await repos.media.insert(media);
    }
  } catch (error) {
    for (const media of added) {
      await repos.media.delete(media.id).catch(() => undefined);
      deleteMediaFile(media.localUri);
    }
    throw error;
  }
}

export async function createMemory(
  repos: MemoryRepos,
  values: MemoryFormValues,
  now: Date = new Date(),
): Promise<Memory> {
  const { parsed, fields } = toFields(values);
  const timestamp = now.toISOString();
  const memory: Memory = { id: randomUUID(), ...fields, createdAt: timestamp, updatedAt: timestamp };
  await repos.memories.insert(memory);
  try {
    await addPhotos(repos, memory, newPhotos(parsed.photos), timestamp);
    await repos.memories.setTags(memory.id, parseTags(parsed.tags));
  } catch (error) {
    await deleteMemory(repos, memory.id).catch(() => undefined);
    throw error;
  }
  return memory;
}

/** Saves edits; photos removed in the form are deleted only after everything else is saved. */
export async function updateMemory(
  repos: MemoryRepos,
  existing: Memory,
  values: MemoryFormValues,
  now: Date = new Date(),
): Promise<Memory> {
  const { parsed, fields } = toFields(values);
  const timestamp = now.toISOString();
  const memory: Memory = { ...existing, ...fields, updatedAt: timestamp };
  const before = await repos.media.listByMemory(existing.id);

  await repos.memories.update(memory);
  await repos.memories.setTags(memory.id, parseTags(parsed.tags));
  await addPhotos(repos, memory, newPhotos(parsed.photos), timestamp);

  const kept = new Set(parsed.photos.flatMap((draft) => (draft.kind === 'saved' ? [draft.media.id] : [])));
  for (const media of before) {
    if (kept.has(media.id)) continue;
    await repos.media.delete(media.id);
    deleteMediaFile(media.localUri);
  }
  return memory;
}

export async function toggleFavorite(
  repo: MemoryRepository,
  memory: Memory,
  now: Date = new Date(),
): Promise<Memory> {
  const updated: Memory = { ...memory, isFavorite: !memory.isFavorite, updatedAt: now.toISOString() };
  await repo.update(updated);
  return updated;
}

/** Deletes the memory, its tag links, and its photos saved in the app. Gallery originals are untouched. */
export async function deleteMemory(repos: MemoryRepos, memoryId: string): Promise<void> {
  const photos = await repos.media.listByMemory(memoryId);
  await repos.memories.delete(memoryId);
  for (const media of photos) {
    // SQLite already cascaded the row; the web stub needs the explicit delete.
    await repos.media.delete(media.id);
    deleteMediaFile(media.localUri);
  }
}
