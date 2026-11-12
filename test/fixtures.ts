import { emptyPetForm, type PetFormValues } from '@/src/services/petService';
import type { Media } from '@/src/types/media';
import type { Memory } from '@/src/types/memory';
import type { Milestone } from '@/src/types/milestone';
import type { Pet } from '@/src/types/pet';

export const petFixture = (overrides: Partial<Pet> = {}): Pet => ({
  id: 'pet-1',
  name: 'Luna',
  species: 'Cat',
  breed: null,
  sex: 'female',
  approximateAge: null,
  arrivalDate: '2026-03-14',
  departureDate: null,
  status: 'active',
  backstory: null,
  personality: null,
  notes: null,
  coverPhotoId: null,
  coverPhotoPath: null,
  createdAt: '2026-03-14T12:00:00.000Z',
  updatedAt: '2026-03-14T12:00:00.000Z',
  ...overrides,
});

export const formFixture = (overrides: Partial<PetFormValues> = {}): PetFormValues => ({
  ...emptyPetForm,
  name: 'Luna',
  ...overrides,
});

export const memoryFixture = (overrides: Partial<Memory> = {}): Memory => ({
  id: 'memory-1',
  petId: 'pet-1',
  occurredAt: '2026-03-15',
  title: 'First nap',
  body: null,
  location: null,
  mood: null,
  isFavorite: false,
  createdAt: '2026-03-15T12:00:00.000Z',
  updatedAt: '2026-03-15T12:00:00.000Z',
  ...overrides,
});

export const mediaFixture = (overrides: Partial<Media> = {}): Media => ({
  id: 'media-1',
  memoryId: null,
  petId: 'pet-1',
  localUri: 'media/media-1.jpg',
  thumbnailUri: null,
  mimeType: 'image/jpeg',
  width: 800,
  height: 600,
  durationSeconds: null,
  caption: null,
  takenAt: null,
  createdAt: '2026-03-15T12:00:00.000Z',
  ...overrides,
});

export const milestoneFixture = (overrides: Partial<Milestone> = {}): Milestone => ({
  id: 'milestone-1',
  petId: 'pet-1',
  memoryId: null,
  label: 'First purr',
  occurredAt: '2026-03-16',
  category: null,
  notes: null,
  createdAt: '2026-03-16T12:00:00.000Z',
  ...overrides,
});
