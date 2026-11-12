import { useLocalSearchParams, useRouter } from 'expo-router';
import { PetForm } from '@/src/components/PetForm';
import { Screen } from '@/src/components/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/src/components/StateViews';
import { toPetFormValues } from '@/src/services/petService';
import { selectPetById, usePetStore } from '@/src/stores/petStore';

export function EditPetScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const pet = usePetStore(selectPetById(id));
  const { status, error, load, update } = usePetStore();

  if (status === 'idle' || status === 'loading') return <LoadingState />;
  if (status === 'error') return <ErrorState message={error ?? 'Could not load this pet.'} onRetry={load} />;
  if (!pet) return <EmptyState title="Pet not found" message="This pet may have been removed." />;

  return (
    <Screen>
      <PetForm
        initialValues={toPetFormValues(pet)}
        submitLabel="Save changes"
        onSubmit={async (values) => {
          await update(pet, values);
          router.back();
        }}
      />
    </Screen>
  );
}
