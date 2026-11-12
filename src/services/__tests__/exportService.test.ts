import { strFromU8, unzipSync } from 'fflate';
import {
  escapeHtml,
  exportFileName,
  storyPhotoPaths,
  storyToHtml,
  storyToJson,
  storyToMarkdown,
  storyZip,
  withoutPhotos,
  type PetStory,
} from '../exportService';
import { mediaFixture, memoryFixture, milestoneFixture, petFixture } from '@/test/fixtures';

const story: PetStory = {
  pet: petFixture({ coverPhotoPath: 'media/cover.jpg', backstory: 'Found <outside>.' }),
  memories: [
    {
      memory: memoryFixture({ body: 'Slept all day.', mood: 'sweet', isFavorite: true }),
      photos: [mediaFixture({ memoryId: 'memory-1' })],
      tags: ['nap'],
    },
  ],
  milestones: [milestoneFixture()],
  exportedAt: '2026-04-01T12:00:00.000Z',
};

describe('exportService', () => {
  it('lists cover and memory photos once', () => {
    expect(storyPhotoPaths(story)).toEqual(['media/cover.jpg', 'media/media-1.jpg']);
  });

  it('leaves out skipped photos, cover included', () => {
    const trimmed = withoutPhotos(story, new Set(['media/cover.jpg', 'media/media-1.jpg']));
    expect(trimmed.pet.coverPhotoPath).toBeNull();
    expect(trimmed.memories[0].photos).toEqual([]);
    expect(storyPhotoPaths(trimmed)).toEqual([]);
    expect(withoutPhotos(story, new Set(['media/cover.jpg'])).memories[0].photos).toHaveLength(1);
  });

  it('writes JSON with memories, tags, photos, milestones', () => {
    const data = JSON.parse(storyToJson(story));
    expect(data.formatVersion).toBe(1);
    expect(data.pet.name).toBe('Luna');
    expect(data.memories[0].tags).toEqual(['nap']);
    expect(data.memories[0].photos[0].localUri).toBe('media/media-1.jpg');
    expect(data.milestones[0].label).toBe('First purr');
  });

  it('writes Markdown with optional photo links', () => {
    const md = storyToMarkdown(story, { photoLinks: true });
    expect(md).toContain('# Luna');
    expect(md).toContain('First nap');
    expect(md).toContain('Slept all day.');
    expect(md).toContain('First purr');
    expect(md).toContain('](media/media-1.jpg)');
    expect(storyToMarkdown(story, { photoLinks: false })).not.toContain('](media/');
  });

  it('escapes HTML and skips missing photos', () => {
    const html = storyToHtml(story, { 'media/media-1.jpg': 'data:image/jpeg;base64,AAA' });
    expect(html).toContain('Found &lt;outside&gt;.');
    expect(html).toContain('data:image/jpeg;base64,AAA');
    expect(html).not.toContain('media/cover.jpg');
    expect(escapeHtml(`"a"&'b'`)).toBe('&quot;a&quot;&amp;&#39;b&#39;');
  });

  it('zips story files and photos', () => {
    const files = unzipSync(storyZip(story, { 'media/media-1.jpg': new Uint8Array([1, 2, 3]) }));
    expect(Object.keys(files).sort()).toEqual(['media/media-1.jpg', 'story.json', 'story.md']);
    expect(strFromU8(files['story.md'])).toContain('# Luna');
    expect([...files['media/media-1.jpg']]).toEqual([1, 2, 3]);
  });

  it('builds a safe file name', () => {
    expect(exportFileName(petFixture({ name: 'Mr. Whiskers!' }), 'pdf', new Date('2026-04-01T12:00:00Z'))).toBe(
      'mr-whiskers-story-2026-04-01.pdf',
    );
  });
});
