import type { PickedPhoto } from './photoPicker';

/** Drag and drop is web only; on phones this does nothing. */
export function usePhotoDrop(
  _target: Readonly<{ current: unknown }>,
  _onDrop: (photos: PickedPhoto[], skipped: number) => void,
): boolean {
  return false;
}
