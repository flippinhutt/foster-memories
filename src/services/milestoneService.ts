import { randomUUID } from 'expo-crypto';
import { z } from 'zod';
import type { MilestoneRepository } from '@/src/db/repositories/milestoneRepository';
import type { Milestone } from '@/src/types/milestone';
import { displayToIsoDate, parseDisplayDate } from '@/src/utils/dates';

export const PRESET_MILESTONES = [
  'First day home',
  'First full meal',
  'First tail wag',
  'First purr',
  'First walk',
  'First play session',
  'First night outside a crate',
  'First vet visit',
  'Weight goal reached',
  'Adoption day',
] as const;

/** Form values: date is MM-DD-YYYY; memoryId is '' when not linked. */
export const milestoneFormSchema = z.object({
  petId: z.string().min(1),
  label: z.string().trim().min(1, 'Name this milestone.').max(120, 'Keep this under 120 characters.'),
  occurredAt: z
    .string()
    .trim()
    .refine((value) => parseDisplayDate(value) !== null, 'Use a date like 03-14-2026.'),
  memoryId: z.string(),
  notes: z.string().trim().max(2000, 'Keep this under 2000 characters.'),
});

export type MilestoneFormValues = z.input<typeof milestoneFormSchema>;

export const emptyMilestoneForm: MilestoneFormValues = {
  petId: '',
  label: '',
  occurredAt: '',
  memoryId: '',
  notes: '',
};

export async function createMilestone(
  repo: MilestoneRepository,
  values: MilestoneFormValues,
  now: Date = new Date(),
): Promise<Milestone> {
  const parsed = milestoneFormSchema.parse(values);
  const milestone: Milestone = {
    id: randomUUID(),
    petId: parsed.petId,
    memoryId: parsed.memoryId === '' ? null : parsed.memoryId,
    label: parsed.label,
    occurredAt: displayToIsoDate(parsed.occurredAt),
    category: null,
    notes: parsed.notes === '' ? null : parsed.notes,
    createdAt: now.toISOString(),
  };
  await repo.insert(milestone);
  return milestone;
}
