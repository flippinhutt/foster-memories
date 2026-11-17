const VIDEO_PATH = /\.(mp4|mov|webm|3gp|mkv)$/i;

/** Stored media is a video when its file says so; picked files (no extension) go by mime type. */
export function isVideo(path: string, mimeType?: string | null): boolean {
  return mimeType ? mimeType.startsWith('video/') : VIDEO_PATH.test(path);
}
