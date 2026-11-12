import type { Pet, PetSex, PetStatus } from '@/src/types/pet';

export const STATUS_LABELS: Record<PetStatus, string> = {
  active: 'In my care',
  adopted: 'Adopted',
  transferred: 'Transferred',
  returned: 'Returned',
  deceased: 'Passed away',
  unknown: 'Unknown',
};

export const SEX_LABELS: Record<PetSex, string> = {
  male: 'Male',
  female: 'Female',
  unknown: 'Unknown',
};

/** "Cat · Tabby mix · about 2 years", skipping blanks. */
export function petSummary(pet: Pet): string {
  return [pet.species, pet.breed, pet.approximateAge].filter(Boolean).join(' · ');
}
