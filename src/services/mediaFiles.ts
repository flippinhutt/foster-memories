import { Directory, File, Paths } from 'expo-file-system';

const MEDIA_DIR = 'media';

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
};

/**
 * Copies a picked file into app-private storage and returns its path relative to the
 * document directory. The original (e.g. in the camera roll) is never modified.
 */
export async function importMediaFile(sourceUri: string, id: string, mimeType: string | null): Promise<string> {
  const dir = new Directory(Paths.document, MEDIA_DIR);
  dir.create({ intermediates: true, idempotent: true });
  const name = `${id}.${(mimeType && EXTENSIONS[mimeType]) ?? 'jpg'}`;
  await new File(sourceUri).copy(new File(dir, name));
  return `${MEDIA_DIR}/${name}`;
}

/** Turns a stored relative path into a URI the Image component can load. */
export function mediaUri(path: string): string {
  return new File(Paths.document, path).uri;
}

/** Best effort: a missing or locked file must never block deleting its record. */
export function deleteMediaFile(path: string): void {
  try {
    const file = new File(Paths.document, path);
    if (file.exists) file.delete();
  } catch {
    // Ignore; an orphaned file is harmless and private to the app.
  }
}
