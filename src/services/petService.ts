import { randomUUID } from 'expo-crypto';
import { z } from 'zod';
import type { PetRepository } from '@/src/db/repositories/petRepository';
import { PET_SEXES, PET_STATUSES, type Pet, type PetInput } from '@/src/types/pet';
import { displayToIsoDate, formatDate, parseDisplayDate } from '@/src/utils/dates';

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
