import { format, parseISO } from 'date-fns';
import type { MemorySummary } from '@/src/types/memory';
import type { Milestone } from '@/src/types/milestone';
import type { Pet } from '@/src/types/pet';

export type TimelineEntry =
  | { kind: 'memory'; item: MemorySummary }
  | { kind: 'milestone'; item: Milestone };

export interface TimelineGroup {
  /** e.g. "March 2026" */
  title: string;
  entries: TimelineEntry[];
}

/** Memories and milestones newest first, grouped by month. Milestones lead on the same day. */
export function buildTimeline(memories: MemorySummary[], milestones: Milestone[]): TimelineGroup[] {
  const entries: TimelineEntry[] = [
    ...milestones.map((item) => ({ kind: 'milestone' as const, item })),
    ...memories.map((item) => ({ kind: 'memory' as const, item })),
  ];
  // Stable sort keeps milestones first on ties and each list's own order.
  entries.sort((a, b) => b.item.occurredAt.localeCompare(a.item.occurredAt));

  const groups: TimelineGroup[] = [];
  for (const entry of entries) {
    const title = format(parseISO(entry.item.occurredAt), 'MMMM yyyy');
    const last = groups[groups.length - 1];
    if (last?.title === title) last.entries.push(entry);
    else groups.push({ title, entries: [entry] });
  }
  return groups;
}

export interface OnThisDay {
  memories: { item: MemorySummary; yearsAgo: number }[];
  departures: { pet: Pet; yearsAgo: number }[];
}

/** Memories and farewells from today's month and day in earlier years, most recent first. */
export function onThisDay(memories: MemorySummary[], pets: Pet[], today: Date = new Date()): OnThisDay {
  const monthDay = format(today, 'MM-dd');
  const year = today.getFullYear();
  // ISO dates: "YYYY-MM-DD". Null when the date isn't this day in an earlier year.
  const yearsAgo = (iso: string | null) => {
    if (!iso || iso.slice(5) !== monthDay) return null;
    const years = year - Number(iso.slice(0, 4));
    return years > 0 ? years : null;
  };
  const found = <T>(items: T[], date: (item: T) => string | null) =>
    items
      .flatMap((item) => {
        const years = yearsAgo(date(item));
        return years ? [{ item, yearsAgo: years }] : [];
      })
      .sort((a, b) => a.yearsAgo - b.yearsAgo);

  return {
    memories: found(memories, (m) => m.occurredAt),
    departures: found(pets, (p) => p.departureDate).map(({ item, yearsAgo: years }) => ({ pet: item, yearsAgo: years })),
  };
}
