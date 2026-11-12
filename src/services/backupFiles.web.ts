import type { Repositories } from '@/src/db';
import type { RestoreResult } from '@/src/db/repositories/backupRepository';

// shortcut: web backup lands in Phase 2 with real web storage.
export async function createBackup(_repos: Repositories, _onProgress: (message: string) => void): Promise<void> {
  throw new Error('Backup isn’t available on web yet.');
}

export async function restoreBackup(
  _repos: Repositories,
  _onProgress: (message: string) => void,
): Promise<RestoreResult | null> {
  throw new Error('Restore isn’t available on web yet.');
}
