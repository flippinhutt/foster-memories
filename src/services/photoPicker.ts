import { launchImageLibraryAsync, type ImagePickerAsset } from 'expo-image-picker';

export interface PickedPhoto {
  uri: string;
  mimeType: string | null;
  width: number;
  height: number;
}

const toPicked = (asset: ImagePickerAsset): PickedPhoto => ({
  uri: asset.uri,
  mimeType: asset.mimeType ?? null,
  width: asset.width,
  height: asset.height,
});

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
  return asset ? toPicked(asset) : null;
}

/** Same system picker, for several photos at once. Returns [] if the user cancels. */
export async function pickPhotos(): Promise<PickedPhoto[]> {
  const result = await launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: 20,
    orderedSelection: true,
    quality: 0.8,
  });
  return result.canceled ? [] : result.assets.map(toPicked);
}
