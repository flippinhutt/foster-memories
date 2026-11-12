import { emptyPetForm, type PetFormValues } from '@/src/services/petService';
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
