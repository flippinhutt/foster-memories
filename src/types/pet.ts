export const PET_STATUSES = [
  'active',
  'adopted',
  'transferred',
  'returned',
  'deceased',
  'unknown',
] as const;
export type PetStatus = (typeof PET_STATUSES)[number];

export const PET_SEXES = ['male', 'female', 'unknown'] as const;
export type PetSex = (typeof PET_SEXES)[number];

export interface Pet {
  id: string;
  name: string;
  species: string | null;
  breed: string | null;
  sex: PetSex | null;
  approximateAge: string | null;
  /** ISO date, YYYY-MM-DD */
  arrivalDate: string | null;
  /** ISO date, YYYY-MM-DD */
  departureDate: string | null;
  status: PetStatus;
  backstory: string | null;
  personality: string | null;
  notes: string | null;
  coverPhotoId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Fields the user can edit. */
export type PetInput = Omit<Pet, 'id' | 'coverPhotoId' | 'createdAt' | 'updatedAt'>;
