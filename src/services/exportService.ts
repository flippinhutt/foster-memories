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

/** The story without the given photos (cover included), for exports that embed photos. */
export function withoutPhotos(story: PetStory, skip: ReadonlySet<string>): PetStory {
  if (skip.size === 0) return story;
  const coverPhotoPath = story.pet.coverPhotoPath && !skip.has(story.pet.coverPhotoPath) ? story.pet.coverPhotoPath : null;
  return {
    ...story,
    pet: { ...story.pet, coverPhotoPath },
    memories: story.memories.map((entry) => ({ ...entry, photos: entry.photos.filter((p) => !skip.has(p.localUri)) })),
  };
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
// Small fixed tilts so photos and cards look hand-placed but print the same every time.
const TILTS = [-2.5, 1.8, -1.2, 2.6, -0.8, 1.4];
const tilt = (i: number, scale = 1) => `transform:rotate(${TILTS[i % TILTS.length] * scale}deg)`;

/** A scrapbook-style memory book. Fonts are system ones so nothing is fetched while printing. */
export function storyToHtml(story: PetStory, photoSrc: Record<string, string>): string {
  const { pet } = story;
  const polaroid = (path: string, alt: string, i: number, cls = '') =>
    photoSrc[path]
      ? `<figure class="polaroid ${cls}" style="${tilt(i)}"><span class="tape"></span><img src="${photoSrc[path]}" alt="${escapeHtml(alt)}"></figure>`
      : '';
  const chips = (lines: string[]) => lines.map((line) => `<span class="chip">${escapeHtml(line)}</span>`).join('');
  const milestones = story.milestones
    .map(
      (m, i) => `<div class="sticker" style="${tilt(i + 1)}"><b>${escapeHtml(m.label)}</b><small>${escapeHtml(formatDate(m.occurredAt))}</small>${
        m.notes ? `<p>${escapeHtml(m.notes)}</p>` : ''
      }</div>`,
    )
    .join('');
  const memories = story.memories
    .map((entry, n) => {
      const { memory } = entry;
      const photos = entry.photos.map((photo, i) => polaroid(photo.localUri, `Photo ${i + 1}`, n + i)).join('');
      return `<section class="memory">
<div class="date-tape" style="${tilt(n + 2)}">${escapeHtml(formatDate(memory.occurredAt))}</div>
${memory.title || memory.isFavorite ? `<h3>${escapeHtml(memory.title ?? '')}${memory.isFavorite ? ' <span class="fav">★</span>' : ''}</h3>` : ''}
${photos ? `<div class="photos">${photos}</div>` : ''}
${memory.body ? `<div class="note" style="${tilt(n + 3, 0.3)}">${paragraphs(memory.body)}</div>` : ''}
${chips(memoryMeta(entry))}
</section>`;
    })
    .join('\n');
  const sections = petSections(pet)
    .map(([title, text], i) => `<div class="note card" style="${tilt(i, 0.3)}"><h2>${title}</h2>${paragraphs(text)}</div>`)
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(pet.name)}</title>
<style>
@page{margin:0}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;background:#F6EFE6;color:#3B2A20;font-family:Georgia,'Noto Serif',serif;line-height:1.5}
.page{padding:40px 36px}
.hand,h1,h2,h3,.date-tape,.sticker b{font-family:'Dancing Script','Segoe Script',cursive;font-weight:700}
.cover{text-align:center;page-break-after:always;padding-top:56px}
h1{font-size:64px;margin:20px 0 8px;color:#A4532F}
.subtitle{font-size:22px;color:#8A6A55;margin:0 0 18px}
h2{font-size:30px;color:#A4532F;margin:0 0 6px}
h3{font-size:28px;margin:6px 0 10px}
.chip{display:inline-block;background:#fff;border:1.5px dashed #C9A68C;border-radius:999px;padding:2px 12px;margin:4px 4px 0 0;font-size:13px;color:#6B4A36}
.polaroid{display:inline-block;position:relative;background:#fff;padding:10px 10px 34px;margin:14px 10px;box-shadow:0 3px 8px rgba(59,42,32,.25);vertical-align:top}
.polaroid img{display:block;max-width:300px;max-height:300px}
.polaroid.big img{max-width:420px;max-height:420px}
.tape{position:absolute;top:-12px;left:50%;width:96px;height:26px;margin-left:-48px;background:rgba(228,184,140,.65);transform:rotate(-3deg)}
.photos{text-align:center}
.note{background:#FFFDF8;padding:6px 18px 0;line-height:28px;margin:12px 6px;box-shadow:0 2px 6px rgba(59,42,32,.18);background-image:repeating-linear-gradient(#FFFDF8 0 27px,#E8DCCF 27px 28px)}
.note p{margin:0 0 28px}.note p:last-child{margin:0}.note h2{line-height:28px;margin:0}
.card{margin:22px 10px}
.stickers{text-align:center}
.sticker{display:inline-block;width:190px;background:#FBE3D2;border:3px solid #fff;border-radius:18px;padding:12px;margin:10px;box-shadow:0 2px 6px rgba(59,42,32,.2);vertical-align:top}
.sticker b{display:block;font-size:22px;color:#A4532F}
.sticker small{color:#8A6A55}
.sticker p{margin:6px 0 0;font-size:13px}
.memory{page-break-inside:avoid;margin:40px 0 0;padding-top:8px}
.date-tape{display:inline-block;background:rgba(164,83,47,.85);color:#fff;font-size:20px;padding:2px 18px}
.fav{color:#D08A2E}
.empty{text-align:center;color:#8A6A55}
footer{text-align:center;color:#8A6A55;font-size:13px;margin-top:48px}
</style></head><body>
<div class="page cover">
${pet.coverPhotoPath ? polaroid(pet.coverPhotoPath, `${pet.name} cover photo`, 0, 'big') : ''}
<h1>${escapeHtml(pet.name)}</h1>
<p class="subtitle hand">A foster memory book</p>
${chips(petLines(pet))}
</div>
<div class="page">
${sections}
${milestones ? `<h2>Milestones</h2><div class="stickers">${milestones}</div>` : ''}
<h2>Memories</h2>
${memories || '<p class="empty">No memories yet.</p>'}
<footer>Made with Foster Memories on ${formatDate(story.exportedAt.slice(0, 10))}.</footer>
</div>
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
