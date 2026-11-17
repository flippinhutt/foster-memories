import type { MediaRepository } from '@/src/db/repositories/mediaRepository';

interface MediaStore {
  list: () => Promise<string[]>;
  remove: (path: string) => void;
}

/**
 * Deletes app-private media files that no media row points at (left behind when a delete
 * was interrupted). Run before the app can import anything, so a new file can't be mid-save.
 */
export async function sweepOrphanMedia(media: MediaRepository, store: MediaStore): Promise<string[]> {
  const inUse = new Set(await media.listAllPaths());
  const orphans = (await store.list()).filter((path) => !inUse.has(path));
  for (const path of orphans) store.remove(path);
  return orphans;
}
