// shortcut: web keeps the browser's picked URI and stores nothing; real storage comes with Phase 2.
export async function importMediaFile(sourceUri: string, _id: string, _mimeType: string | null): Promise<string> {
  return sourceUri;
}

export function mediaUri(path: string): string {
  return path;
}

export function deleteMediaFile(_path: string): void {}
