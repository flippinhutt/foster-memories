import { milestoneFixture, memoryFixture, petFixture } from '@/test/fixtures';
import type { MemorySummary } from '@/src/types/memory';
import { buildTimeline, onThisDay } from '../timeline';

const memory = (id: string, occurredAt: string): MemorySummary => ({
  ...memoryFixture({ id, occurredAt }),
  photoPath: null,
  photoCount: 0,
});

describe('buildTimeline', () => {
  it('merges memories and milestones newest first, grouped by month', () => {
    const groups = buildTimeline(
      [memory('m-apr', '2026-04-02'), memory('m-mar', '2026-03-15')],
      [milestoneFixture({ id: 's-mar', occurredAt: '2026-03-20' }), milestoneFixture({ id: 's-feb', occurredAt: '2026-02-01' })],
    );

    expect(groups.map((group) => [group.title, group.entries.map((entry) => entry.item.id)])).toEqual([
      ['April 2026', ['m-apr']],
      ['March 2026', ['s-mar', 'm-mar']],
      ['February 2026', ['s-feb']],
    ]);
    expect(groups[1].entries.map((entry) => entry.kind)).toEqual(['milestone', 'memory']);
  });

  it('puts a milestone before a memory on the same day', () => {
    const [group] = buildTimeline([memory('m', '2026-03-20')], [milestoneFixture({ id: 's', occurredAt: '2026-03-20' })]);
    expect(group.entries.map((entry) => entry.item.id)).toEqual(['s', 'm']);
  });

  it('returns no groups when empty', () => {
    expect(buildTimeline([], [])).toEqual([]);
  });
});

describe('onThisDay', () => {
  const today = new Date(2026, 10, 16);

  it('finds memories from this date in earlier years, newest first', () => {
    const result = onThisDay(
      [
        memory('this-year', '2026-11-16'),
        memory('two-years', '2024-11-16'),
        memory('other-day', '2025-11-15'),
        memory('last-year', '2025-11-16'),
      ],
      [],
      today,
    );
    expect(result.memories.map((m) => [m.item.id, m.yearsAgo])).toEqual([
      ['last-year', 1],
      ['two-years', 2],
    ]);
  });

  it('finds pets who left on this date in earlier years', () => {
    const result = onThisDay(
      [],
      [
        petFixture({ id: 'left', departureDate: '2025-11-16' }),
        petFixture({ id: 'today', departureDate: '2026-11-16' }),
        petFixture({ id: 'here', departureDate: null }),
      ],
      today,
    );
    expect(result.departures.map((d) => [d.pet.id, d.yearsAgo])).toEqual([['left', 1]]);
  });
});
