import { strToU8, zipSync } from 'fflate';
import type { Repositories } from '@/src/db';
import type { Media } from '@/src/types/media';
import type { Memory } from '@/src/types/memory';
import type { Milestone } from '@/src/types/milestone';
import type { Pet } from '@/src/types/pet';
import { formatDate } from '@/src/utils/dates';
import { MOOD_LABELS } from '@/src/utils/memoryLabels';
import { STATUS_LABELS, petSummary } from '@/src/utils/petLabels';

export type ExportFormat = 'pdf' | 'markdown' | 'json' | 'zip';

export const EXPORT_FORMATS: readonly { value: ExportFormat; label: string; ext: string; mimeType: string }[] = [
  { value: 'pdf', label: 'PDF memory book', ext: 'pdf', mimeType: 'application/pdf' },
  { value: 'markdown', label: 'Markdown', ext: 'md', mimeType: 'text/markdown' },
  { value: 'json', label: 'JSON backup', ext: 'json', mimeType: 'application/json' },
  { value: 'zip', label: 'ZIP with photos', ext: 'zip', mimeType: 'application/zip' },
];

export interface StoryMemory {
  memory: Memory;
  photos: Media[];
  tags: string[];
}

export interface PetStory {
  pet: Pet;
  /** Oldest first, so the story reads in order. */
  memories: StoryMemory[];
  milestones: Milestone[];
  exportedAt: string;
}

export async function loadPetStory(repos: Repositories, petId: string, now: Date): Promise<PetStory> {
  const pet = await repos.pets.getById(petId);
  if (!pet) throw new Error('Pet not found.');
  const summaries = (await repos.memories.list()).filter((memory) => memory.petId === petId).reverse();
  const memories = await Promise.all(
    summaries.map(async ({ photoPath: _path, photoCount: _count, ...memory }) => ({
      memory,
      photos: await repos.media.listByMemory(memory.id),
      tags: await repos.memories.getTags(memory.id),
    })),
  );
  const milestones = (await repos.milestones.list())
    .filter((milestone) => milestone.petId === petId)
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  return { pet, memories, milestones, exportedAt: now.toISOString() };
}

/** Every photo path the story refers to, cover first. */
export function storyPhotoPaths(story: PetStory): string[] {
  const paths = story.memories.flatMap(({ photos }) => photos.map((photo) => photo.localUri));
  if (story.pet.coverPhotoPath) paths.unshift(story.pet.coverPhotoPath);
  return [...new Set(paths)];
}

export function storyToJson(story: PetStory): string {
  const { coverPhotoPath: _cover, ...pet } = story.pet;
  return JSON.stringify(
    {
      app: 'Foster Memories',
      formatVersion: 1,
      exportedAt: story.exportedAt,
      pet: { ...pet, coverPhoto: story.pet.coverPhotoPath },
      memories: story.memories.map(({ memory, photos, tags }) => ({ ...memory, tags, photos })),
      milestones: story.milestones,
    },
    null,
    2,
  );
}

const memoryHeading = (memory: Memory) =>
  `${formatDate(memory.occurredAt)}${memory.title ? ` — ${memory.title}` : ''}${memory.isFavorite ? ' ★' : ''}`;

const memoryMeta = ({ memory, tags }: StoryMemory) =>
  [
    memory.mood ? `Mood: ${MOOD_LABELS[memory.mood]}` : null,
    memory.location ? `Location: ${memory.location}` : null,
    tags.length > 0 ? `Tags: ${tags.join(', ')}` : null,
  ].filter((line): line is string => line !== null);

const petLines = (pet: Pet) =>
  [
    petSummary(pet) || null,
    `Status: ${STATUS_LABELS[pet.status]}`,
    pet.arrivalDate ? `Arrived: ${formatDate(pet.arrivalDate)}` : null,
    pet.departureDate ? `Left: ${formatDate(pet.departureDate)}` : null,
  ].filter((line): line is string => line !== null);

const petSections = (pet: Pet) =>
  [
    ['Backstory', pet.backstory],
    ['Personality', pet.personality],
    ['Notes', pet.notes],
  ].filter((section): section is [string, string] => Boolean(section[1]));

/** Photo links point at `media/...`, matching the ZIP layout. */
export function storyToMarkdown(story: PetStory, { photoLinks }: { photoLinks: boolean }): string {
  const { pet } = story;
  const out = [`# ${pet.name}`, '', ...petLines(pet).map((line) => `- ${line}`), ''];
  for (const [title, text] of petSections(pet)) out.push(`## ${title}`, '', text, '');
  if (story.milestones.length > 0) {
    out.push('## Milestones', '');
    for (const m of story.milestones) out.push(`- ${formatDate(m.occurredAt)}: ${m.label}${m.notes ? ` — ${m.notes}` : ''}`);
    out.push('');
  }
  out.push('## Memories', '');
  if (story.memories.length === 0) out.push('No memories yet.', '');
  for (const entry of story.memories) {
    out.push(`### ${memoryHeading(entry.memory)}`, '');
    if (entry.memory.body) out.push(entry.memory.body, '');
    const meta = memoryMeta(entry);
    if (meta.length > 0) out.push(...meta.map((line) => `- ${line}`), '');
    if (photoLinks) {
      entry.photos.forEach((photo, i) => out.push(`![Photo ${i + 1}](${photo.localUri})`));
      if (entry.photos.length > 0) out.push('');
    }
  }
  out.push(`_Exported from Foster Memories on ${formatDate(story.exportedAt.slice(0, 10))}._`, '');
  return out.join('\n');
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const paragraphs = (text: string) =>
  text
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('');

/** `photoSrc` maps a photo path to an image src (e.g. a data URI); missing photos are skipped. */
export function storyToHtml(story: PetStory, photoSrc: Record<string, string>): string {
  const { pet } = story;
  const img = (path: string, alt: string, cls = '') =>
    photoSrc[path] ? `<img class="${cls}" src="${photoSrc[path]}" alt="${escapeHtml(alt)}">` : '';
  const milestones = story.milestones
    .map((m) => `<li>${escapeHtml(`${formatDate(m.occurredAt)}: ${m.label}${m.notes ? ` — ${m.notes}` : ''}`)}</li>`)
    .join('');
  const memories = story.memories
    .map(
      (entry) => `<section class="memory">
<h3>${escapeHtml(memoryHeading(entry.memory))}</h3>
${entry.photos.map((photo, i) => img(photo.localUri, `Photo ${i + 1}`)).join('')}
${entry.memory.body ? paragraphs(entry.memory.body) : ''}
${memoryMeta(entry)
  .map((line) => `<p class="meta">${escapeHtml(line)}</p>`)
  .join('')}
</section>`,
    )
    .join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(pet.name)}</title>
<style>
body{font-family:sans-serif;color:#222;margin:32px;line-height:1.5}
h1{margin-bottom:4px}.meta{color:#666;margin:2px 0}
img{max-width:100%;max-height:420px;display:block;margin:12px auto;border-radius:8px}
.cover{max-height:320px}.memory{page-break-inside:avoid;border-top:1px solid #ddd;padding-top:12px;margin-top:20px}
</style></head><body>
${pet.coverPhotoPath ? img(pet.coverPhotoPath, `${pet.name} cover photo`, 'cover') : ''}
<h1>${escapeHtml(pet.name)}</h1>
${petLines(pet)
  .map((line) => `<p class="meta">${escapeHtml(line)}</p>`)
  .join('')}
${petSections(pet)
  .map(([title, text]) => `<h2>${title}</h2>${paragraphs(text)}`)
  .join('')}
${milestones ? `<h2>Milestones</h2><ul>${milestones}</ul>` : ''}
<h2>Memories</h2>
${memories || '<p>No memories yet.</p>'}
<p class="meta">Exported from Foster Memories on ${formatDate(story.exportedAt.slice(0, 10))}.</p>
</body></html>`;
}

/** story.md + story.json + photos under their own `media/...` paths. Stored, not deflated: photos are already compressed. */
export function storyZip(story: PetStory, photos: Record<string, Uint8Array>): Uint8Array {
  return zipSync(
    {
      'story.md': strToU8(storyToMarkdown(story, { photoLinks: true })),
      'story.json': strToU8(storyToJson(story)),
      ...photos,
    },
    { level: 0 },
  );
}

export function exportFileName(pet: Pet, ext: string, now: Date): string {
  const slug = pet.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'pet';
  return `${slug}-story-${now.toISOString().slice(0, 10)}.${ext}`;
}
