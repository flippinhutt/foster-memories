import { create } from 'zustand';
import { getRepositories } from '@/src/db';
import { createMilestone, type MilestoneFormValues } from '@/src/services/milestoneService';
import type { Milestone } from '@/src/types/milestone';

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface MilestoneState {
  /** Every milestone, newest first. */
  milestones: Milestone[];
  status: LoadStatus;
  error: string | null;
  load: () => Promise<void>;
  create: (values: MilestoneFormValues) => Promise<Milestone>;
  remove: (milestoneId: string) => Promise<void>;
}

const message = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong.';

export const useMilestoneStore = create<MilestoneState>((set, get) => ({
  milestones: [],
  status: 'idle',
  error: null,

  async load() {
    if (get().status !== 'ready') set({ status: 'loading', error: null });
    try {
      const { milestones } = await getRepositories();
      set({ milestones: await milestones.list(), status: 'ready' });
    } catch (error) {
      set({ status: 'error', error: message(error) });
    }
  },

  async create(values) {
    const { milestones } = await getRepositories();
    const milestone = await createMilestone(milestones, values);
    await get().load();
    return milestone;
  },

  async remove(milestoneId) {
    const { milestones } = await getRepositories();
    await milestones.delete(milestoneId);
    await get().load();
  },
}));
