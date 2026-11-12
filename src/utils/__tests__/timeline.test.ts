import { milestoneFixture, memoryFixture } from '@/test/fixtures';
import type { MemorySummary } from '@/src/types/memory';
import { buildTimeline } from '../timeline';

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
