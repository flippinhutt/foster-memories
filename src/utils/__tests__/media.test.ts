import { isVideo } from '../media';

describe('isVideo', () => {
  it('reads the stored path or the mime type', () => {
    expect(isVideo('media/a.mp4')).toBe(true);
    expect(isVideo('media/a.MOV')).toBe(true);
    expect(isVideo('media/a.jpg')).toBe(false);
    expect(isVideo('blob:http://x/1', 'video/webm')).toBe(true);
    expect(isVideo('content://picker/1', 'image/jpeg')).toBe(false);
    expect(isVideo('content://picker/1', null)).toBe(false);
  });
});
