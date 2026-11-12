import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

/** Fails early, before any work, if the share sheet can't open. */
export async function assertCanSave(): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing isn’t available on this device.');
}

/** Writes the file to app cache, then opens the share sheet. */
export async function saveFile(name: string, data: Uint8Array | string, mimeType: string, title: string): Promise<void> {
  // Old exports are removed so private copies don't pile up in cache.
  const dir = new Directory(Paths.cache, 'exports');
  if (dir.exists) dir.delete();
  dir.create({ intermediates: true, idempotent: true });
  const out = new File(dir, name);
  await out.write(data);
  await Sharing.shareAsync(out.uri, { mimeType, dialogTitle: title });
}

/** Renders the HTML to a PDF and shares it. */
export async function savePdf(html: string, name: string, title: string): Promise<void> {
  // base64, not move: Print's output path can be outside what this app may read (Expo Go).
  const { base64 } = await Print.printToFileAsync({ html, base64: true });
  if (!base64) throw new Error('Could not make the PDF. Please try again.');
  const dir = new Directory(Paths.cache, 'exports');
  if (dir.exists) dir.delete();
  dir.create({ intermediates: true, idempotent: true });
  const out = new File(dir, name);
  await out.write(base64, { encoding: 'base64' });
  await Sharing.shareAsync(out.uri, { mimeType: 'application/pdf', dialogTitle: title });
}

/** Lets the user pick a ZIP file. Returns null if they cancel. */
export async function pickZip(): Promise<Uint8Array | null> {
  const picked = await DocumentPicker.getDocumentAsync({
    type: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'],
    copyToCacheDirectory: true,
  });
  if (picked.canceled || !picked.assets[0]) return null;
  const copy = new File(picked.assets[0].uri);
  const bytes = await copy.bytes();
  if (copy.exists) copy.delete();
  return bytes;
}
