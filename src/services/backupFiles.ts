import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { Repositories } from '@/src/db';
import type { RestoreResult } from '@/src/db/repositories/backupRepository';
import { backupFileName, backupPhotoPaths, makeBackupZip, readBackupZip } from './backupService';

// shortcut: the whole backup is held in memory; fine for a personal journal, stream it if backups reach hundreds of MB.

/** Builds one ZIP with every pet, memory, and photo, then opens the share sheet. */
export async function createBackup(repos: Repositories, onProgress: (message: string) => void): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing isn’t available on this device.');
  const now = new Date();
  onProgress('Gathering everything…');
  const data = await repos.backup.dump();

  const paths = [...new Set(backupPhotoPaths(data))];
  const photos: Record<string, Uint8Array> = {};
  for (const [i, path] of paths.entries()) {
    onProgress(`Adding photos ${i + 1} of ${paths.length}…`);
    const file = new File(Paths.document, path);
    if (file.exists) photos[path] = await file.bytes(); // a missing photo is skipped, not fatal
  }

  onProgress('Making backup…');
  const dir = new Directory(Paths.cache, 'exports');
  if (dir.exists) dir.delete();
  dir.create({ intermediates: true, idempotent: true });
  const out = new File(dir, backupFileName(now));
  await out.write(makeBackupZip(data, photos, now));

  onProgress('Opening share sheet…');
  await Sharing.shareAsync(out.uri, { mimeType: 'application/zip', dialogTitle: 'Save your Foster Memories backup' });
}

/** Lets the user pick a backup ZIP and adds what isn't here yet. Returns null if they cancel. */
export async function restoreBackup(
  repos: Repositories,
  onProgress: (message: string) => void,
): Promise<RestoreResult | null> {
  const picked = await DocumentPicker.getDocumentAsync({
    type: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'],
    copyToCacheDirectory: true,
  });
  if (picked.canceled || !picked.assets[0]) return null;

  onProgress('Reading backup…');
  const copy = new File(picked.assets[0].uri);
  const backup = readBackupZip(await copy.bytes());
  if (copy.exists) copy.delete();

  // Photos first, so restored memories never point at a missing file.
  const paths = Object.keys(backup.photos);
  new Directory(Paths.document, 'media').create({ intermediates: true, idempotent: true });
  for (const [i, path] of paths.entries()) {
    onProgress(`Restoring photos ${i + 1} of ${paths.length}…`);
    const file = new File(Paths.document, path);
    if (!file.exists) await file.write(backup.photos[path]);
  }

  onProgress('Restoring memories…');
  return repos.backup.restore(backup.data);
}
