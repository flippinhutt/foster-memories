import { create } from 'zustand';
import { getRepositories } from '@/src/db';
import {
  createPet,
  deletePet,
  setCoverPhoto,
  updatePet,
  type PetFormValues,
} from '@/src/services/petService';
import type { PickedPhoto } from '@/src/services/photoPicker';
import type { Pet } from '@/src/types/pet';
import { useMemoryStore } from './memoryStore';
import { useMilestoneStore } from './milestoneStore';

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface PetState {
  pets: Pet[];
  status: LoadStatus;
  error: string | null;
  load: () => Promise<void>;
  create: (values: PetFormValues) => Promise<Pet>;
  update: (existing: Pet, values: PetFormValues) => Promise<Pet>;
  setCover: (pet: Pet, photo: PickedPhoto) => Promise<void>;
  remove: (petId: string) => Promise<void>;
}

const message = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong.';

export const usePetStore = create<PetState>((set, get) => ({
  pets: [],
  status: 'idle',
  error: null,

  async load() {
    // Keep showing current pets during a refresh; only the first load shows a spinner.
    if (get().status !== 'ready') set({ status: 'loading', error: null });
    try {
      const { pets } = await getRepositories();
      set({ pets: await pets.list(), status: 'ready' });
    } catch (error) {
      set({ status: 'error', error: message(error) });
    }
  },

  async create(values) {
    const { pets } = await getRepositories();
    const pet = await createPet(pets, values);
    await get().load();
    return pet;
  },

  async update(existing, values) {
    const { pets } = await getRepositories();
    const pet = await updatePet(pets, existing, values);
    await get().load();
    return pet;
  },

  async setCover(pet, photo) {
    await setCoverPhoto(await getRepositories(), pet, photo);
    await get().load();
  },

  async remove(petId) {
    await deletePet(await getRepositories(), petId);
    await Promise.all([get().load(), useMemoryStore.getState().load(), useMilestoneStore.getState().load()]);
  },
}));

export const selectPetById = (id: string | undefined) => (state: PetState) =>
  state.pets.find((pet) => pet.id === id);
