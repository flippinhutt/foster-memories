export interface Milestone {
  id: string;
  petId: string;
  /** Optional linked memory. */
  memoryId: string | null;
  label: string;
  /** ISO date, YYYY-MM-DD */
  occurredAt: string;
  category: string | null;
  notes: string | null;
  createdAt: string;
}
