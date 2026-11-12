import { Directory, File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { Repositories } from '@/src/db';
import {
  EXPORT_FORMATS,
  exportFileName,
  loadPetStory,
  storyPhotoPaths,
  storyToHtml,
  storyToJson,
  storyToMarkdown,
  storyZip,
  type ExportFormat,
} from './exportService';

/** Builds the export in app cache, then opens the share sheet. */
export async function exportPetStory(
  repos: Repositories,
  petId: string,
  format: ExportFormat,
  onProgress: (message: string) => void,
): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing isn’t available on this device.');
  const { ext, mimeType, label } = EXPORT_FORMATS.find((f) => f.value === format) ?? EXPORT_FORMATS[0];
  const now = new Date();

  onProgress('Gathering memories…');
  const story = await loadPetStory(repos, petId, now);

  // Old exports are removed so private copies don't pile up in cache.
  const dir = new Directory(Paths.cache, 'exports');
  if (dir.exists) dir.delete();
  dir.create({ intermediates: true, idempotent: true });
  const out = new File(dir, exportFileName(story.pet, ext, now));

  const paths = format === 'pdf' || format === 'zip' ? storyPhotoPaths(story) : [];
  const photos: Record<string, Uint8Array> = {};
  for (const [i, path] of paths.entries()) {
    onProgress(`Adding photos ${i + 1} of ${paths.length}…`);
    const file = new File(Paths.document, path);
    if (file.exists) photos[path] = await file.bytes(); // a missing photo is skipped, not fatal
  }

  if (format === 'markdown') await out.write(storyToMarkdown(story, { photoLinks: false }));
  else if (format === 'json') await out.write(storyToJson(story));
  else if (format === 'zip') await out.write(storyZip(story, photos));
  else {
    const src: Record<string, string> = {};
    for (const path of Object.keys(photos)) {
      src[path] = `data:image/jpeg;base64,${await new File(Paths.document, path).base64()}`;
    }
    onProgress('Making PDF…');
    // base64, not move: Print's output path can be outside what this app may read (Expo Go).
    const { base64 } = await Print.printToFileAsync({ html: storyToHtml(story, src), base64: true });
    if (!base64) throw new Error('Could not make the PDF. Please try again.');
    await out.write(base64, { encoding: 'base64' });
  }

  onProgress('Opening share sheet…');
  await Sharing.shareAsync(out.uri, { mimeType, dialogTitle: `Share ${story.pet.name} (${label})` });
}
