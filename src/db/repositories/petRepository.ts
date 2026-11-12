import type { Pet } from '@/src/types/pet';
import type { SqlDatabase } from '../types';

export interface PetRepository {
  list(): Promise<Pet[]>;
  getById(id: string): Promise<Pet | null>;
  insert(pet: Pet): Promise<void>;
  update(pet: Pet): Promise<void>;
  /** Also deletes the pet's memories, media rows, and milestones (ON DELETE CASCADE). */
  delete(id: string): Promise<void>;
}

const COLUMNS = [
  'id',
  'name',
  'species',
  'breed',
  'sex',
  'approximateAge',
  'arrivalDate',
  'departureDate',
  'status',
  'backstory',
  'personality',
  'notes',
  'coverPhotoId',
  'createdAt',
  'updatedAt',
] as const satisfies readonly Exclude<keyof Pet, 'coverPhotoPath'>[];

const values = (pet: Pet) => COLUMNS.map((column) => pet[column]);

// Active pets first, then most recent arrival.
const ORDER = `ORDER BY p.status = 'active' DESC, COALESCE(p.arrivalDate, p.createdAt) DESC`;

const SELECT = `SELECT p.*, m.localUri AS coverPhotoPath FROM pets p LEFT JOIN media m ON m.id = p.coverPhotoId`;

export function createSqlitePetRepository(db: SqlDatabase): PetRepository {
  return {
    list: () => db.getAllAsync<Pet>(`${SELECT} ${ORDER}`, []),

    getById: (id) => db.getFirstAsync<Pet>(`${SELECT} WHERE p.id = ?`, [id]),

    async insert(pet) {
      await db.runAsync(
        `INSERT INTO pets (${COLUMNS.join(', ')}) VALUES (${COLUMNS.map(() => '?').join(', ')})`,
        values(pet),
      );
    },

    async update(pet) {
      const editable = COLUMNS.filter((column) => column !== 'id' && column !== 'createdAt');
      await db.runAsync(
        `UPDATE pets SET ${editable.map((column) => `${column} = ?`).join(', ')} WHERE id = ?`,
        [...editable.map((column) => pet[column]), pet.id],
      );
    },

    async delete(id) {
      await db.runAsync('DELETE FROM pets WHERE id = ?', [id]);
    },
  };
}

/** Non-persistent repository, used as a test double. */
export function createMemoryPetRepository(seed: Pet[] = []): PetRepository {
  const pets = new Map(seed.map((pet) => [pet.id, pet]));
  const byOrder = (a: Pet, b: Pet) =>
    Number(b.status === 'active') - Number(a.status === 'active') ||
    (b.arrivalDate ?? b.createdAt).localeCompare(a.arrivalDate ?? a.createdAt);
  return {
    list: async () => [...pets.values()].sort(byOrder),
    getById: async (id) => pets.get(id) ?? null,
    insert: async (pet) => {
      pets.set(pet.id, pet);
    },
    update: async (pet) => {
      pets.set(pet.id, pet);
    },
    delete: async (id) => {
      pets.delete(id);
    },
  };
}
