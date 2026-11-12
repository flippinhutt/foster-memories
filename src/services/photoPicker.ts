import { launchImageLibraryAsync } from 'expo-image-picker';

export interface PickedPhoto {
  uri: string;
  mimeType: string | null;
  width: number;
  height: number;
}

/**
 * Opens the system photo picker. It needs no storage permission: the user picks one
 * photo and the app only gets that file. Returns null if the user cancels.
 */
export async function pickPhoto(): Promise<PickedPhoto | null> {
  const result = await launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });
  const asset = result.canceled ? undefined : result.assets[0];
  if (!asset) return null;
  return { uri: asset.uri, mimeType: asset.mimeType ?? null, width: asset.width, height: asset.height };
}
