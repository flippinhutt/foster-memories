import * as DocumentPicker from 'expo-document-picker';

export async function assertCanSave(): Promise<void> {}

/** Downloads the file through the browser. */
export async function saveFile(name: string, data: Uint8Array | string, mimeType: string, _title: string): Promise<void> {
  const blob = new Blob([typeof data === 'string' ? data : new Uint8Array(data)], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  // Give the browser a moment to start the download before freeing the data.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Opens the browser's print dialog for the book; choose "Save as PDF" there. */
export async function savePdf(html: string, _name: string, _title: string): Promise<void> {
  const frame = document.createElement('iframe');
  frame.style.position = 'fixed';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  frame.srcdoc = html;
  await new Promise<void>((resolve) => {
    frame.onload = () => resolve();
    document.body.appendChild(frame);
  });
  const win = frame.contentWindow;
  if (!win) throw new Error('Could not open the print dialog. Please try again.');
  win.addEventListener('afterprint', () => frame.remove(), { once: true });
  win.focus();
  win.print();
}

export async function pickZip(): Promise<Uint8Array | null> {
  const picked = await DocumentPicker.getDocumentAsync({ type: ['application/zip', '.zip'] });
  if (picked.canceled || !picked.assets[0]) return null;
  return new Uint8Array(await (await fetch(picked.assets[0].uri)).arrayBuffer());
}
