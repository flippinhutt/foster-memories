import { memoryFixture, milestoneFixture, petFixture } from '@/test/fixtures';
import { allTags, search, type SearchData } from '../search';

const summary = (overrides: Parameters<typeof memoryFixture>[0]) => ({
  ...memoryFixture(overrides),
  photoPath: null,
  photoCount: 0,
});

const data: SearchData = {
  pets: [petFixture({ id: 'p1', name: 'Luna' }), petFixture({ id: 'p2', name: 'Biscuit', species: 'Dog' })],
  memories: [
    summary({ id: 'm1', title: 'Park zoomies', location: 'Riverside', isFavorite: true }),
    summary({ id: 'm2', title: 'Nap', body: 'Snoring on the couch' }),
    summary({ id: 'm3', title: 'Vet visit' }),
  ],
  milestones: [milestoneFixture({ id: 's1', label: 'First walk', notes: 'To the park' })],
  tagsByMemory: { m1: ['Silly', 'Outside'], m2: ['silly'], m3: ['Vet'] },
};

const filters = { query: '', tag: '', favoritesOnly: false };

describe('search', () => {
  it('returns nothing without a query or filter', () => {
    expect(search(data, filters)).toEqual({ pets: [], memories: [], milestones: [], tags: [] });
  });

  it('matches pets, memory text, locations, tags, and milestones, ignoring case', () => {
    const park = search(data, { ...filters, query: 'PARK' });
    expect(park.memories.map((m) => m.id)).toEqual(['m1']);
    expect(park.milestones.map((m) => m.id)).toEqual(['s1']);

    expect(search(data, { ...filters, query: 'couch' }).memories.map((m) => m.id)).toEqual(['m2']);
    expect(search(data, { ...filters, query: 'riverside' }).memories.map((m) => m.id)).toEqual(['m1']);
    expect(search(data, { ...filters, query: 'dog' }).pets.map((p) => p.id)).toEqual(['p2']);

    const silly = search(data, { ...filters, query: 'sil' });
    expect(silly.tags).toEqual(['Silly']);
    expect(silly.memories.map((m) => m.id)).toEqual(['m1', 'm2']);
  });

  it('filters memories by tag and favorites without a query', () => {
    expect(search(data, { ...filters, tag: 'SILLY' }).memories.map((m) => m.id)).toEqual(['m1', 'm2']);
    expect(search(data, { ...filters, favoritesOnly: true }).memories.map((m) => m.id)).toEqual(['m1']);
    expect(search(data, { ...filters, tag: 'Vet', favoritesOnly: true }).memories).toEqual([]);
    expect(search(data, { ...filters, tag: 'silly', query: 'nap' }).memories.map((m) => m.id)).toEqual(['m2']);
  });
});

describe('allTags', () => {
  it('lists each tag once, A to Z', () => {
    expect(allTags(data.tagsByMemory)).toEqual(['Outside', 'Silly', 'Vet']);
  });
});
