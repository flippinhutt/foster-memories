export interface Media {
  id: string;
  memoryId: string | null;
  petId: string;
  /** Path relative to the app's document directory on Android/iOS; a browser URI on web. */
  localUri: string;
  thumbnailUri: string | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  caption: string | null;
  takenAt: string | null;
  createdAt: string;
}
