// Web keeps photos in the browser's private file storage (OPFS), under the same `media/<name>` paths as native.
const MEDIA_DIR = 'media';

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
};

/** Object URLs for stored photos, so mediaUri can stay synchronous like on native. */
const urls = new Map<string, string>();
let prepared: Promise<void> | null = null;

const fileName = (path: string) => path.slice(MEDIA_DIR.length + 1);

async function mediaDir(): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle(MEDIA_DIR, { create: true });
}

async function remember(path: string, handle: FileSystemFileHandle): Promise<void> {
  const old = urls.get(path);
  if (old) URL.revokeObjectURL(old);
  urls.set(path, URL.createObjectURL(await handle.getFile()));
}

async function save(path: string, data: Blob): Promise<void> {
  const handle = await (await mediaDir()).getFileHandle(fileName(path), { create: true });
  const writable = await handle.createWritable();
  await writable.write(data);
  await writable.close();
  await remember(path, handle);
}

async function find(path: string): Promise<FileSystemFileHandle | null> {
  try {
    return await (await mediaDir()).getFileHandle(fileName(path));
  } catch {
    return null;
  }
}

/** Loads URLs for every stored photo once, before the app shows any. */
export function prepareMediaUris(): Promise<void> {
  prepared ??= (async () => {
    // Ask the browser not to evict our data under storage pressure; it may say no.
    await navigator.storage.persist?.().catch(() => false);
    for await (const [name, handle] of await mediaDir()) {
      if (handle.kind === 'file') await remember(`${MEDIA_DIR}/${name}`, handle);
    }
  })().catch((error: unknown) => {
    prepared = null;
    throw error;
  });
  return prepared;
}

/** Copies a picked photo into browser storage and returns its `media/...` path. */
export async function importMediaFile(sourceUri: string, id: string, mimeType: string | null): Promise<string> {
  const path = `${MEDIA_DIR}/${id}.${(mimeType && EXTENSIONS[mimeType]) ?? 'jpg'}`;
  await save(path, await (await fetch(sourceUri)).blob());
  return path;
}

export function mediaUri(path: string): string {
  return urls.get(path) ?? path;
}

/** Best effort: a missing file must never block deleting its record. */
export function deleteMediaFile(path: string): void {
  const url = urls.get(path);
  if (url) URL.revokeObjectURL(url);
  urls.delete(path);
  mediaDir()
    .then((dir) => dir.removeEntry(fileName(path)))
    .catch(() => undefined);
}

export async function readMediaBytes(path: string): Promise<Uint8Array | null> {
  const handle = await find(path);
  return handle ? new Uint8Array(await (await handle.getFile()).arrayBuffer()) : null;
}

export async function writeMediaBytes(path: string, bytes: Uint8Array): Promise<void> {
  if (!(await find(path))) await save(path, new Blob([new Uint8Array(bytes)]));
}
