import { createInMemoryMilestoneRepository } from '@/src/db/repositories/milestoneRepository';
import {
  createMilestone,
  emptyMilestoneForm,
  milestoneFormSchema,
  type MilestoneFormValues,
} from '../milestoneService';

const form = (overrides: Partial<MilestoneFormValues> = {}): MilestoneFormValues => ({
  ...emptyMilestoneForm,
  petId: 'pet-1',
  occurredAt: '03-20-2026',
  ...overrides,
});

describe('milestoneFormSchema', () => {
  it('needs a label and a valid date', () => {
    const result = milestoneFormSchema.safeParse(form({ label: '  ', occurredAt: '2026-03-20' }));
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      'Name this milestone.',
      'Use a date like 03-14-2026.',
    ]);
  });
});

describe('createMilestone', () => {
  it('saves a trimmed milestone with ISO date and optional memory link', async () => {
    const repo = createInMemoryMilestoneRepository();
    const now = new Date('2026-04-01T10:00:00.000Z');

    const linked = await createMilestone(
      repo,
      form({ label: ' First walk ', memoryId: 'memory-1', notes: 'Around the block' }),
      now,
    );
    const plain = await createMilestone(repo, form({ label: 'Adoption day' }), now);

    expect(linked).toMatchObject({
      petId: 'pet-1',
      label: 'First walk',
      occurredAt: '2026-03-20',
      memoryId: 'memory-1',
      notes: 'Around the block',
      category: null,
      createdAt: now.toISOString(),
    });
    expect(plain).toMatchObject({ memoryId: null, notes: null });
    expect(await repo.list()).toHaveLength(2);
  });
});
