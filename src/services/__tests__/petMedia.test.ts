/// <reference types="node" />
import { openNodeSqlite } from '@/test/nodeSqliteDatabase';
import { petFixture } from '@/test/fixtures';
import { migrate } from '@/src/db/migrations';
import { createSqliteMediaRepository } from '@/src/db/repositories/mediaRepository';
import { createSqlitePetRepository } from '@/src/db/repositories/petRepository';
import { deleteMediaFile, importMediaFile } from '../mediaFiles';
import { deletePet, setCoverPhoto } from '../petService';
import type { PickedPhoto } from '../photoPicker';

jest.mock('../mediaFiles', () => ({
  importMediaFile: jest.fn(async (_uri: string, id: string) => `media/${id}.jpg`),
  deleteMediaFile: jest.fn(),
  mediaUri: (path: string) => path,
}));

const photo: PickedPhoto = { uri: 'content://picker/1', mimeType: 'image/jpeg', width: 800, height: 800 };
const now = new Date('2026-04-01T10:00:00.000Z');

async function setup() {
  const db = openNodeSqlite();
  await migrate(db);
  const repos = { pets: createSqlitePetRepository(db), media: createSqliteMediaRepository(db) };
  const pet = petFixture();
  await repos.pets.insert(pet);
  return { db, repos, pet };
}

beforeEach(() => jest.clearAllMocks());

describe('setCoverPhoto', () => {
  it('copies the photo, saves a media row, and exposes the cover path', async () => {
    const { repos, pet } = await setup();

    const updated = await setCoverPhoto(repos, pet, photo, now);

    expect(importMediaFile).toHaveBeenCalledWith(photo.uri, updated.coverPhotoId, 'image/jpeg');
    const stored = await repos.pets.getById(pet.id);
    expect(stored?.coverPhotoId).toBe(updated.coverPhotoId);
    expect(stored?.coverPhotoPath).toBe(`media/${updated.coverPhotoId}.jpg`);
    expect(stored?.updatedAt).toBe(now.toISOString());
    expect((await repos.pets.list())[0].coverPhotoPath).toBe(stored?.coverPhotoPath);
  });

  it('removes the previous cover row and file when replacing it', async () => {
    const { repos, pet } = await setup();
    const first = await setCoverPhoto(repos, pet, photo, now);
    const second = await setCoverPhoto(repos, first, photo, now);

    expect(await repos.media.getById(first.coverPhotoId ?? '')).toBeNull();
    expect(deleteMediaFile).toHaveBeenCalledWith(first.coverPhotoPath);
    expect(await repos.media.listPathsByPet(pet.id)).toEqual([second.coverPhotoPath]);
  });

  it('cleans up the copied file if saving fails', async () => {
    const { repos, pet } = await setup();
    const failing = { ...repos, pets: { ...repos.pets, update: () => Promise.reject(new Error('disk full')) } };

    await expect(setCoverPhoto(failing, pet, photo, now)).rejects.toThrow('disk full');

    expect(deleteMediaFile).toHaveBeenCalledTimes(1);
    expect(await repos.media.listPathsByPet(pet.id)).toEqual([]);
    expect((await repos.pets.getById(pet.id))?.coverPhotoId).toBeNull();
  });
});

describe('deletePet', () => {
  it('removes the pet, its related records, and its app copies of photos', async () => {
    const { db, repos, pet } = await setup();
    const other = petFixture({ id: 'pet-2', name: 'Milo' });
    await repos.pets.insert(other);
    const withCover = await setCoverPhoto(repos, pet, photo, now);
    await setCoverPhoto(repos, other, photo, now);
    await db.runAsync(
      `INSERT INTO memories (id, petId, occurredAt, createdAt, updatedAt) VALUES ('m1', ?, ?, ?, ?)`,
      [pet.id, now.toISOString(), now.toISOString(), now.toISOString()],
    );
    await db.runAsync(
      `INSERT INTO milestones (id, petId, label, occurredAt, createdAt) VALUES ('ms1', ?, 'First walk', ?, ?)`,
      [pet.id, now.toISOString(), now.toISOString()],
    );
    jest.clearAllMocks();

    await deletePet(repos, pet.id);

    expect(await repos.pets.getById(pet.id)).toBeNull();
    expect(await repos.media.listPathsByPet(pet.id)).toEqual([]);
    const count = (table: string) =>
      db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table} WHERE petId = ?`, [pet.id]);
    expect(await count('memories')).toEqual({ n: 0 });
    expect(await count('milestones')).toEqual({ n: 0 });
    expect(deleteMediaFile).toHaveBeenCalledTimes(1);
    expect(deleteMediaFile).toHaveBeenCalledWith(withCover.coverPhotoPath);
    expect((await repos.pets.getById(other.id))?.coverPhotoPath).not.toBeNull();
  });
});
