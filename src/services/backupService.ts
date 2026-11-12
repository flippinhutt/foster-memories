import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { z } from 'zod';
import { BACKUP_TABLES, type BackupData, type BackupRow, type BackupTable } from '@/src/db/repositories/backupRepository';

const FORMAT = 'foster-memories-backup';
const FORMAT_VERSION = 1;
/** Only plain file names inside media/; anything else could write outside app storage. */
const MEDIA_PATH = /^media\/[A-Za-z0-9._-]+$/;

export interface Backup {
  data: BackupData;
  /** Photo bytes keyed by their `media/...` path. */
  photos: Record<string, Uint8Array>;
}

/** Media paths the backup's rows refer to. */
export function backupPhotoPaths(data: BackupData): string[] {
  return data.media.map((row) => row.localUri).filter((path): path is string => typeof path === 'string' && MEDIA_PATH.test(path));
}

/** backup.json + photos under their own `media/...` paths. Stored, not deflated: photos are already compressed. */
export function makeBackupZip(data: BackupData, photos: Record<string, Uint8Array>, now: Date): Uint8Array {
  const manifest = { format: FORMAT, formatVersion: FORMAT_VERSION, exportedAt: now.toISOString(), data };
  return zipSync({ 'backup.json': strToU8(JSON.stringify(manifest)), ...photos }, { level: 0 });
}

const value = z.union([z.string(), z.number(), z.null()]);
const tableSchema = (columns: readonly string[]) =>
  z.array(z.object(Object.fromEntries(columns.map((column) => [column, value.optional()]))).strict());

const manifestSchema = z.object({
  format: z.literal(FORMAT),
  formatVersion: z.literal(FORMAT_VERSION),
  data: z.object(
    Object.fromEntries(Object.entries(BACKUP_TABLES).map(([table, columns]) => [table, tableSchema(columns).default([])])),
  ),
});

const NOT_A_BACKUP = 'This file isn’t a Foster Memories backup.';

/** Validates a backup ZIP from outside the app. Throws a friendly message if it isn't one. */
export function readBackupZip(bytes: Uint8Array): Backup {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes);
  } catch {
    throw new Error(NOT_A_BACKUP);
  }
  const json = files['backup.json'];
  if (!json) throw new Error(NOT_A_BACKUP);
  let parsed: z.infer<typeof manifestSchema>;
  try {
    parsed = manifestSchema.parse(JSON.parse(strFromU8(json)));
  } catch {
    throw new Error(NOT_A_BACKUP);
  }
  const data = parsed.data as Record<BackupTable, BackupRow[]>;
  const photos: Record<string, Uint8Array> = {};
  for (const path of backupPhotoPaths(data)) {
    if (files[path]) photos[path] = files[path];
  }
  // Rows pointing at unsafe paths are dropped so no stored path can escape media/.
  data.media = data.media.filter((row) => typeof row.localUri === 'string' && MEDIA_PATH.test(row.localUri));
  return { data, photos };
}

export function backupFileName(now: Date): string {
  return `foster-memories-backup-${now.toISOString().slice(0, 10)}.zip`;
}
