import {
  launchCameraAsync,
  launchImageLibraryAsync,
  requestCameraPermissionsAsync,
  type ImagePickerAsset,
} from 'expo-image-picker';

export interface PickedPhoto {
  uri: string;
  mimeType: string | null;
  width: number;
  height: number;
  /** Video clips only. */
  durationSeconds?: number;
}

const toPicked = (asset: ImagePickerAsset): PickedPhoto => ({
  uri: asset.uri,
  mimeType: asset.mimeType ?? (asset.type === 'video' ? 'video/mp4' : null),
  width: asset.width,
  height: asset.height,
  ...(asset.type === 'video' && asset.duration ? { durationSeconds: asset.duration / 1000 } : {}),
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

/** Same system picker, for several photos or video clips at once. Returns [] if the user cancels. */
export async function pickPhotos(): Promise<PickedPhoto[]> {
  const result = await launchImageLibraryAsync({
    mediaTypes: ['images', 'videos'],
    allowsMultipleSelection: true,
    selectionLimit: 20,
    orderedSelection: true,
    quality: 0.8,
  });
  return result.canceled ? [] : result.assets.map(toPicked);
}

/**
 * Opens the camera for one photo. Returns 'denied' without camera permission, null if the
 * user backs out. The photo goes straight to app storage, not the gallery.
 */
export async function takePhoto(): Promise<PickedPhoto | 'denied' | null> {
  const permission = await requestCameraPermissionsAsync();
  if (!permission.granted) return 'denied';
  const result = await launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
  const asset = result.canceled ? undefined : result.assets[0];
  return asset ? toPicked(asset) : null;
}
