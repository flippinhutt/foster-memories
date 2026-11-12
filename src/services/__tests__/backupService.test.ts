import { strToU8, zipSync } from 'fflate';
import type { BackupData } from '@/src/db/repositories/backupRepository';
import { backupFileName, makeBackupZip, readBackupZip } from '../backupService';

const empty = (): BackupData => ({
  pets: [],
  memories: [],
  media: [],
  milestones: [],
  tags: [],
  memory_tags: [],
  collections: [],
  collection_memories: [],
});

const now = new Date('2026-11-12T10:00:00.000Z');

describe('backup ZIP', () => {
  it('round-trips rows and photos', () => {
    const data = empty();
    data.pets.push({ id: 'pet-1', name: 'Luna', status: 'active', createdAt: 'x', updatedAt: 'x' });
    data.media.push({ id: 'm1', petId: 'pet-1', localUri: 'media/m1.jpg', createdAt: 'x' });
    const photo = new Uint8Array([1, 2, 3]);

    const backup = readBackupZip(makeBackupZip(data, { 'media/m1.jpg': photo }, now));
    expect(backup.data).toEqual(data);
    expect(backup.photos).toEqual({ 'media/m1.jpg': photo });
  });

  it('drops media rows and files with paths outside media/', () => {
    const data = empty();
    data.media.push({ id: 'bad', petId: 'pet-1', localUri: 'media/../../evil.sh', createdAt: 'x' });
    const zip = makeBackupZip(data, { 'media/../../evil.sh': new Uint8Array([1]) }, now);

    const backup = readBackupZip(zip);
    expect(backup.data.media).toEqual([]);
    expect(backup.photos).toEqual({});
  });

  it.each([
    ['not a zip', strToU8('hello')],
    ['zip without backup.json', zipSync({ 'story.md': strToU8('# Luna') })],
    ['wrong format', zipSync({ 'backup.json': strToU8(JSON.stringify({ format: 'other', formatVersion: 1, data: {} })) })],
    [
      'unknown column',
      zipSync({
        'backup.json': strToU8(
          JSON.stringify({ format: 'foster-memories-backup', formatVersion: 1, data: { pets: [{ id: 'p', 'evil; DROP': 1 }] } }),
        ),
      }),
    ],
  ])('rejects %s', (_name, bytes) => {
    expect(() => readBackupZip(bytes)).toThrow('This file isn’t a Foster Memories backup.');
  });

  it('names the file by date', () => {
    expect(backupFileName(now)).toBe('foster-memories-backup-2026-11-12.zip');
  });
});
