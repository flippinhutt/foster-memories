import type { Repositories } from '@/src/db';
import {
  EXPORT_FORMATS,
  exportFileName,
  loadPetStory,
  photoDataUri,
  storyPhotoPaths,
  storyToHtml,
  storyToJson,
  storyToMarkdown,
  storyZip,
  withoutPhotos,
  type ExportFormat,
} from './exportService';
import { assertCanSave, saveFile, savePdf } from './deviceFiles';
import { readMediaBytes } from './mediaFiles';

/** Builds the export, then shares it (Android) or downloads it (web). */
export async function exportPetStory(
  repos: Repositories,
  petId: string,
  format: ExportFormat,
  /** Photo paths the user left out of a PDF or ZIP. */
  skipPhotos: ReadonlySet<string>,
  onProgress: (message: string) => void,
): Promise<void> {
  await assertCanSave();
  const { ext, mimeType, label } = EXPORT_FORMATS.find((f) => f.value === format) ?? EXPORT_FORMATS[0];
  const now = new Date();

  onProgress('Gathering memories…');
  const full = await loadPetStory(repos, petId, now);
  const story = format === 'pdf' || format === 'zip' ? withoutPhotos(full, skipPhotos) : full;
  const name = exportFileName(story.pet, ext, now);
  const title = `Share ${story.pet.name} (${label})`;

  const paths = format === 'pdf' || format === 'zip' ? storyPhotoPaths(story) : [];
  const photos: Record<string, Uint8Array> = {};
  for (const [i, path] of paths.entries()) {
    onProgress(`Adding photos ${i + 1} of ${paths.length}…`);
    const bytes = await readMediaBytes(path);
    if (bytes) photos[path] = bytes; // a missing photo is skipped, not fatal
  }

  if (format === 'pdf') {
    const src: Record<string, string> = {};
    for (const [path, bytes] of Object.entries(photos)) src[path] = photoDataUri(path, bytes);
    onProgress('Making PDF…');
    await savePdf(storyToHtml(story, src), name, title);
    return;
  }
  const data =
    format === 'markdown' ? storyToMarkdown(story, { photoLinks: false }) : format === 'json' ? storyToJson(story) : storyZip(story, photos);
  onProgress('Saving…');
  await saveFile(name, data, mimeType, title);
}

