import type { Repositories } from '@/src/db';
import type { ExportFormat } from './exportService';

// shortcut: web export lands in Phase 2 with real web storage.
export async function exportPetStory(
  _repos: Repositories,
  _petId: string,
  _format: ExportFormat,
  _skipPhotos: ReadonlySet<string>,
  _onProgress: (message: string) => void,
): Promise<void> {
  throw new Error('Export isn’t available on web yet.');
}
