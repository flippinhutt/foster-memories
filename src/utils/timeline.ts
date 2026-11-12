import { format, parseISO } from 'date-fns';
import type { MemorySummary } from '@/src/types/memory';
import type { Milestone } from '@/src/types/milestone';

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
