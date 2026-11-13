import { useEffect, useRef, useState } from 'react';
import type { PickedPhoto } from './photoPicker';

async function toPicked(file: File): Promise<PickedPhoto> {
  // Also proves the browser can decode it (HEIC, for one, often fails).
  const bitmap = await createImageBitmap(file);
  const photo = { uri: URL.createObjectURL(file), mimeType: file.type, width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return photo;
}

const hasFiles = (event: DragEvent) => event.dataTransfer?.types.includes('Files') ?? false;

/**
 * Lets the user drop image files onto `target`. Calls `onDrop` with the readable photos and how
 * many files were skipped. Returns true while files are dragged over the target.
 */
export function usePhotoDrop(
  target: Readonly<{ current: unknown }>,
  onDrop: (photos: PickedPhoto[], skipped: number) => void,
): boolean {
  const [over, setOver] = useState(false);
  const latest = useRef(onDrop);
  useEffect(() => {
    latest.current = onDrop;
  });

  useEffect(() => {
    const element: unknown = target.current;
    if (!(element instanceof HTMLElement)) return;

    const enter = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      setOver(true);
    };
    const leave = (event: DragEvent) => {
      if (!(event.relatedTarget instanceof Node && element.contains(event.relatedTarget))) setOver(false);
    };
    const drop = async (event: DragEvent) => {
      event.preventDefault();
      setOver(false);
      const files = [...(event.dataTransfer?.files ?? [])];
      const results = await Promise.allSettled(files.filter((file) => file.type.startsWith('image/')).map(toPicked));
      const photos = results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
      latest.current(photos, files.length - photos.length);
    };
    // A file dropped just outside the target would otherwise make the browser open it and leave the app.
    const block = (event: DragEvent) => {
      if (hasFiles(event)) event.preventDefault();
    };

    element.addEventListener('dragenter', enter);
    element.addEventListener('dragover', enter);
    element.addEventListener('dragleave', leave);
    element.addEventListener('drop', drop);
    window.addEventListener('dragover', block);
    window.addEventListener('drop', block);
    return () => {
      element.removeEventListener('dragenter', enter);
      element.removeEventListener('dragover', enter);
      element.removeEventListener('dragleave', leave);
      element.removeEventListener('drop', drop);
      window.removeEventListener('dragover', block);
      window.removeEventListener('drop', block);
    };
  }, [target]);

  return over;
}
