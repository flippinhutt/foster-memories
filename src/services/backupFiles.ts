import type { Repositories } from '@/src/db';
import type { RestoreResult } from '@/src/db/repositories/backupRepository';
import { backupFileName, backupPhotoPaths, makeBackupZip, readBackupZip } from './backupService';
import { assertCanSave, pickZip, saveFile } from './deviceFiles';
import { readMediaBytes, writeMediaBytes } from './mediaFiles';

// shortcut: the whole backup is held in memory; fine for a personal journal, stream it if backups reach hundreds of MB.

/** Builds one ZIP with every pet, memory, and photo, then shares it (Android) or downloads it (web). */
export async function createBackup(repos: Repositories, onProgress: (message: string) => void): Promise<void> {
  await assertCanSave();
  const now = new Date();
  onProgress('Gathering everything…');
  const data = await repos.backup.dump();

  const paths = [...new Set(backupPhotoPaths(data))];
  const photos: Record<string, Uint8Array> = {};
  for (const [i, path] of paths.entries()) {
    onProgress(`Adding photos ${i + 1} of ${paths.length}…`);
    const bytes = await readMediaBytes(path);
    if (bytes) photos[path] = bytes; // a missing photo is skipped, not fatal
  }

  onProgress('Making backup…');
  await saveFile(backupFileName(now), makeBackupZip(data, photos, now), 'application/zip', 'Save your Foster Memories backup');
}

/** Lets the user pick a backup ZIP and adds what isn't here yet. Returns null if they cancel. */
export async function restoreBackup(
  repos: Repositories,
  onProgress: (message: string) => void,
): Promise<RestoreResult | null> {
  const bytes = await pickZip();
  if (!bytes) return null;

  onProgress('Reading backup…');
  const backup = readBackupZip(bytes);

  // Photos first, so restored memories never point at a missing file.
  const paths = Object.keys(backup.photos);
  for (const [i, path] of paths.entries()) {
    onProgress(`Restoring photos ${i + 1} of ${paths.length}…`);
    await writeMediaBytes(path, backup.photos[path]);
  }

  onProgress('Restoring memories…');
  return repos.backup.restore(backup.data);
}
