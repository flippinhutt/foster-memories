import type { Milestone } from '@/src/types/milestone';
import type { SqlDatabase } from '../types';

export interface MilestoneRepository {
  /** All milestones, newest first. */
  list(): Promise<Milestone[]>;
  insert(milestone: Milestone): Promise<void>;
  delete(id: string): Promise<void>;
}

const COLUMNS = [
  'id',
  'petId',
  'memoryId',
  'label',
  'occurredAt',
  'category',
  'notes',
  'createdAt',
] as const satisfies readonly (keyof Milestone)[];

const byOrder = (a: Milestone, b: Milestone) =>
  b.occurredAt.localeCompare(a.occurredAt) || b.createdAt.localeCompare(a.createdAt);

export function createSqliteMilestoneRepository(db: SqlDatabase): MilestoneRepository {
  return {
    list: () =>
      db.getAllAsync<Milestone>(
        `SELECT ${COLUMNS.join(', ')} FROM milestones ORDER BY occurredAt DESC, createdAt DESC`,
        [],
      ),

    async insert(milestone) {
      await db.runAsync(
        `INSERT INTO milestones (${COLUMNS.join(', ')}) VALUES (${COLUMNS.map(() => '?').join(', ')})`,
        COLUMNS.map((column) => milestone[column]),
      );
    },

    async delete(id) {
      await db.runAsync('DELETE FROM milestones WHERE id = ?', [id]);
    },
  };
}

/** Non-persistent repository, used as a test double. */
export function createInMemoryMilestoneRepository(): MilestoneRepository {
  const milestones = new Map<string, Milestone>();
  return {
    list: async () => [...milestones.values()].sort(byOrder),
    insert: async (milestone) => {
      milestones.set(milestone.id, milestone);
    },
    delete: async (id) => {
      milestones.delete(id);
    },
  };
}
