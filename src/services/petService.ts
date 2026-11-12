import { randomUUID } from 'expo-crypto';
import { z } from 'zod';
import type { MediaRepository } from '@/src/db/repositories/mediaRepository';
import type { PetRepository } from '@/src/db/repositories/petRepository';
import type { Media } from '@/src/types/media';
import { PET_SEXES, PET_STATUSES, type Pet, type PetInput } from '@/src/types/pet';
import { displayToIsoDate, formatDate, parseDisplayDate } from '@/src/utils/dates';
import { deleteMediaFile, importMediaFile } from './mediaFiles';
import type { PickedPhoto } from './photoPicker';

const optionalText = z.string().trim().max(2000, 'Keep this under 2000 characters.');
const optionalDate = z
  .string()
  .trim()
  .refine((value) => value === '' || parseDisplayDate(value) !== null, 'Use a date like 03-14-2026.');

/** Form values: every field is a string so inputs stay controlled. Dates are MM-DD-YYYY. */
export const petFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Give your foster a name.').max(80, 'Keep the name under 80 characters.'),
    species: optionalText,
    breed: optionalText,
    sex: z.enum([...PET_SEXES, '']),
    approximateAge: optionalText,
    arrivalDate: optionalDate,
    departureDate: optionalDate,
    status: z.enum(PET_STATUSES),
    backstory: optionalText,
    personality: optionalText,
    notes: optionalText,
  })
  .refine(
    (pet) => {
      const arrival = parseDisplayDate(pet.arrivalDate);
      const departure = parseDisplayDate(pet.departureDate);
      return !arrival || !departure || departure >= arrival;
    },
    { message: 'Departure can’t be before arrival.', path: ['departureDate'] },
  );

export type PetFormValues = z.input<typeof petFormSchema>;

export const emptyPetForm: PetFormValues = {
  name: '',
  species: '',
  breed: '',
  sex: '',
  approximateAge: '',
  arrivalDate: '',
  departureDate: '',
  status: 'active',
  backstory: '',
  personality: '',
  notes: '',
};

const blankToNull = (value: string) => (value.trim() === '' ? null : value.trim());
const dateOrNull = (value: string) => (value.trim() === '' ? null : displayToIsoDate(value.trim()));

export function toPetInput(values: PetFormValues): PetInput {
  const parsed = petFormSchema.parse(values);
  return {
    name: parsed.name,
    species: blankToNull(parsed.species),
    breed: blankToNull(parsed.breed),
    sex: parsed.sex === '' ? null : parsed.sex,
    approximateAge: blankToNull(parsed.approximateAge),
    arrivalDate: dateOrNull(parsed.arrivalDate),
    departureDate: dateOrNull(parsed.departureDate),
    status: parsed.status,
    backstory: blankToNull(parsed.backstory),
    personality: blankToNull(parsed.personality),
    notes: blankToNull(parsed.notes),
  };
}

export function toPetFormValues(pet: Pet): PetFormValues {
  return {
    name: pet.name,
    species: pet.species ?? '',
    breed: pet.breed ?? '',
    sex: pet.sex ?? '',
    approximateAge: pet.approximateAge ?? '',
    arrivalDate: pet.arrivalDate ? formatDate(pet.arrivalDate) : '',
    departureDate: pet.departureDate ? formatDate(pet.departureDate) : '',
    status: pet.status,
    backstory: pet.backstory ?? '',
    personality: pet.personality ?? '',
    notes: pet.notes ?? '',
  };
}

export async function createPet(
  repo: PetRepository,
  values: PetFormValues,
  now: Date = new Date(),
): Promise<Pet> {
  const timestamp = now.toISOString();
  const pet: Pet = {
    id: randomUUID(),
    ...toPetInput(values),
    coverPhotoId: null,
    coverPhotoPath: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await repo.insert(pet);
  return pet;
}

export async function updatePet(
  repo: PetRepository,
  existing: Pet,
  values: PetFormValues,
  now: Date = new Date(),
): Promise<Pet> {
  const pet: Pet = { ...existing, ...toPetInput(values), updatedAt: now.toISOString() };
  await repo.update(pet);
  return pet;
}

interface PetRepos {
  pets: PetRepository;
  media: MediaRepository;
}

/** Copies the photo into app storage, makes it the cover, then removes the old cover. */
export async function setCoverPhoto(
  repos: PetRepos,
  pet: Pet,
  photo: PickedPhoto,
  now: Date = new Date(),
): Promise<Pet> {
  const timestamp = now.toISOString();
  const id = randomUUID();
  const localUri = await importMediaFile(photo.uri, id, photo.mimeType);
  const media: Media = {
    id,
    memoryId: null,
    petId: pet.id,
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
  const updated: Pet = { ...pet, coverPhotoId: id, coverPhotoPath: localUri, updatedAt: timestamp };
  try {
    await repos.media.insert(media);
    await repos.pets.update(updated);
  } catch (error) {
    await repos.media.delete(id).catch(() => undefined);
    deleteMediaFile(localUri);
    throw error;
  }

  // Old cover: remove only if it is not also part of a memory.
  const old = pet.coverPhotoId ? await repos.media.getById(pet.coverPhotoId) : null;
  if (old && old.memoryId === null) {
    await repos.media.delete(old.id);
    deleteMediaFile(old.localUri);
  }
  return updated;
}

/** Deletes the pet with its memories, media, and milestones, then its private photo copies. */
export async function deletePet(repos: PetRepos, petId: string): Promise<void> {
  const paths = await repos.media.listPathsByPet(petId);
  await repos.pets.delete(petId);
  for (const path of paths) deleteMediaFile(path);
}
