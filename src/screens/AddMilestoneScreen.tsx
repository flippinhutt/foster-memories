import { useLocalSearchParams, useRouter } from 'expo-router';
import { MilestoneForm } from '@/src/components/MilestoneForm';
import { Screen } from '@/src/components/Screen';
import { EmptyState } from '@/src/components/StateViews';
import { emptyMilestoneForm } from '@/src/services/milestoneService';
import { useMemoryStore } from '@/src/stores/memoryStore';
import { useMilestoneStore } from '@/src/stores/milestoneStore';
import { selectPetById, usePetStore } from '@/src/stores/petStore';
import { toDisplayDate } from '@/src/utils/dates';

export function AddMilestoneScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const pet = usePetStore(selectPetById(id));
  const allMemories = useMemoryStore((state) => state.memories);
  const create = useMilestoneStore((state) => state.create);

  if (!pet) return <EmptyState title="Pet not found" message="This pet may have been removed." />;

  return (
    <Screen>
      <MilestoneForm
        memories={allMemories.filter((memory) => memory.petId === pet.id)}
        initialValues={{ ...emptyMilestoneForm, petId: pet.id, occurredAt: toDisplayDate(new Date()) }}
        onSubmit={async (values) => {
          await create(values);
          router.back();
        }}
      />
    </Screen>
  );
}
